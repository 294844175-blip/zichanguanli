import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFloors = async (req: Request, res: Response) => {
  try {
    const { buildingId } = req.query;
    const where: any = {};
    if (buildingId) where.buildingId = buildingId as string;

    const floors = await prisma.floor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(floors);
  } catch {
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
};

export const getFloorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const floor = await prisma.floor.findUnique({
      where: { id },
      include: { building: true, assets: true },
    });
    if (!floor) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    res.json(floor);
  } catch {
    res.status(500).json({ error: 'Failed to fetch floor' });
  }
};

export const createFloor = async (req: Request, res: Response) => {
  try {
    const { name, buildingId } = req.body;
    const floor = await prisma.floor.create({
      data: {
        name,
        buildingId,
      },
    });
    res.json(floor);
  } catch {
    res.status(500).json({ error: 'Failed to create floor' });
  }
};

export const updateFloor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const floor = await prisma.floor.update({
      where: { id },
      data: { name },
    });
    res.json(floor);
  } catch {
    res.status(500).json({ error: 'Failed to update floor' });
  }
};

export const deleteFloor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.floor.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete floor' });
  }
};
