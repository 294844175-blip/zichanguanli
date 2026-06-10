import { Request, Response } from 'express';
import prisma from '../config/database';
import { updateAssetScore } from '../services/assetService';
import { buildSearchQuery } from '../utils/searchUtils';
import { exportToCSV } from '../utils/exportUtils';

export const getLeases = async (req: Request, res: Response) => {
  try {
    const { status, riskLevel, parkId, keyword } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (parkId) where.parkId = parkId;
    
    if (keyword) {
      where.OR = [
        { asset: { is: { name: { contains: keyword as string, mode: 'insensitive' } } } },
        { customer: { is: { name: { contains: keyword as string, mode: 'insensitive' } } } }
      ];
    }
    
    const leases = await prisma.lease.findMany({
      where,
      include: { asset: true, customer: true, park: true },
      orderBy: { endDate: 'asc' },
    });
    res.json(leases);
  } catch {
    res.status(500).json({ error: 'Failed to fetch leases' });
  }
};

export const getLeaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: { asset: true, customer: true },
    });
    
    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }
    
    res.json(lease);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lease' });
  }
};

export const createLease = async (req: Request, res: Response) => {
  try {
    const {
      assetId, customerId, parkId, startDate, endDate,
      rentMethod, billingUnit, unitPrice, quantity,
      dailyEstimate, monthlyEstimate, propertyFee, utilityFee,
      waterFee, electricFee,
      status, riskLevel, deposit, contractUrl
    } = req.body;

    if (!assetId || !customerId || !parkId || !startDate || !endDate || !rentMethod || !unitPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const qty = quantity ? parseFloat(quantity) : 1;
    // 月租金 = 租赁单价 × 租赁数量（自动计算，前端传入的 monthlyEstimate 仅作兼容）
    const calcMonthlyEstimate = (parseFloat(unitPrice) || 0) * qty;

    const leaseData: any = {
      assetId,
      customerId,
      parkId,
      startDate: start,
      endDate: end,
      rentMethod,
      billingUnit: billingUnit || '月',
      unitPrice: parseFloat(unitPrice),
      quantity: qty,
      dailyEstimate: dailyEstimate ? parseFloat(dailyEstimate) : 0,
      monthlyEstimate: calcMonthlyEstimate,
      propertyFee: propertyFee ? parseFloat(propertyFee) : 0,
      utilityFee: utilityFee ? parseFloat(utilityFee) : 0,
      waterFee: waterFee ? parseFloat(waterFee) : 0,
      electricFee: electricFee ? parseFloat(electricFee) : 0,
      status: status || 'ACTIVE',
      riskLevel: riskLevel || 'NORMAL',
      deposit: deposit ? parseFloat(deposit) : 0,
    };

    if (contractUrl) leaseData.contractUrl = contractUrl;

    const lease = await prisma.lease.create({ data: leaseData });
    
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'RENTED' },
    });
    
    await updateAssetScore(assetId);
    
    res.status(201).json(lease);
  } catch (error: any) {
    console.error('Error creating lease:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: '该资产已有租赁记录' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: '关联的客户、资产或园区不存在' });
    }
    res.status(500).json({ error: 'Failed to create lease', details: error.message });
  }
};

export const updateLease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    // 如果更新了 unitPrice 或 quantity，则自动重新计算 monthlyEstimate = 单价 × 数量
    if (updateData.unitPrice || updateData.quantity) {
      const existingLease = await prisma.lease.findUnique({ where: { id } });
      if (existingLease) {
        const newUnitPrice = updateData.unitPrice ? parseFloat(updateData.unitPrice) : existingLease.unitPrice;
        const newQuantity = updateData.quantity ? parseFloat(updateData.quantity) : existingLease.quantity;
        updateData.monthlyEstimate = (newUnitPrice || 0) * (newQuantity || 1);
      }
    }

    const lease = await prisma.lease.update({
      where: { id },
      data: updateData,
    });
    res.json(lease);
  } catch {
    res.status(500).json({ error: 'Failed to update lease' });
  }
};

export const getExpiringLeases = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const threshold = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    
    const leases = await prisma.lease.findMany({
      where: {
        endDate: { gte: now, lte: threshold },
        status: 'ACTIVE',
      },
      include: { asset: true, customer: true },
    });
    res.json(leases);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expiring leases' });
  }
};

export const getOverdueLeases = async (req: Request, res: Response) => {
  try {
    const leases = await prisma.lease.findMany({
      where: {
        endDate: { lt: new Date() },
        status: { not: 'EXPIRED' },
      },
      include: { asset: true, customer: true },
    });
    res.json(leases);
  } catch {
    res.status(500).json({ error: 'Failed to fetch overdue leases' });
  }
};

export const exportLeases = async (req: Request, res: Response) => {
  try {
    const { status, riskLevel, parkId, keyword } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (parkId) where.parkId = parkId;
    
    if (keyword) {
      where.OR = [
        { asset: { is: { name: { contains: keyword as string, mode: 'insensitive' } } } },
        { customer: { is: { name: { contains: keyword as string, mode: 'insensitive' } } } }
      ];
    }
    
    const leases = await prisma.lease.findMany({
      where,
      include: { asset: true, customer: true, park: true },
      orderBy: { endDate: 'asc' }
    });
    
    const leaseHeaders = {
      'asset.name': '资产名称',
      'customer.name': '客户名称',
      startDate: '开始日期',
      endDate: '结束日期',
      rentMethod: '租赁方式',
      billingUnit: '计费单位',
      unitPrice: '单价',
      quantity: '数量',
      monthlyEstimate: '月预估(元)',
      propertyFee: '物业费(元)',
      utilityFee: '水电费(元)',
      status: '状态',
      riskLevel: '风险等级',
      deposit: '押金(元)',
      'park.name': '所属园区',
      createdAt: '创建时间',
      updatedAt: '更新时间'
    };
    
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(res, {
      data: leases,
      headers: leaseHeaders,
      excludeFields: [],
      filename: `租赁合同_${date}`
    });
  } catch (error) {
    console.error('Export leases error:', error);
    res.status(500).json({ error: 'Failed to export leases' });
  }
};
