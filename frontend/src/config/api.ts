const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://the-paratha-duniya.onrender.com';
export const API_BASE_URL = rawUrl.trim().replace(/\/+$/, '');

// Official Live Razorpay Key ID
export const HARDCODED_RAZORPAY_KEY_ID = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TG3ZILfac213Ou').replace(/['"]/g, '').trim();
