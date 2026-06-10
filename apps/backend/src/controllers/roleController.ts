import { Request, Response } from 'express';
import prisma from '../config/database';
import { buildSearchQuery } from '../utils/searchUtils';
import { exportToCSV } from '../utils/exportUtils';

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['name', 'code', 'description']);
      Object.assign(where, searchQuery);
    }
    
    const roles = await prisma.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(roles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const role = await prisma.role.create({ data: req.body });
    res.status(201).json(role);
  } catch {
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.update({
      where: { id },
      data: req.body,
    });
    res.json(role);
  } catch {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usersWithRole = await prisma.user.findMany({ where: { roleId: id } });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ error: '该角色下存在用户，无法删除' });
    }
    await prisma.role.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

export const exportRoles = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    const where: any = {};
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['name', 'code', 'description']);
      Object.assign(where, searchQuery);
    }
    
    const roles = await prisma.role.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    const roleHeaders = {
      name: '角色名称',
      code: '角色编码',
      dataScope: '数据权限',
      description: '描述',
      createdAt: '创建时间',
      updatedAt: '更新时间'
    };
    
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(res, {
      data: roles,
      headers: roleHeaders,
      excludeFields: ['permissions'],
      filename: `角色列表_${date}`
    });
  } catch (error) {
    console.error('Export roles error:', error);
    res.status(500).json({ error: 'Failed to export roles' });
  }
};
