import client from './client';
import { DashboardOverview, RevenueRecord, MonthlyTrendItem } from '../types';

export const getOverview = async (parkId?: string): Promise<DashboardOverview> => {
  const { data } = await client.get('/dashboard/overview', { params: { parkId } });
  return data;
};

export const getRevenueTrend = async (params?: { parkId?: string; year?: string }): Promise<RevenueRecord[]> => {
  const { data } = await client.get('/dashboard/revenue', { params });
  return data;
};

export const getMonthlyTrends = async (params?: { parkId?: string; year?: string }): Promise<MonthlyTrendItem[]> => {
  const { data } = await client.get('/dashboard/monthly-trends', { params });
  return data;
};

export const getMultiParkSummary = async (): Promise<any[]> => {
  const { data } = await client.get('/dashboard/multi-park');
  return data;
};
