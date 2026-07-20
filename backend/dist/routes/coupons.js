"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public: Validate coupon
router.post('/validate', async (req, res) => {
    const { code, amount } = req.body;
    if (!code) {
        res.status(400).json({ error: 'Coupon code is required.' });
        return;
    }
    try {
        const coupon = await db_1.default.coupon.findUnique({
            where: { code: String(code).toUpperCase().trim() },
        });
        if (!coupon || !coupon.isActive) {
            res.status(404).json({ error: 'Invalid or inactive coupon code.' });
            return;
        }
        if (amount !== undefined && Number(amount) < coupon.minOrderValue) {
            res.status(400).json({
                error: `Minimum order value of Rs. ${coupon.minOrderValue} required for this coupon.`,
            });
            return;
        }
        if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
            res.status(400).json({ error: 'This coupon code usage limit has been reached.' });
            return;
        }
        res.json({
            message: 'Coupon is valid.',
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderValue: coupon.minOrderValue,
            },
        });
    }
    catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
// Admin: Get all coupons
router.get('/', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const coupons = await db_1.default.coupon.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(coupons);
    }
    catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ error: 'Failed to fetch coupons.' });
    }
});
// Admin: Create a coupon
router.post('/', auth_1.authenticateAdmin, async (req, res) => {
    const { code, discountType, discountValue, minOrderValue, maxUses } = req.body;
    if (!code || !discountType || discountValue === undefined) {
        res.status(400).json({ error: 'Code, discountType and discountValue are required.' });
        return;
    }
    try {
        const coupon = await db_1.default.coupon.create({
            data: {
                code: String(code).toUpperCase().trim(),
                discountType,
                discountValue: Number(discountValue),
                minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
                maxUses: maxUses ? Number(maxUses) : null,
                isActive: true,
            },
        });
        res.status(201).json(coupon);
    }
    catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: 'Failed to create coupon (code must be unique).' });
    }
});
// Admin: Toggle active state / edit coupon
router.put('/:id', auth_1.authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { discountValue, minOrderValue, maxUses, isActive } = req.body;
    try {
        const existing = await db_1.default.coupon.findUnique({
            where: { id: Number(id) },
        });
        if (!existing) {
            res.status(404).json({ error: 'Coupon not found.' });
            return;
        }
        const updated = await db_1.default.coupon.update({
            where: { id: Number(id) },
            data: {
                discountValue: discountValue !== undefined ? Number(discountValue) : existing.discountValue,
                minOrderValue: minOrderValue !== undefined ? Number(minOrderValue) : existing.minOrderValue,
                maxUses: maxUses !== undefined ? (maxUses ? Number(maxUses) : null) : existing.maxUses,
                isActive: isActive !== undefined ? isActive === true || isActive === 'true' : existing.isActive,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ error: 'Failed to update coupon.' });
    }
});
// Admin: Delete a coupon
router.delete('/:id', auth_1.authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.default.coupon.delete({
            where: { id: Number(id) },
        });
        res.json({ message: 'Coupon deleted successfully' });
    }
    catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ error: 'Failed to delete coupon.' });
    }
});
exports.default = router;
