import { Request, Response } from 'express';
import prisma from '../config/database';
import { 
  getOccupancyStats, 
  getRevenueStats, 
  getCostBreakdown, 
  getAssetTypeBreakdown,
  getCustomerStats,
  getLeaseStats,
  getAlertStats,
  getMonthlyTrends
} from '../services/statsService';

export const getOverview = async (req: Request, res: Response) => {
  try {
    const { parkId } = req.query;
    
    const [occupancy, revenue, costs, assetTypeBreakdown, customers, leases, alerts] = await Promise.all([
      getOccupancyStats(parkId as string),
      getRevenueStats(parkId as string),
      getCostBreakdown(parkId as string),
      getAssetTypeBreakdown(parkId as string),
      getCustomerStats(parkId as string),
      getLeaseStats(parkId as string),
      getAlertStats(parkId as string),
    ]);
    
    res.json({
      occupancy,
      revenue,
      costs,
      assetTypeBreakdown,
      customers,
      leases,
      alerts,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
};

export const getRevenueTrend = async (req: Request, res: Response) => {
  try {
    const { parkId, year } = req.query;
    const where: any = {};
    if (parkId) where.parkId = parkId;
    if (year) where.period = { startsWith: year };
    
    const records = await prisma.revenueRecord.findMany({
      where,
      orderBy: { period: 'asc' },
    });
    
    res.json(records);
  } catch {
    res.status(500).json({ error: 'Failed to fetch revenue trend' });
  }
};

export const getMonthlyTrendsData = async (req: Request, res: Response) => {
  try {
    const { parkId, year } = req.query;
    
    const trends = await getMonthlyTrends(parkId as string, year as string);
    
    res.json(trends);
  } catch {
    res.status(500).json({ error: 'Failed to fetch monthly trends' });
  }
};

export const getMultiParkSummary = async (req: Request, res: Response) => {
  try {
    const parks = await prisma.park.findMany({
      include: {
        _count: { select: { assets: true, leases: true } },
        revenueRecords: {
          orderBy: { period: 'desc' },
          take: 1,
        },
      },
    });
    
    const summary = parks.map(park => ({
      id: park.id,
      name: park.name,
      assetCount: park._count.assets,
      leaseCount: park._count.leases,
      latestRevenue: park.revenueRecords[0] || null,
    }));
    
    res.json(summary);
  } catch {
    res.status(500).json({ error: 'Failed to fetch multi-park summary' });
  }
};
