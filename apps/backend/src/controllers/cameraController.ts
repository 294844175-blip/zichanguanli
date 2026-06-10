import { Request, Response } from 'express';
import prisma from '../config/database';

export const getCameras = async (req: Request, res: Response) => {
  try {
    const { parkId } = req.params;
    const cameras = await prisma.camera.findMany({
      where: { parkId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(cameras);
  } catch {
    res.status(500).json({ error: 'Failed to fetch cameras' });
  }
};

export const createCamera = async (req: Request, res: Response) => {
  try {
    const { parkId } = req.params;
    const { code, name, x, y, width, height, rotation, hikvisionConfig } = req.body;
    
    const camera = await prisma.camera.create({
      data: {
        code,
        name,
        x: x || 0,
        y: y || 0,
        width: width || 100,
        height: height || 100,
        rotation: rotation || 0,
        hikvisionConfig: hikvisionConfig || null,
        parkId,
      },
    });
    
    res.status(201).json(camera);
  } catch {
    res.status(500).json({ error: 'Failed to create camera' });
  }
};

export const updateCamera = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { x, y, width, height, rotation, hikvisionConfig, code, name } = req.body;
    
    const camera = await prisma.camera.update({
      where: { id },
      data: {
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(rotation !== undefined && { rotation }),
        ...(hikvisionConfig !== undefined && { hikvisionConfig }),
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
      },
    });
    
    res.json(camera);
  } catch {
    res.status(500).json({ error: 'Failed to update camera' });
  }
};

export const deleteCamera = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.camera.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete camera' });
  }
};
