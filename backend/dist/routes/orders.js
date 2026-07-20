"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Helper to generate a unique Order Number (e.g., TPD-10023)
async function generateOrderNumber() {
    const count = await db_1.default.order.count();
    const nextNumber = 10000 + count + 1;
    return `TPD-${nextNumber}`;
}
// Public: Place a new order
router.post('/', async (req, res) => {
    const { customerName, phone, email, houseNo, address, landmark, pincode, deliveryInstructions, items, // Array of { productId, quantity }
    paymentMethod, couponCode, } = req.body;
    if (!customerName || !phone || !address || !pincode || !items || items.length === 0) {
        res.status(400).json({ error: 'Required fields are missing: Customer name, phone, address, pincode, or items.' });
        return;
    }
    try {
        // 1. Find or create customer by phone number
        let customer = await db_1.default.customer.findUnique({
            where: { phone: String(phone).trim() },
        });
        if (customer) {
            // Update customer details with latest address
            customer = await db_1.default.customer.update({
                where: { id: customer.id },
                data: {
                    name: customerName,
                    email: email || customer.email,
                    houseNo: houseNo || customer.houseNo,
                    address,
                    landmark: landmark || customer.landmark,
                    pincode,
                    deliveryInstructions: deliveryInstructions || customer.deliveryInstructions,
                },
            });
        }
        else {
            customer = await db_1.default.customer.create({
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
        // 2. Fetch products and calculate subtotal
        let subtotal = 0;
        const orderItemsData = [];
        for (const item of items) {
            const product = await db_1.default.product.findUnique({
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
            const coupon = await db_1.default.coupon.findUnique({
                where: { code: String(couponCode).toUpperCase().trim() },
            });
            if (coupon && coupon.isActive) {
                const canUse = coupon.maxUses === null || coupon.usesCount < coupon.maxUses;
                const meetsMin = subtotal >= coupon.minOrderValue;
                if (canUse && meetsMin) {
                    appliedCoupon = coupon;
                    if (coupon.discountType === 'PERCENTAGE') {
                        discount = Math.round((subtotal * coupon.discountValue) / 100);
                    }
                    else if (coupon.discountType === 'FIXED') {
                        discount = coupon.discountValue;
                    }
                    // Max discount cannot exceed subtotal
                    discount = Math.min(discount, subtotal);
                }
            }
        }
        const total = subtotal - discount;
        const orderNumber = await generateOrderNumber();
        // 4. Create the Order
        const newOrder = await db_1.default.order.create({
            data: {
                orderNumber,
                customerId: customer.id,
                subtotal,
                discount,
                total,
                status: 'PENDING',
                paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING', // Will be updated on verify for online payments
                paymentMethod,
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
            await db_1.default.coupon.update({
                where: { id: appliedCoupon.id },
                data: {
                    usesCount: {
                        increment: 1,
                    },
                },
            });
        }
        res.status(201).json({
            message: 'Order created successfully.',
            order: newOrder,
        });
    }
    catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to process order. Please try again.' });
    }
});
// Public: Track an order by Order Number
router.get('/track/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    try {
        const order = await db_1.default.order.findUnique({
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
    }
    catch (error) {
        console.error('Track order error:', error);
        res.status(500).json({ error: 'Failed to retrieve tracking information.' });
    }
});
// Admin: Get all orders (with filters and search)
router.get('/', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { status, paymentMethod, paymentStatus, search } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = String(status);
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
        const orders = await db_1.default.order.findMany({
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
    }
    catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});
// Admin: Update order status & payment status
router.put('/:id/status', auth_1.authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    try {
        const existing = await db_1.default.order.findUnique({
            where: { id: Number(id) },
        });
        if (!existing) {
            res.status(404).json({ error: 'Order not found.' });
            return;
        }
        const updated = await db_1.default.order.update({
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
        res.json(updated);
    }
    catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update order status.' });
    }
});
// Admin: Get Dashboard Stats
router.get('/stats/today', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        // Fetch all orders for stats calculation
        const allOrders = await db_1.default.order.findMany();
        const todayOrders = await db_1.default.order.findMany({
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
        const totalCustomers = await db_1.default.customer.count();
        // 6. Simple chart data (last 7 days revenue)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const start = new Date(d.setHours(0, 0, 0, 0));
            const end = new Date(d.setHours(23, 59, 59, 999));
            const dayOrders = await db_1.default.order.findMany({
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
    }
    catch (error) {
        console.error('Fetch stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
    }
});
// Admin: Delete/Cancel an Order
router.delete('/:id', auth_1.authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.order.update({
            where: { id: Number(id) },
            data: { status: 'CANCELLED' },
        });
        res.json({ message: 'Order marked as CANCELLED successfully.' });
    }
    catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order.' });
    }
});
exports.default = router;
