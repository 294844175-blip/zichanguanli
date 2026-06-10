import { Request, Response } from 'express';
import prisma from '../config/database';
import { updateAssetScore } from '../services/assetService';
import * as path from 'path';
import * as fs from 'fs';
import { buildSearchQuery } from '../utils/searchUtils';
import { exportToCSV } from '../utils/exportUtils';

export const getAssets = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;
    const { parkId, status, type, keyword } = req.query;
    
    const where: any = {};
    if (parkId) where.parkId = parkId;
    if (status) where.status = status;
    if (type) where.type = type;
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['code', 'name', 'type', 'customer', 'industry']);
      Object.assign(where, searchQuery);
    }
    
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: pageSize,
        include: { leases: { include: { customer: true } },
        park: true,
        building: true,
        floor: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.asset.count({ where }),
    ]);

    // 计算每个资产的已出租面积（活跃租赁订单的租赁数量总和）
    const assetsWithRented = assets.map(asset => {
      const { rentableArea, projectionArea, ...rest } = asset;
      const rentedArea = (asset.leases || [])
        .filter((lease: any) => ['ACTIVE', 'EXPIRING', 'OVERDUE'].includes(lease.status))
        .reduce((sum: number, lease: any) => sum + (lease.quantity || 0), 0);
      return { ...rest, rentedArea };
    });

    res.json({ data: assetsWithRented, total, page, pageSize });
  } catch {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

export const getAssetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        leases: { include: { customer: true } },
        costs: true,
        park: true,
        building: true,
        floor: true,
      },
    });
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // 计算已出租面积（活跃租赁订单的租赁数量总和）并移除 rentableArea/projectionArea
    const { rentableArea, projectionArea, ...rest } = asset;
    const rentedArea = (asset.leases || [])
      .filter((lease: any) => ['ACTIVE', 'EXPIRING', 'OVERDUE'].includes(lease.status))
      .reduce((sum: number, lease: any) => sum + (lease.quantity || 0), 0);
    
    res.json({ ...rest, rentedArea });
  } catch {
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    console.log('Creating asset with data:', req.body);
    
    const { 
      name, type, status, 
      graphicArea, graphicWidth, graphicHeight,
      assetArea, buildingArea, 
      sliceX, sliceY, sliceWidth, sliceHeight, sliceRotation, 
      sliceIcon, sliceTitle, 
      unitPrice, propertyFeeUnit, utilityFeeUnit, 
      parkId, score 
    } = req.body;
    
    if (!parkId) {
      return res.status(400).json({ error: 'parkId is required' });
    }
    
    const park = await prisma.park.findUnique({ where: { id: parkId } });
    if (!park) {
      return res.status(404).json({ error: `Park not found: ${parkId}` });
    }
    
    const code = 'KF' + Date.now().toString().slice(-10);
    
    const canvasCenterX = 1000;
    const canvasCenterY = 750;
    
    const PIXELS_PER_METER = 10;
    
    let finalGraphicArea = graphicArea || 0;
    let finalSliceWidth = sliceWidth || 0;
    let finalSliceHeight = sliceHeight || 0;
    let finalSliceX = sliceX || 0;
    let finalSliceY = sliceY || 0;
    
    if (graphicWidth && graphicHeight) {
      finalGraphicArea = graphicWidth * graphicHeight;
      finalSliceWidth = graphicWidth * PIXELS_PER_METER;
      finalSliceHeight = graphicHeight * PIXELS_PER_METER;
      finalSliceX = canvasCenterX - (finalSliceWidth / 2);
      finalSliceY = canvasCenterY - (finalSliceHeight / 2);
    }
    
    const assetData: any = {
      code,
      name,
      type,
      parkId,
      status: status || 'VACANT',
      graphicArea: finalGraphicArea,
      assetArea: assetArea || 0,
      buildingArea: buildingArea || 0,
      sliceX: finalSliceX,
      sliceY: finalSliceY,
      sliceWidth: finalSliceWidth,
      sliceHeight: finalSliceHeight,
      sliceRotation: sliceRotation || 0,
      unitPrice: unitPrice || 0,
      propertyFeeUnit: propertyFeeUnit || 0,
      utilityFeeUnit: utilityFeeUnit || 0,
      score: score || 0,
    };
    
    if (sliceIcon) assetData.sliceIcon = sliceIcon;
    if (sliceTitle) assetData.sliceTitle = sliceTitle;
    
    console.log('Prepared asset data:', assetData);
    
    const asset = await prisma.asset.create({ data: assetData });
    await updateAssetScore(asset.id);
    console.log('Created asset:', asset);
    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create asset', details: errorMessage });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      code, name, type, status, 
      graphicArea, assetArea, buildingArea, 
      sliceX, sliceY, sliceWidth, sliceHeight, sliceRotation, 
      sliceIcon, sliceTitle, 
      unitPrice, propertyFeeUnit, utilityFeeUnit, 
      score,
      customer, industry, contractNo, phone,
      floorHeight, loadCapacity, passage,
      startDate, endDate
    } = req.body;

    console.log('Updating asset with id:', id);
    
    // 查看数据库中所有的资产id
    const allAssets = await prisma.asset.findMany({ select: { id: true, name: true } });
    console.log('All assets in database:', allAssets);

    const assetData: any = {};
    if (code !== undefined) assetData.code = code;
    if (name !== undefined) assetData.name = name;
    if (type !== undefined) assetData.type = type;
    if (status !== undefined) assetData.status = status;
    if (graphicArea !== undefined) assetData.graphicArea = graphicArea;
    if (assetArea !== undefined) assetData.assetArea = assetArea;
    if (buildingArea !== undefined) assetData.buildingArea = buildingArea;
    if (sliceX !== undefined) assetData.sliceX = sliceX;
    if (sliceY !== undefined) assetData.sliceY = sliceY;
    if (sliceWidth !== undefined) assetData.sliceWidth = sliceWidth;
    if (sliceHeight !== undefined) assetData.sliceHeight = sliceHeight;
    if (sliceRotation !== undefined) assetData.sliceRotation = sliceRotation;
    if (sliceIcon !== undefined) assetData.sliceIcon = sliceIcon;
    if (sliceTitle !== undefined) assetData.sliceTitle = sliceTitle;
    if (unitPrice !== undefined) assetData.unitPrice = unitPrice;
    if (propertyFeeUnit !== undefined) assetData.propertyFeeUnit = propertyFeeUnit;
    if (utilityFeeUnit !== undefined) assetData.utilityFeeUnit = utilityFeeUnit;
    if (score !== undefined) assetData.score = score;
    if (customer !== undefined) assetData.customer = customer;
    if (industry !== undefined) assetData.industry = industry;
    if (contractNo !== undefined) assetData.contractNo = contractNo;
    if (phone !== undefined) assetData.phone = phone;
    if (floorHeight !== undefined) assetData.floorHeight = floorHeight;
    if (loadCapacity !== undefined) assetData.loadCapacity = loadCapacity;
    if (passage !== undefined) assetData.passage = passage;
    if (startDate !== undefined) assetData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) assetData.endDate = endDate ? new Date(endDate) : null;

    console.log('Updating asset with data:', assetData);
    
    const asset = await prisma.asset.update({
      where: { id },
      data: assetData,
    });
    
    await updateAssetScore(id);
    res.json(asset);
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Failed to update asset', details: error instanceof Error ? error.message : String(error) });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 先删除关联的AssetCost
    await prisma.assetCost.deleteMany({
      where: { assetId: id }
    });
    // 再删除关联的Lease
    await prisma.lease.deleteMany({
      where: { assetId: id }
    });
    // 最后删除Asset
    await prisma.asset.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset', details: error instanceof Error ? error.message : String(error) });
  }
};

export const getAssetSlices = async (req: Request, res: Response) => {
  try {
    const { parkId } = req.params;
    const assets = await prisma.asset.findMany({
      where: { parkId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        graphicArea: true,
        assetArea: true,
        sliceX: true,
        sliceY: true,
        sliceWidth: true,
        sliceHeight: true,
        sliceRotation: true,
        sliceIcon: true,
        sliceTitle: true,
        unitPrice: true,
        score: true,
        customer: true,
        type: true,
        floorHeight: true,
        loadCapacity: true,
        passage: true,
        images: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(assets);
  } catch {
    res.status(500).json({ error: 'Failed to fetch asset slices' });
  }
};

export const updateAssetSlices = async (req: Request, res: Response) => {
  try {
    const { parkId } = req.params;
    const updates = req.body;
    
    const promises = updates.map((item: any) => {
      const updateData: any = {
        sliceX: item.sliceX,
        sliceY: item.sliceY,
        sliceWidth: item.sliceWidth,
        sliceHeight: item.sliceHeight,
        sliceRotation: item.sliceRotation,
        sliceIcon: item.sliceIcon,
        sliceTitle: item.sliceTitle,
      };
      
      // 如果有传入 graphicArea，则更新它
      if (item.graphicArea !== undefined) {
        updateData.graphicArea = item.graphicArea;
      } 
      // 如果没有传入但有宽度和高度，自动计算
      else if (item.sliceWidth !== undefined && item.sliceHeight !== undefined) {
        updateData.graphicArea = (item.sliceWidth * item.sliceHeight) / 100;
      }
      
      return prisma.asset.update({
        where: { id: item.id },
        data: updateData,
      });
    });
    
    await Promise.all(promises);
    res.json({ success: true });
  } catch (error) {
    console.error('Update asset slices error:', error);
    res.status(500).json({ error: 'Failed to update slices', details: error instanceof Error ? error.message : String(error) });
  }
};

export const getAssetCosts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const costs = await prisma.assetCost.findMany({
      where: { assetId: id },
      orderBy: { date: 'desc' },
    });
    res.json(costs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
};

export const createAssetCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cost = await prisma.assetCost.create({
      data: { ...req.body, assetId: id },
    });
    await updateAssetScore(id);
    res.status(201).json(cost);
  } catch {
    res.status(500).json({ error: 'Failed to create cost' });
  }
};

export const getAssetImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const images = JSON.parse(asset.images || '[]');
    res.json(images);
  } catch {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
};

export const uploadAssetImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const images = JSON.parse(asset.images || '[]');
    images.push(imageUrl);
    const updated = await prisma.asset.update({
      where: { id },
      data: { images: JSON.stringify(images) },
    });
    res.json({ url: imageUrl, images });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const deleteAssetImage = async (req: Request, res: Response) => {
  try {
    const { id, filename } = req.params;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const images = JSON.parse(asset.images || '[]');
    const imageUrl = `/uploads/${filename}`;
    const newImages = images.filter((img: string) => img !== imageUrl);
    await prisma.asset.update({
      where: { id },
      data: { images: JSON.stringify(newImages) },
    });
    const filePath = path.join(__dirname, '../../public', imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, images: newImages });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export const exportAssets = async (req: Request, res: Response) => {
  try {
    const { parkId, status, type, keyword } = req.query;
    
    const where: any = {};
    if (parkId) where.parkId = parkId;
    if (status) where.status = status;
    if (type) where.type = type;
    
    if (keyword) {
      const searchQuery = buildSearchQuery(keyword as string, ['code', 'name', 'type', 'customer', 'industry']);
      Object.assign(where, searchQuery);
    }
    
    const assets = await prisma.asset.findMany({
      where,
      include: { park: true, building: true, floor: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const assetHeaders = {
      code: '资产编号',
      name: '资产名称',
      type: '资产类型',
      status: '资产状态',
      graphicArea: '图形面积(㎡)',
      assetArea: '资产面积(㎡)',
      buildingArea: '建筑面积(㎡)',
      rentedArea: '已出租面积(㎡)',
      unitPrice: '报价单价(元/㎡)',
      propertyFeeUnit: '物业费(元/㎡)',
      utilityFeeUnit: '水电费(元/㎡)',
      score: '评分',
      customer: '客户名称',
      industry: '所属行业',
      contractNo: '合同编号',
      phone: '联系电话',
      floorHeight: '层高(m)',
      loadCapacity: '承重(t/㎡)',
      passage: '通道',
      startDate: '开始日期',
      endDate: '结束日期',
      'park.name': '所属园区',
      'building.name': '所属楼宇',
      'floor.name': '所属楼层',
      createdAt: '创建时间',
      updatedAt: '更新时间'
    };
    
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(res, {
      data: assets,
      headers: assetHeaders,
      excludeFields: ['images', 'sliceIcon'],
      filename: `资产列表_${date}`
    });
  } catch (error) {
    console.error('Export assets error:', error);
    res.status(500).json({ error: 'Failed to export assets' });
  }
};
