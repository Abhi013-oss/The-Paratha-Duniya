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
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Admin Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    try {
        const admin = await db_1.default.admin.findUnique({
            where: { email },
        });
        if (!admin) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const secret = process.env.JWT_SECRET || 'the_paratha_duniya_secret_key_2026_premium_luxury';
        const token = jwt.sign({ id: admin.id, email: admin.email }, secret, {
            expiresIn: '1d',
        });
        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Verify Admin Token
router.get('/verify', auth_1.authenticateAdmin, async (req, res) => {
    try {
        if (!req.admin) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const admin = await db_1.default.admin.findUnique({
            where: { id: req.admin.id },
            select: { id: true, email: true, name: true },
        });
        if (!admin) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }
        res.json({ admin });
    }
    catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
