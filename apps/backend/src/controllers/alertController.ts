import { Request, Response } from 'express';
import prisma from '../config/database';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;
    
    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(alerts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.alert.count({
      where: { status: 'UNREAD' },
    });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.alert.update({
      where: { id },
      data: { status: 'READ' },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};
