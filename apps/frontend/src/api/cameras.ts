import client from './client';
import { Camera } from '../types';

export const getCameras = async (parkId: string): Promise<Camera[]> => {
  const { data } = await client.get(`/cameras/${parkId}`);
  return data;
};

export const createCamera = async (parkId: string, camera: Partial<Camera>): Promise<Camera> => {
  const { data } = await client.post(`/cameras/${parkId}`, camera);
  return data;
};

export const updateCamera = async (id: string, camera: Partial<Camera>): Promise<Camera> => {
  const { data } = await client.put(`/cameras/${id}`, camera);
  return data;
};

export const deleteCamera = async (id: string): Promise<void> => {
  await client.delete(`/cameras/${id}`);
};
