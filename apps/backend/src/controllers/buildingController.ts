import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getBuildings = async (req: Request, res: Response) => {
  try {
    const { parkId } = req.query;
    const where: any = {};
    if (parkId) where.parkId = parkId as string;

    const buildings = await prisma.building.findMany({
      where,
      include: { floors: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(buildings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
};

export const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await prisma.building.findUnique({
      where: { id },
      include: { floors: true, assets: true },
    });
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.json(building);
  } catch {
    res.status(500).json({ error: 'Failed to fetch building' });
  }
};

export const createBuilding = async (req: Request, res: Response) => {
  try {
    const { name, parkId } = req.body;
    const building = await prisma.building.create({
      data: {
        name,
        parkId,
      },
    });
    res.json(building);
  } catch {
    res.status(500).json({ error: 'Failed to create building' });
  }
};

export const updateBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const building = await prisma.building.update({
      where: { id },
      data: { name },
    });
    res.json(building);
  } catch {
    res.status(500).json({ error: 'Failed to update building' });
  }
};

export const deleteBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.building.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete building' });
  }
};
