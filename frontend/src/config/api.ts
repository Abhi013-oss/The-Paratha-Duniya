const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://the-paratha-duniya.onrender.com';
export const API_BASE_URL = rawUrl.trim().replace(/\/+$/, '');

// Optional: You can paste your Razorpay Key ID below (e.g. 'rzp_live_xxx' or 'rzp_test_xxx') for instant client activation:
export const HARDCODED_RAZORPAY_KEY_ID = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').replace(/['"]/g, '').trim();
