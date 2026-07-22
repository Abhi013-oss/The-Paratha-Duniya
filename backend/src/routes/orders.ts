import { Router, Request, Response } from 'express';
import prisma from '../config/db';
import { authenticateAdmin } from '../middleware/auth';
import * as jwt from 'jsonwebtoken';
import { sendAutomatedWhatsApp } from '../services/whatsappService';

const router = Router();

// Helper to decode customer JWT token if present
function getCustomerFromToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'the_paratha_duniya_secret_key_2026_premium_luxury';
    return jwt.verify(token, secret) as { id: number; phone: string; email?: string | null; name: string };
  } catch (e) {
    return null;
  }
}

// Helper to generate a unique Order Number (e.g., TPD-10023)
async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  const nextNumber = 10000 + count + 1;
  return `TPD-${nextNumber}`;
}

// Customer: Get active cart from server
router.get('/active-cart', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  const authCustomer = getCustomerFromToken(authHeader);

  if (!authCustomer) {
    res.status(401).json({ error: 'Access denied. Valid customer token is required.' });
    return;
  }

  try {
    const cartOrder = await prisma.order.findFirst({
      where: {
        customerId: authCustomer.id,
        status: 'CART',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cartOrder) {
      res.json({ items: [] });
      return;
    }

    const formattedItems = cartOrder.items.map(it => ({
      id: it.product.id,
      name: it.product.name,
      price: it.product.price,
      image: it.product.image,
      isVeg: it.product.isVeg,
      quantity: it.quantity,
    }));

    res.json({ items: formattedItems });
  } catch (error) {
    console.error('Fetch active cart error:', error);
    res.status(500).json({ error: 'Failed to retrieve active cart.' });
  }
});

// Customer: Sync active cart to the server
router.post('/sync-cart', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  const authCustomer = getCustomerFromToken(authHeader);

  if (!authCustomer) {
    res.status(401).json({ error: 'Access denied. Valid customer token is required.' });
    return;
  }

  const { items } = req.body;

  try {
    // 1. If cart is empty, delete the existing CART status order if it exists
    if (!items || items.length === 0) {
      await prisma.order.deleteMany({
        where: {
          customerId: authCustomer.id,
          status: 'CART',
        },
      });
      res.json({ message: 'Cart cleared successfully.' });
      return;
    }

    // 2. Fetch products and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: Number(item.productId) },
      });

      if (product && product.isActive) {
        total += product.price * Number(item.quantity);
        orderItems.push({
          productId: product.id,
          quantity: Number(item.quantity),
          price: product.price,
        });
      }
    }

    if (orderItems.length === 0) {
      await prisma.order.deleteMany({
        where: {
          customerId: authCustomer.id,
          status: 'CART',
        },
      });
      res.json({ message: 'Cart items resolved to empty.' });
      return;
    }

    // 3. Find if there is an existing CART order
    const existingCart = await prisma.order.findFirst({
      where: {
        customerId: authCustomer.id,
        status: 'CART',
      },
    });

    if (existingCart) {
      // Delete existing order items
      await prisma.orderItem.deleteMany({
        where: { orderId: existingCart.id },
      });

      // Update cart total
      const updatedCart = await prisma.order.update({
        where: { id: existingCart.id },
        data: {
          subtotal: total,
          total: total,
          items: {
            create: orderItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      res.json({ message: 'Cart synced successfully.', orderId: updatedCart.id });
    } else {
      // Create new CART order
      const orderNumber = `CART-${authCustomer.id}-${Date.now().toString().slice(-4)}`;
      const newCart = await prisma.order.create({
        data: {
          orderNumber,
          customerId: authCustomer.id,
          subtotal: total,
          total: total,
          status: 'CART',
          paymentStatus: 'PENDING',
          paymentMethod: 'COD',
          items: {
            create: orderItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      res.json({ message: 'Cart synced successfully.', orderId: newCart.id });
    }
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ error: 'Failed to sync cart.' });
  }
});

// Customer: Get my orders
router.get('/my-orders', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  const authCustomer = getCustomerFromToken(authHeader);

  if (!authCustomer) {
    res.status(401).json({ error: 'Access denied. No valid customer token provided.' });
    return;
  }

  try {
    const orders = await prisma.order.findMany({
      where: { 
        customerId: authCustomer.id,
        status: { not: 'CART' }
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, image: true, isVeg: true },
            },
          },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('My orders fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// Public: Place a new order
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const {
    customerName,
    phone,
    email,
    houseNo,
    address,
    landmark,
    pincode,
    deliveryInstructions,
    items, // Array of { productId, quantity }
    paymentMethod,
    couponCode,
    paymentId,
  } = req.body;

  if (!customerName || !phone || !address || !pincode || !items || items.length === 0) {
    res.status(400).json({ error: 'Required fields are missing: Customer name, phone, address, pincode, or items.' });
    return;
  }

  try {
    // 1. Resolve Customer profile
    const authCustomer = getCustomerFromToken(req.headers.authorization);
    let customer = null;

    if (authCustomer) {
      // Find customer by logged-in ID
      customer = await prisma.customer.findUnique({
        where: { id: authCustomer.id },
      });
    }

    if (customer) {
      // Update logged-in customer's details
      try {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName,
            phone: String(phone).trim(),
            email: email || customer.email,
            houseNo: houseNo || customer.houseNo,
            address,
            landmark: landmark || customer.landmark,
            pincode,
            deliveryInstructions: deliveryInstructions || customer.deliveryInstructions,
          },
        });
      } catch (err) {
        // If unique phone constraint fails, link order to the existing customer profile with that phone
        const existingCustomer = await prisma.customer.findUnique({
          where: { phone: String(phone).trim() },
        });
        if (existingCustomer) {
          customer = await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: customerName,
              email: email || existingCustomer.email,
              houseNo: houseNo || existingCustomer.houseNo,
              address,
              landmark: landmark || existingCustomer.landmark,
              pincode,
              deliveryInstructions: deliveryInstructions || existingCustomer.deliveryInstructions,
            },
          });
        }
      }
    } else {
      // Guest Checkout - Find or create customer by phone number
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: String(phone).trim() },
      });

      if (existingCustomer) {
        customer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: customerName,
            email: email || existingCustomer.email,
            houseNo: houseNo || existingCustomer.houseNo,
            address,
            landmark: landmark || existingCustomer.landmark,
            pincode,
            deliveryInstructions: deliveryInstructions || existingCustomer.deliveryInstructions,
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            name: customerName,
            phone: String(phone).trim(),
            email: email || null,
            houseNo: houseNo || null,
            address,
            landmark: landmark || null,
            pincode,
            deliveryInstructions: deliveryInstructions || null,
          },
        });
      }
    }

    if (!customer) {
      res.status(500).json({ error: 'Failed to resolve customer profile.' });
      return;
    }

    // 2. Fetch products and calculate subtotal
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: Number(item.productId) },
      });

      if (!product || !product.isActive) {
        res.status(404).json({ error: `Product with ID ${item.productId} is not available.` });
        return;
      }

      const itemPrice = product.price;
      const quantity = Number(item.quantity);
      subtotal += itemPrice * quantity;

      orderItemsData.push({
        productId: product.id,
        quantity,
        price: itemPrice,
      });
    }

    // 3. Process Coupon Discount
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(couponCode).toUpperCase().trim() },
      });

      if (coupon && coupon.isActive) {
        const canUse = coupon.maxUses === null || coupon.usesCount < coupon.maxUses;
        const meetsMin = subtotal >= coupon.minOrderValue;

        if (canUse && meetsMin) {
          appliedCoupon = coupon;
          if (coupon.discountType === 'PERCENTAGE') {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
          } else if (coupon.discountType === 'FIXED') {
            discount = coupon.discountValue;
          }
          discount = Math.min(discount, subtotal);
        }
      }
    }

    const total = subtotal - discount;
    const orderNumber = await generateOrderNumber();

    // Delete any active CART status order to prevent it from lingering
    await prisma.order.deleteMany({
      where: {
        customerId: customer.id,
        status: 'CART',
      },
    });

    // 4. Create the Order
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        subtotal,
        discount,
        total,
        status: 'PENDING',
        paymentStatus: (paymentMethod === 'COD' || paymentMethod === 'UPI') ? 'PENDING' : 'PAID',
        paymentMethod,
        paymentId: paymentId || null,
        specialInstructions: deliveryInstructions || null,
        couponId: appliedCoupon ? appliedCoupon.id : null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, image: true },
            },
          },
        },
        customer: true,
      },
    });

    // 5. Update coupon usage count if successfully applied
    if (appliedCoupon) {
      await prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: {
          usesCount: {
            increment: 1,
          },
        },
      });
    }

    // 6. Simulated Kitchen Confirmation:
    // Transition status to PREPARING after 5 seconds
    setTimeout(async () => {
      try {
        const orderCheck = await prisma.order.findUnique({ where: { id: newOrder.id } });
        if (orderCheck && orderCheck.status === 'PENDING') {
          await prisma.order.update({
            where: { id: newOrder.id },
            data: { status: 'PREPARING' },
          });
          console.log(`[Simulated Kitchen] Auto-confirmed order ${newOrder.orderNumber} to PREPARING.`);
        }
      } catch (err) {
        console.error('Kitchen auto-confirmation simulation error:', err);
      }
    }, 5000);

    // 6. Automated Background WhatsApp Sender (Customer & Admin)
    sendAutomatedWhatsApp(
      customer.phone,
      `Hello ${customer.name}! 🫓\n\nYour order *${newOrder.orderNumber}* (Total: ₹${newOrder.total}) has been successfully placed at *The Paratha Duniya*!\n\nKitchen Origin: Manoj Residency, Moula Ali, Secunderabad.\n\nView invoice: https://the-paratha-duniya.vercel.app/order-success?orderId=${newOrder.orderNumber}`
    );

    // 7. Instant Admin Phone Notification Alert
    const adminPhone = process.env.ADMIN_PHONE_NUMBER || '+919492760128';
    sendAutomatedWhatsApp(
      adminPhone,
      `🚨 *NEW ORDER RECEIVED!* 🫓\n\n*Order Number:* ${newOrder.orderNumber}\n*Customer:* ${customer.name} (${customer.phone})\n*Total Amount:* ₹${newOrder.total}\n*Payment Method:* ${newOrder.paymentMethod}\n*Delivery Address:* ${customer.houseNo || ''} ${customer.address || ''}\n\nReview & Confirm Order: https://the-paratha-duniya.vercel.app/admin`
    );

    res.status(201).json({
      message: 'Order created successfully.',
      order: newOrder,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to process order. Please try again.' });
  }
});

// Public: Track an order by Order Number
router.get('/track/:orderNumber', async (req: Request, res: Response): Promise<void> => {
  const { orderNumber } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: String(orderNumber).toUpperCase() },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, image: true, isVeg: true },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
            houseNo: true,
            landmark: true,
            pincode: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to retrieve tracking information.' });
  }
});

// Admin: Get all orders (with filters and search)
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, paymentMethod, paymentStatus, search } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = String(status);
    } else {
      whereClause.status = { not: 'CART' };
    }

    if (paymentMethod) {
      whereClause.paymentMethod = String(paymentMethod);
    }

    if (paymentStatus) {
      whereClause.paymentStatus = String(paymentStatus);
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: String(search) } },
        {
          customer: {
            OR: [
              { name: { contains: String(search) } },
              { phone: { contains: String(search) } },
            ],
          },
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: { name: true, isVeg: true },
            },
          },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Admin: Update order status & payment status
router.put('/:id/status', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  try {
    const existing = await prisma.order.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        status: status !== undefined ? String(status) : existing.status,
        paymentStatus: paymentStatus !== undefined ? String(paymentStatus) : existing.paymentStatus,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (status === 'PREPARING') {
      // 1. Auto-transition to OUT_FOR_DELIVERY after 25 minutes
      const outForDeliveryDelay = process.env.FAST_TIMERS === 'true' ? 25000 : 25 * 60 * 1000;
      const deliveredDelay = process.env.FAST_TIMERS === 'true' ? 40000 : (25 + 15) * 60 * 1000;

      setTimeout(async () => {
        try {
          const currentOrder = await prisma.order.findUnique({ where: { id: Number(id) } });
          if (currentOrder && currentOrder.status === 'PREPARING') {
            await prisma.order.update({
              where: { id: Number(id) },
              data: { status: 'OUT_FOR_DELIVERY' }
            });
            console.log(`[Auto-Status] Order ${currentOrder.orderNumber} transitioned to OUT_FOR_DELIVERY after 25 minutes.`);
          }
        } catch (err) {
          console.error(err);
        }
      }, outForDeliveryDelay);

      // 2. Auto-transition to DELIVERED after 15 additional minutes
      setTimeout(async () => {
        try {
          const currentOrder = await prisma.order.findUnique({ where: { id: Number(id) } });
          if (currentOrder && currentOrder.status === 'OUT_FOR_DELIVERY') {
            await prisma.order.update({
              where: { id: Number(id) },
              data: { status: 'DELIVERED', paymentStatus: 'PAID' }
            });
            console.log(`[Auto-Status] Order ${currentOrder.orderNumber} transitioned to DELIVERED (PAID) after 15 minutes in transit.`);
          }
        } catch (err) {
          console.error(err);
        }
      }, deliveredDelay);
    }

    res.json(updated);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// Admin: Get Dashboard Stats
router.get('/stats/today', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch all orders for stats calculation
    const allOrders = await prisma.order.findMany();
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 1. Calculate today's revenue (sum of paid or COD orders that are not cancelled)
    const todayRevenue = todayOrders
      .filter((o) => o.status !== 'CANCELLED' && (o.paymentStatus === 'PAID' || o.paymentMethod === 'COD'))
      .reduce((acc, order) => acc + order.total, 0);

    // 2. Total revenue historically
    const totalRevenue = allOrders
      .filter((o) => o.status !== 'CANCELLED' && (o.paymentStatus === 'PAID' || o.paymentMethod === 'COD'))
      .reduce((acc, order) => acc + order.total, 0);

    // 3. Counts of orders by status for today
    const pendingOrdersCount = todayOrders.filter((o) => o.status === 'PENDING').length;
    const preparingOrdersCount = todayOrders.filter((o) => o.status === 'PREPARING').length;
    const outForDeliveryCount = todayOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
    const deliveredOrdersCount = todayOrders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrdersCount = todayOrders.filter((o) => o.status === 'CANCELLED').length;

    // 4. Payment method split (today)
    const codOrdersCount = todayOrders.filter((o) => o.paymentMethod === 'COD').length;
    const onlineOrdersCount = todayOrders.filter((o) => o.paymentMethod !== 'COD').length;

    // 5. Total customers count
    const totalCustomers = await prisma.customer.count();

    // 6. Simple chart data (last 7 days revenue)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      const dayOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
      });

      const dayRevenue = dayOrders.reduce((acc, order) => acc + order.total, 0);
      const dayLabel = start.toLocaleDateString('en-US', { weekday: 'short' });

      chartData.push({
        day: dayLabel,
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    res.json({
      todayStats: {
        revenue: todayRevenue,
        ordersCount: todayOrders.length,
        pending: pendingOrdersCount,
        preparing: preparingOrdersCount,
        outForDelivery: outForDeliveryCount,
        delivered: deliveredOrdersCount,
        cancelled: cancelledOrdersCount,
        cod: codOrdersCount,
        online: onlineOrdersCount,
      },
      historicalStats: {
        totalRevenue,
        totalCustomers,
        totalOrdersCount: allOrders.length,
      },
      chartData,
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
});

// Admin: Delete/Cancel an Order
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.order.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' },
    });
    res.json({ message: 'Order marked as CANCELLED successfully.' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
});

export default router;
