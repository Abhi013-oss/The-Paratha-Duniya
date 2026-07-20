"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const crypto = __importStar(require("crypto"));
const router = (0, express_1.Router)();
// Create Razorpay Order
router.post('/order', async (req, res) => {
    const { amount, receipt } = req.body;
    if (!amount) {
        res.status(400).json({ error: 'Amount is required.' });
        return;
    }
    const amountInPaise = Math.round(Number(amount) * 100);
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        // Check if we are running in simulated/mock mode
        if (!keyId || !keySecret || keyId.startsWith('rzp_test_mockKey')) {
            console.log('Razorpay keys not configured or mock key used. Operating in mock payment mode.');
            res.json({
                id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
                entity: 'order',
                amount: amountInPaise,
                amount_paid: 0,
                amount_due: amountInPaise,
                currency: 'INR',
                receipt: receipt || 'receipt_123',
                status: 'created',
                attempts: 0,
                notes: [],
                created_at: Math.floor(Date.now() / 1000),
                isMock: true,
            });
            return;
        }
        // Try to load Razorpay dynamically
        try {
            const Razorpay = require('razorpay');
            const razorpayInstance = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: receipt || `receipt_${Date.now()}`,
            };
            const order = await razorpayInstance.orders.create(options);
            res.json(order);
        }
        catch (sdkError) {
            console.error('Razorpay SDK failed to initialize. Falling back to mock order.', sdkError);
            res.json({
                id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
                entity: 'order',
                amount: amountInPaise,
                currency: 'INR',
                receipt: receipt || 'receipt_123',
                status: 'created',
                isMock: true,
            });
        }
    }
    catch (error) {
        console.error('Create payment order error:', error);
        res.status(500).json({ error: 'Failed to create payment order.' });
    }
});
// Verify Payment Signature
router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, isMock } = req.body;
    try {
        if (isMock) {
            // Mock payment verification immediately succeeds
            console.log(`Verifying simulated payment for order ID: ${orderId}`);
            // Update order status in DB
            await db_1.default.order.update({
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
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
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
            await db_1.default.order.update({
                where: { orderNumber: orderId },
                data: {
                    paymentStatus: 'PAID',
                    paymentId: razorpay_payment_id,
                    razorpayOrderId: razorpay_order_id,
                },
            });
            res.json({ status: 'success', message: 'Payment verified successfully.' });
        }
        else {
            await db_1.default.order.update({
                where: { orderNumber: orderId },
                data: { paymentStatus: 'FAILED' },
            });
            res.status(400).json({ status: 'failure', message: 'Invalid signature. Payment verification failed.' });
        }
    }
    catch (error) {
        console.error('Verify payment signature error:', error);
        res.status(500).json({ error: 'Failed to verify payment.' });
    }
});
exports.default = router;
