import client from './client';
import { Park } from '../types';

export const getParks = async (): Promise<Park[]> => {
  const { data } = await client.get('/parks');
  return data;
};

export const getParkById = async (id: string): Promise<Park> => {
  const { data } = await client.get(`/parks/${id}`);
  return data;
};

export const createPark = async (data: Partial<Park>): Promise<Park> => {
  const { data: res } = await client.post('/parks', data);
  return res;
};

export const updatePark = async (id: string, data: Partial<Park>): Promise<Park> => {
  const { data: res } = await client.put(`/parks/${id}`, data);
  return res;
};

export const updateParkBackground = async (id: string, backgroundUrl: string): Promise<Park> => {
  const { data } = await client.put(`/parks/${id}/background`, { backgroundUrl });
  return data;
};

export const uploadParkBackground = async (id: string, file: File): Promise<Park> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await client.post(`/parks/${id}/background/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteParkBackground = async (id: string): Promise<void> => {
  await client.delete(`/parks/${id}/background`);
};

export const updateParkBackgroundConfig = async (id: string, config: {
  backgroundX?: number;
  backgroundY?: number;
  backgroundScale?: number;
  backgroundLocked?: boolean;
}): Promise<Park> => {
  const { data } = await client.put(`/parks/${id}/background/config`, config);
  return data;
};
