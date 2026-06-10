import { Request, Response } from 'express';
import prisma from '../config/database';

export const getRevenueRecords = async (req: Request, res: Response) => {
  try {
    const { parkId, period, source } = req.query;
    const where: any = {};
    if (parkId) where.parkId = parkId;
    if (period) where.period = period;
    if (source) where.source = source;

    const revenueRecords = await prisma.revenueRecord.findMany({
      where,
      include: { park: true },
      orderBy: { period: 'desc' },
    });
    res.json(revenueRecords);
  } catch {
    res.status(500).json({ error: 'Failed to fetch revenue records' });
  }
};

export const getRevenueRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revenueRecord = await prisma.revenueRecord.findUnique({
      where: { id },
      include: { park: true },
    });

    if (!revenueRecord) {
      return res.status(404).json({ error: 'Revenue record not found' });
    }

    res.json(revenueRecord);
  } catch {
    res.status(500).json({ error: 'Failed to fetch revenue record' });
  }
};

export const createRevenueRecord = async (req: Request, res: Response) => {
  try {
    const revenueRecord = await prisma.revenueRecord.create({ data: req.body });
    res.status(201).json(revenueRecord);
  } catch {
    res.status(500).json({ error: 'Failed to create revenue record' });
  }
};

export const updateRevenueRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revenueRecord = await prisma.revenueRecord.update({
      where: { id },
      data: req.body,
    });
    res.json(revenueRecord);
  } catch {
    res.status(500).json({ error: 'Failed to update revenue record' });
  }
};

export const deleteRevenueRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.revenueRecord.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete revenue record' });
  }
};
