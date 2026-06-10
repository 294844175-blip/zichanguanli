import client from './client';
import { Alert } from '../types';

export const getAlerts = async (status?: string): Promise<Alert[]> => {
  const { data } = await client.get('/alerts', { params: { status } });
  return data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await client.get('/alerts/unread-count');
  return data.count;
};

export const markAsRead = async (id: string): Promise<void> => {
  await client.put(`/alerts/${id}/read`);
};
