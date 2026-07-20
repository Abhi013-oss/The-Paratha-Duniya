import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    admin?: {
        id: number;
        email: string;
    };
}
export declare const authenticateAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
