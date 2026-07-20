const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://the-paratha-duniya.onrender.com';
export const API_BASE_URL = rawUrl.trim().replace(/\/+$/, '');
