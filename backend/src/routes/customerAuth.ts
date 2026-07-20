import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { authenticateCustomer, CustomerAuthRequest } from '../middleware/auth';

const router = Router();

// Customer Register
router.post('/register', async (req, res): Promise<void> => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !password) {
    res.status(400).json({ error: 'Name, phone number, and password are required.' });
    return;
  }

  try {
    // Check if customer with this phone number already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: String(phone).trim() },
    });

    let customer;

    if (existingCustomer) {
      // If customer exists but has no password set (i.e. was a guest customer previously)
      if (!existingCustomer.password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        customer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name,
            email: email || existingCustomer.email,
            password: hashedPassword,
          },
        });
      } else {
        res.status(400).json({ error: 'An account with this phone number already exists.' });
        return;
      }
    } else {
      // Create new customer
      const hashedPassword = await bcrypt.hash(password, 10);
      customer = await prisma.customer.create({
        data: {
          name,
          phone: String(phone).trim(),
          email: email || null,
          password: hashedPassword,
          address: '', // Default blank to satisfy DB
          pincode: '',
        },
      });
    }

    const secret = process.env.JWT_SECRET || 'the_paratha_duniya_secret_key_2026_premium_luxury';
    const token = jwt.sign(
      { id: customer.id, phone: customer.phone, email: customer.email, name: customer.name },
      secret,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        houseNo: customer.houseNo,
        address: customer.address,
        landmark: customer.landmark,
        pincode: customer.pincode,
        deliveryInstructions: customer.deliveryInstructions,
      },
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer Login
router.post('/login', async (req, res): Promise<void> => {
  const { loginId, password } = req.body; // loginId can be email or phone

  if (!loginId || !password) {
    res.status(400).json({ error: 'Email/Phone and password are required.' });
    return;
  }

  try {
    let customer = null;

    // Check if loginId is email or phone
    if (loginId.includes('@')) {
      customer = await prisma.customer.findFirst({
        where: { email: loginId.trim() },
      });
    } else {
      customer = await prisma.customer.findUnique({
        where: { phone: loginId.trim() },
      });
    }

    if (!customer || !customer.password) {
      res.status(401).json({ error: 'Invalid email, phone, or password.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email, phone, or password.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'the_paratha_duniya_secret_key_2026_premium_luxury';
    const token = jwt.sign(
      { id: customer.id, phone: customer.phone, email: customer.email, name: customer.name },
      secret,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        houseNo: customer.houseNo,
        address: customer.address,
        landmark: customer.landmark,
        pincode: customer.pincode,
        deliveryInstructions: customer.deliveryInstructions,
      },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock Google Login / OAuth
router.post('/google-login', async (req, res): Promise<void> => {
  const { googleId, email, name } = req.body;

  if (!googleId || !email || !name) {
    res.status(400).json({ error: 'googleId, email, and name are required.' });
    return;
  }

  try {
    // 1. Try to find customer by googleId
    let customer = await prisma.customer.findFirst({
      where: { googleId },
    });

    if (!customer) {
      // 2. Try to find customer by email
      customer = await prisma.customer.findFirst({
        where: { email: email.trim() },
      });

      if (customer) {
        // Link Google ID to existing customer
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { googleId },
        });
      } else {
        // 3. Create new customer. Use a unique dummy phone number format.
        // The customer will update their real phone number at checkout.
        const dummyPhone = `google-${googleId.slice(0, 15)}`;
        customer = await prisma.customer.create({
          data: {
            name,
            email: email.trim(),
            googleId,
            phone: dummyPhone,
            address: '',
            pincode: '',
          },
        });
      }
    }

    const secret = process.env.JWT_SECRET || 'the_paratha_duniya_secret_key_2026_premium_luxury';
    const token = jwt.sign(
      { id: customer.id, phone: customer.phone, email: customer.email, name: customer.name },
      secret,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        houseNo: customer.houseNo,
        address: customer.address,
        landmark: customer.landmark,
        pincode: customer.pincode,
        deliveryInstructions: customer.deliveryInstructions,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Customer Token
router.get('/verify', authenticateCustomer, async (req: CustomerAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.customer) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: req.customer.id },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        houseNo: customer.houseNo,
        address: customer.address,
        landmark: customer.landmark,
        pincode: customer.pincode,
        deliveryInstructions: customer.deliveryInstructions,
      },
    });
  } catch (error) {
    console.error('Customer verify token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Customer Profile
router.put('/update', authenticateCustomer, async (req: CustomerAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.customer) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, phone, email, houseNo, address, landmark, pincode, deliveryInstructions } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: 'Name and Phone number are required.' });
      return;
    }

    // Check if phone number is already taken by another user
    const existing = await prisma.customer.findFirst({
      where: {
        phone: phone.trim(),
        NOT: { id: req.customer.id }
      }
    });

    if (existing) {
      res.status(400).json({ error: 'This phone number is already registered to another account.' });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id: req.customer.id },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        houseNo: houseNo ? houseNo.trim() : null,
        address: address ? address.trim() : '',
        landmark: landmark ? landmark.trim() : null,
        pincode: pincode ? pincode.trim() : '',
        deliveryInstructions: deliveryInstructions ? deliveryInstructions.trim() : null,
      }
    });

    res.json({
      message: 'Profile updated successfully!',
      customer: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        houseNo: updated.houseNo,
        address: updated.address,
        landmark: updated.landmark,
        pincode: updated.pincode,
        deliveryInstructions: updated.deliveryInstructions,
      }
    });
  } catch (error) {
    console.error('Customer profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Customer Password
router.put('/update-password', authenticateCustomer, async (req: CustomerAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.customer) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: req.customer.id }
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    // Google accounts might not have a password set
    if (customer.googleId && !customer.password) {
      res.status(400).json({ error: 'Google accounts do not have a local password.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, customer.password || '');
    if (!isPasswordValid) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.customer.update({
      where: { id: req.customer.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Customer password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
