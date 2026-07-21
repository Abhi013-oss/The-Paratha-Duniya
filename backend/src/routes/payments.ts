import { Router, Request, Response } from 'express';
import prisma from '../config/db';
import * as crypto from 'crypto';

const router = Router();

// Create Razorpay Order via Direct REST API
router.post('/order', async (req: Request, res: Response): Promise<void> => {
  const { amount, receipt } = req.body;

  if (!amount) {
    res.status(400).json({ error: 'Amount is required.' });
    return;
  }

  const amountInPaise = Math.round(Number(amount) * 100);

  try {
    const keyId = (process.env.RAZORPAY_KEY_ID || 'rzp_live_TG3ZILfac213Ou').replace(/['"]/g, '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'j3vsgdgQ45rPhqn1DdiK1EaL').replace(/['"]/g, '').trim();

    if (!keyId || !keySecret) {
      res.status(400).json({ error: 'Razorpay Key ID or Key Secret is missing.' });
      return;
    }

    // Call official Razorpay Orders REST API via Basic Auth
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt || `receipt_${Date.now()}`,
      }),
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('Razorpay API error response:', orderData);
      res.status(response.status).json({ error: orderData.error?.description || 'Failed to create order on Razorpay.' });
      return;
    }

    res.json(orderData);
  } catch (error: any) {
    console.error('Create payment order error:', error);
    res.status(500).json({ error: 'Failed to create payment order.' });
  }
});

// Verify Payment Signature
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, isMock } = req.body;

  try {
    if (isMock) {
      // Mock payment verification immediately succeeds
      console.log(`Verifying simulated payment for order ID: ${orderId}`);
      
      // Update order status in DB
      await prisma.order.update({
        where: { orderNumber: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentId: razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          razorpayOrderId: razorpay_order_id,
        },
      });

      res.json({ status: 'success', message: 'Simulated payment verified.' });
      return;
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      res.status(400).json({ error: 'Missing payment signature verification parameters.' });
      return;
    }

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'j3vsgdgQ45rPhqn1DdiK1EaL').replace(/['"]/g, '').trim();

    if (!keySecret) {
      res.status(500).json({ error: 'Payment gateway configuration is missing.' });
      return;
    }

    // Generate signature hash to match Razorpay
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Update order status in DB
      await prisma.order.update({
        where: { orderNumber: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
        },
      });

      res.json({ status: 'success', message: 'Payment verified successfully.' });
    } else {
      await prisma.order.update({
        where: { orderNumber: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      res.status(400).json({ status: 'failure', message: 'Invalid signature. Payment verification failed.' });
    }
  } catch (error) {
    console.error('Verify payment signature error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// Check Bank / UPI Payment Received Status
router.get('/verify-status/:orderNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderNumber = String(req.params.orderNumber);
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { paymentStatus: true, status: true }
    });

    if (order && order.paymentStatus === 'PAID') {
      res.json({ verified: true, paymentStatus: 'PAID' });
      return;
    }

    res.json({ verified: false, paymentStatus: order?.paymentStatus || 'PENDING' });
  } catch (error) {
    res.json({ verified: false, paymentStatus: 'PENDING' });
  }
});

export default router;
