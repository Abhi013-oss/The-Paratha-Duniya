import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  admin?: {
    id: number;
    email: string;
  };
}

export interface CustomerAuthRequest extends Request {
  customer?: {
    id: number;
    phone: string;
    email?: string | null;
    name: string;
  };
}

export const authenticateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'the_paratha_duniya_secret_key_2026_premium_luxury';
    const decoded = jwt.verify(token, secret) as { id: number; email: string };
    
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const authenticateCustomer = (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'the_paratha_duniya_secret_key_2026_premium_luxury';
    const decoded = jwt.verify(token, secret) as { id: number; phone: string; email?: string | null; name: string };
    
    req.customer = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
