import client from './client';
import { Asset, PaginatedResponse, AssetCost } from '../types';

export const getAssets = async (params?: { page?: number; pageSize?: number; parkId?: string; status?: string; type?: string; keyword?: string }): Promise<PaginatedResponse<Asset>> => {
  const { data } = await client.get('/assets', { params });
  return data;
};

export const exportAssets = async (params?: { parkId?: string; status?: string; type?: string; keyword?: string }): Promise<void> => {
  const response = await client.get('/assets/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let fileName = 'assets.csv';
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = fileNameMatch[1].replace(/['"]/g, '');
    }
  }
  link.setAttribute('download', decodeURIComponent(fileName));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getAssetById = async (id: string): Promise<Asset> => {
  const { data } = await client.get(`/assets/${id}`);
  return data;
};

export const createAsset = async (data: Partial<Asset>): Promise<Asset> => {
  const { data: res } = await client.post('/assets', data);
  return res;
};

export const updateAsset = async (id: string, data: Partial<Asset>): Promise<Asset> => {
  const { data: res } = await client.put(`/assets/${id}`, data);
  return res;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await client.delete(`/assets/${id}`);
};

export const getAssetSlices = async (parkId: string): Promise<Asset[]> => {
  const { data } = await client.get(`/assets/slices/${parkId}`);
  return data;
};

export const updateAssetSlices = async (parkId: string, slices: Partial<Asset>[]): Promise<void> => {
  await client.put(`/assets/slices/${parkId}`, slices);
};

export const getAssetCosts = async (assetId: string): Promise<AssetCost[]> => {
  const { data } = await client.get(`/assets/${assetId}/costs`);
  return data;
};

export const createAssetCost = async (assetId: string, data: Partial<AssetCost>): Promise<AssetCost> => {
  const { data: res } = await client.post(`/assets/${assetId}/costs`, data);
  return res;
};

export const getAssetImages = async (assetId: string): Promise<string[]> => {
  const { data } = await client.get(`/assets/${assetId}/images`);
  return data;
};

export const uploadAssetImage = async (assetId: string, file: File): Promise<{ url: string; images: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post(`/assets/${assetId}/images/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteAssetImage = async (assetId: string, filename: string): Promise<{ success: boolean; images: string[] }> => {
  const { data } = await client.delete(`/assets/${assetId}/images/${filename}`);
  return data;
};
