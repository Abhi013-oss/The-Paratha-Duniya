import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Admin Login
router.post('/login', async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const admin = await prisma.admin.findUnique({
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Admin Token
router.get('/verify', authenticateAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, email: true, name: true },
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    res.json({ admin });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update Credentials
router.put('/update-credentials', authenticateAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email && !password) {
    res.status(400).json({ error: 'Email or password must be provided to update.' });
    return;
  }

  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const updateData: any = {};
    if (email) {
      updateData.email = String(email).trim();
    }
    if (password) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    await prisma.admin.update({
      where: { id: req.admin.id },
      data: updateData,
    });

    res.json({ message: 'Admin credentials updated successfully.' });
  } catch (error) {
    console.error('Update credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
