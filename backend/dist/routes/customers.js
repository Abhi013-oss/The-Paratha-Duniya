"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Admin: Get all customers (with search & statistics)
router.get('/', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: String(search) } },
                { phone: { contains: String(search) } },
                { email: { contains: String(search) } },
            ];
        }
        // Retrieve customers with their orders to aggregate stats
        const customers = await db_1.default.customer.findMany({
            where: whereClause,
            include: {
                orders: {
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Format stats dynamically
        const formattedCustomers = customers.map((c) => {
            const orderCount = c.orders.length;
            const totalSpend = c.orders.reduce((acc, order) => acc + order.total, 0);
            const lastOrderDate = orderCount > 0
                ? c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
                : null;
            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                address: `${c.houseNo ? c.houseNo + ', ' : ''}${c.address}, ${c.landmark ? c.landmark + ', ' : ''}${c.pincode}`,
                rawAddress: {
                    houseNo: c.houseNo,
                    address: c.address,
                    landmark: c.landmark,
                    pincode: c.pincode,
                    deliveryInstructions: c.deliveryInstructions
                },
                totalOrders: orderCount,
                totalSpending: totalSpend,
                lastOrder: lastOrderDate,
                createdAt: c.createdAt,
            };
        });
        res.json(formattedCustomers);
    }
    catch (error) {
        console.error('Fetch customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customer records.' });
    }
});
// Admin: Get customer detail and orders
router.get('/:id', auth_1.authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const customer = await db_1.default.customer.findUnique({
            where: { id: Number(id) },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: { name: true, image: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!customer) {
            res.status(404).json({ error: 'Customer record not found.' });
            return;
        }
        const orderCount = customer.orders.length;
        const totalSpend = customer.orders.reduce((acc, order) => acc + order.total, 0);
        res.json({
            ...customer,
            totalOrders: orderCount,
            totalSpending: totalSpend,
        });
    }
    catch (error) {
        console.error('Fetch customer detail error:', error);
        res.status(500).json({ error: 'Failed to retrieve customer details.' });
    }
});
exports.default = router;
