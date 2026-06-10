import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../config/database';

export const rbacMiddleware = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const role = await prisma.role.findUnique({
      where: { id: req.user.roleId },
    });
    
    if (!role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const permissions = role.permissions as unknown as string[];
    if (!permissions.includes(requiredPermission) && !permissions.includes('*')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};
