import axios from 'axios';

/**
 * Service to send automated background WhatsApp notifications via Meta Cloud API or Twilio API.
 * Does NOT require opening WhatsApp Web or user interaction!
 */
export async function sendAutomatedWhatsApp(
  recipientPhone: string,
  messageText: string
): Promise<{ success: boolean; mode: string; detail?: any }> {
  try {
    // Clean phone number format (must include country code e.g. 919492760128)
    let cleanPhone = recipientPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default to India country code if 10 digits
    }

    const metaToken = process.env.META_WHATSAPP_TOKEN;
    const metaPhoneId = process.env.META_WHATSAPP_PHONE_ID;

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    // 1. META WHATSAPP CLOUD API DISPATCH
    if (metaToken && metaPhoneId) {
      console.log(`[WhatsApp Service] Sending via Meta WhatsApp Cloud API to +${cleanPhone}...`);
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${metaPhoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: messageText },
        },
        {
          headers: {
            Authorization: `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return { success: true, mode: 'META_CLOUD_API', detail: response.data };
    }

    // 2. TWILIO WHATSAPP API DISPATCH
    if (twilioAccountSid && twilioAuthToken) {
      console.log(`[WhatsApp Service] Sending via Twilio WhatsApp API to +${cleanPhone}...`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const authHeader = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('From', twilioFromNumber.startsWith('whatsapp:') ? twilioFromNumber : `whatsapp:${twilioFromNumber}`);
      params.append('To', `whatsapp:+${cleanPhone}`);
      params.append('Body', messageText);

      const response = await axios.post(twilioUrl, params.toString(), {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return { success: true, mode: 'TWILIO_API', detail: response.data };
    }

    // 3. SIMULATED BACKGROUND DISPATCH (For local development when API Keys are pending)
    console.log(`[WhatsApp Service - Background Dispatch Logged]`);
    console.log(`📱 TO: +${cleanPhone}`);
    console.log(`💬 MESSAGE:\n${messageText}`);
    console.log(`-----------------------------------------------------`);
    
    return {
      success: true,
      mode: 'DEVELOPMENT_SIMULATED',
      detail: 'Message dispatched to background logs. Add META_WHATSAPP_TOKEN in backend/.env for live cellular carrier delivery.',
    };
  } catch (error: any) {
    console.error('[WhatsApp Service Error]:', error.response?.data || error.message);
    return {
      success: false,
      mode: 'ERROR',
      detail: error.response?.data || error.message,
    };
  }
}
