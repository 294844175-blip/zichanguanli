import { Request, Response } from 'express';
import prisma from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

export const getParks = async (req: Request, res: Response) => {
  try {
    const parks = await prisma.park.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(parks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch parks' });
  }
};

export const getParkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const park = await prisma.park.findUnique({
      where: { id },
      include: { organization: true, assets: true },
    });
    
    if (!park) {
      return res.status(404).json({ error: 'Park not found' });
    }
    
    res.json(park);
  } catch {
    res.status(500).json({ error: 'Failed to fetch park' });
  }
};

export const createPark = async (req: Request, res: Response) => {
  try {
    const park = await prisma.park.create({ data: req.body });
    res.status(201).json(park);
  } catch {
    res.status(500).json({ error: 'Failed to create park' });
  }
};

export const updatePark = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const park = await prisma.park.update({
      where: { id },
      data: req.body,
    });
    res.json(park);
  } catch {
    res.status(500).json({ error: 'Failed to update park' });
  }
};

export const updateParkBackground = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { backgroundUrl } = req.body;
    
    const park = await prisma.park.update({
      where: { id },
      data: { backgroundUrl },
    });
    
    res.json(park);
  } catch {
    res.status(500).json({ error: 'Failed to update background' });
  }
};

export const uploadParkBackground = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 保存背景图URL到数据库
    const backgroundUrl = `/uploads/${req.file.filename}`;
    const park = await prisma.park.update({
      where: { id },
      data: { backgroundUrl },
    });
    
    res.json(park);
  } catch {
    res.status(500).json({ error: 'Failed to upload background' });
  }
};

export const deleteParkBackground = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const park = await prisma.park.findUnique({
      where: { id },
    });
    
    if (!park) {
      return res.status(404).json({ error: 'Park not found' });
    }
    
    // 如果有旧的背景图，删除文件
    if (park.backgroundUrl) {
      const filePath = path.join(__dirname, '../../public', park.backgroundUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // 更新数据库，清空背景图
    await prisma.park.update({
      where: { id },
      data: { backgroundUrl: null },
    });
    
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete background' });
  }
};

export const updateParkBackgroundConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { backgroundX, backgroundY, backgroundScale, backgroundLocked } = req.body;
    
    const park = await prisma.park.update({
      where: { id },
      data: {
        backgroundX,
        backgroundY,
        backgroundScale,
        backgroundLocked,
      },
    });
    
    res.json(park);
  } catch {
    res.status(500).json({ error: 'Failed to update background config' });
  }
};
