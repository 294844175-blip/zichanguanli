import { Request, Response } from 'express';
import prisma from '../config/database';
import { buildSearchQuery } from '../utils/searchUtils';
import { exportToCSV } from '../utils/exportUtils';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { type, status, parkId, keyword } = req.query;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    // 如果有 parkId，返回直接关联该园区的客户，或者有该园区租赁合同的客户
    if (parkId) {
      where.OR = [
        { parkId: parkId as string },
        { leases: { some: { parkId: parkId as string } } }
      ];
    }
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['name', 'contact', 'phone', 'email', 'industry']);
      Object.assign(where, searchQuery);
    }
    
    const customers = await prisma.customer.findMany({
      where,
      include: { leases: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { leases: { include: { asset: true } }, followUps: true },
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { intendedAssetId, intendedLeaseMode, intendedQuantity, ...otherData } = req.body;
    
    const data: any = { ...otherData };
    if (intendedAssetId) data.intendedAssetId = intendedAssetId;
    if (intendedLeaseMode) data.intendedLeaseMode = intendedLeaseMode;
    if (intendedQuantity !== undefined && intendedQuantity !== null) data.intendedQuantity = parseFloat(intendedQuantity);

    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { intendedAssetId, intendedLeaseMode, intendedQuantity, ...otherData } = req.body;
    
    const data: any = { ...otherData };
    if (intendedAssetId) data.intendedAssetId = intendedAssetId;
    if (intendedLeaseMode) data.intendedLeaseMode = intendedLeaseMode;
    if (intendedQuantity !== undefined && intendedQuantity !== null) data.intendedQuantity = parseFloat(intendedQuantity);

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

export const getFollowUps = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const followUps = await prisma.followUp.findMany({
      where: { customerId: id },
      orderBy: { followUpDate: 'desc' },
    });
    res.json(followUps);
  } catch {
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
};

export const createFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const followUp = await prisma.followUp.create({
      data: { ...req.body, customerId: id },
    });
    res.status(201).json(followUp);
  } catch {
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
};

export const updateFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const followUp = await prisma.followUp.update({
      where: { id },
      data: req.body,
    });
    res.json(followUp);
  } catch {
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
};

export const matchProspect = async (req: Request, res: Response) => {
  try {
    const { needs, minArea, maxBudget } = req.body;
    
    const vacantAssets = await prisma.asset.findMany({
      where: { status: 'VACANT' },
      include: { park: true },
    });
    
    const matched = vacantAssets.filter(asset => {
      if (minArea && asset.rentableArea < minArea) return false;
      return true;
    });
    
    res.json(matched);
  } catch {
    res.status(500).json({ error: 'Matching failed' });
  }
};

export const exportCustomers = async (req: Request, res: Response) => {
  try {
    const { type, status, parkId, keyword } = req.query;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    
    if (parkId) {
      where.OR = [
        { parkId: parkId as string },
        { leases: { some: { parkId: parkId as string } } }
      ];
    }
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['name', 'contact', 'phone', 'email', 'industry']);
      Object.assign(where, searchQuery);
    }
    
    const customers = await prisma.customer.findMany({
      where,
      include: { leases: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const customerHeaders = {
      name: '客户名称',
      contact: '联系人',
      phone: '电话',
      email: '邮箱',
      industry: '行业',
      type: '类型',
      status: '状态',
      intendedLeaseMode: '意向租赁模式',
      intendedQuantity: '意向租赁数量',
      createdAt: '创建时间',
      updatedAt: '更新时间'
    };
    
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(res, {
      data: customers,
      headers: customerHeaders,
      excludeFields: [],
      filename: `客户列表_${date}`
    });
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: 'Failed to export customers' });
  }
};
