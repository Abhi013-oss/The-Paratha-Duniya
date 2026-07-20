import { Router, Request, Response } from 'express';
import { sendAutomatedWhatsApp } from '../services/whatsappService';

const router = Router();

// POST /api/whatsapp/send - Trigger background automated WhatsApp message
router.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      res.status(400).json({ error: 'Phone number and message content are required.' });
      return;
    }

    const result = await sendAutomatedWhatsApp(phone, message);

    res.status(200).json({
      success: result.success,
      mode: result.mode,
      message: 'Automated WhatsApp dispatch processed.',
      detail: result.detail
    });
  } catch (error) {
    console.error('WhatsApp route error:', error);
    res.status(500).json({ error: 'Failed to dispatch WhatsApp message.' });
  }
});

export default router;
