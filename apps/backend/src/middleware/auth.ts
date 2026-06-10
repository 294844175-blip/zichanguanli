import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleId: string;
    orgId?: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true, organization: true },
    });
    
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      orgId: user.orgId || undefined,
    };
    
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
