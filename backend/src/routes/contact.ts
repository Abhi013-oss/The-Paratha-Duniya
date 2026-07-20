import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/contact - Submit customer contact / feedback / catering request
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !message) {
      res.status(400).json({ error: 'Name, phone number, and message are required fields.' });
      return;
    }

    const newMessage = await prisma.contactMessage.create({
      data: {
        name,
        phone,
        email: email || null,
        message
      }
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received! We will reach out shortly.',
      data: newMessage
    });
  } catch (error) {
    console.error('Submit contact message error:', error);
    res.status(500).json({ error: 'Failed to submit message.' });
  }
});

// GET /api/contact - Retrieve all contact messages (For Admin Dashboard)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Fetch contact messages error:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages.' });
  }
});

// DELETE /api/contact/:id - Delete a contact message by ID
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.delete({
      where: { id: Number(id) }
    });
    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

export default router;
