import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { buildSearchQuery } from '../utils/searchUtils';
import { exportToCSV } from '../utils/exportUtils';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['username', 'realName', 'phone', 'email']);
      Object.assign(where, searchQuery);
    }
    
    const users = await prisma.user.findMany({
      where,
      include: { role: true, organization: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const sanitized = users.map(u => ({
      ...u,
      password: undefined,
    }));
    
    res.json(sanitized);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, realName, roleId, orgId } = req.body;
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, realName, roleId, orgId },
      include: { role: true },
    });
    
    res.status(201).json({ ...user, password: undefined });
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password, ...data } = req.body;
    
    const updateData: any = { ...data };
    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });
    
    res.json({ ...user, password: undefined });
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });
    
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to toggle status' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const exportUsers = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['username', 'realName', 'phone', 'email']);
      Object.assign(where, searchQuery);
    }
    
    const users = await prisma.user.findMany({
      where,
      include: { role: true, organization: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const userHeaders = {
      username: '用户名',
      realName: '姓名',
      phone: '电话',
      email: '邮箱',
      'role.name': '角色',
      'organization.name': '组织',
      status: '状态',
      createdAt: '创建时间',
      updatedAt: '更新时间'
    };
    
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(res, {
      data: users,
      headers: userHeaders,
      excludeFields: ['password'],
      filename: `用户列表_${date}`
    });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
};

export const getUserParks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const parkAccesses = await prisma.parkAccess.findMany({
      where: { userId: id },
      include: { park: true },
    });
    
    const parks = parkAccesses.map(pa => pa.park);
    res.json(parks);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user parks' });
  }
};

export const assignUserParks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parkIds } = req.body;
    
    if (!Array.isArray(parkIds)) {
      return res.status(400).json({ error: 'parkIds must be an array' });
    }
    
    await prisma.parkAccess.deleteMany({
      where: { userId: id },
    });
    
    if (parkIds.length > 0) {
      await prisma.parkAccess.createMany({
        data: parkIds.map(parkId => ({ userId: id, parkId })),
      });
    }
    
    const parkAccesses = await prisma.parkAccess.findMany({
      where: { userId: id },
      include: { park: true },
    });
    
    res.json(parkAccesses.map(pa => pa.park));
  } catch {
    res.status(500).json({ error: 'Failed to assign user parks' });
  }
};

export const removeUserPark = async (req: Request, res: Response) => {
  try {
    const { id, parkId } = req.params;
    
    await prisma.parkAccess.delete({
      where: { userId_parkId: { userId: id, parkId } },
    });
    
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to remove user park' });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { role: true, organization: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...sanitized } = user;
    res.json(sanitized);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username, newPassword } = req.body;
    const userId = req.user!.id;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updateData: any = {};
    
    if (username && username !== user.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      updateData.username = username;
    }
    
    if (newPassword) {
      updateData.password = bcrypt.hashSync(newPassword, 10);
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.json({ ...user, password: undefined });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true },
    });
    
    res.json({ ...updatedUser, password: undefined });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: '用户名已存在' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
