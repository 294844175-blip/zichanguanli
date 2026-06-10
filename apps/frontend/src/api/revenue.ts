import apiClient from './client';
import type { RevenueRecord } from '../types';

export const getRevenueRecords = async (params?: { parkId?: string; period?: string; source?: string }): Promise<RevenueRecord[]> => {
  const response = await apiClient.get('/revenue', { params });
  return response.data;
};

export const getRevenueRecordById = async (id: string): Promise<RevenueRecord> => {
  const response = await apiClient.get(`/revenue/${id}`);
  return response.data;
};

export const createRevenueRecord = async (data: Partial<RevenueRecord>): Promise<RevenueRecord> => {
  const response = await apiClient.post('/revenue', data);
  return response.data;
};

export const updateRevenueRecord = async (id: string, data: Partial<RevenueRecord>): Promise<RevenueRecord> => {
  const response = await apiClient.put(`/revenue/${id}`, data);
  return response.data;
};

export const deleteRevenueRecord = async (id: string): Promise<void> => {
  await apiClient.delete(`/revenue/${id}`);
};
