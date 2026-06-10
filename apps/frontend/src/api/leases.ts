import client from './client';
import { Lease } from '../types';

export const getLeases = async (params?: { status?: string; riskLevel?: string; parkId?: string; keyword?: string }): Promise<Lease[]> => {
  const { data } = await client.get('/leases', { params });
  return data;
};

export const exportLeases = async (params?: { status?: string; riskLevel?: string; parkId?: string; keyword?: string }): Promise<void> => {
  const response = await client.get('/leases/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let fileName = 'leases.csv';
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

export const getLeaseById = async (id: string): Promise<Lease> => {
  const { data } = await client.get(`/leases/${id}`);
  return data;
};

export const createLease = async (data: Partial<Lease>): Promise<Lease> => {
  const { data: res } = await client.post('/leases', data);
  return res;
};

export const updateLease = async (id: string, data: Partial<Lease>): Promise<Lease> => {
  const { data: res } = await client.put(`/leases/${id}`, data);
  return res;
};

export const getExpiringLeases = async (): Promise<Lease[]> => {
  const { data } = await client.get('/leases/expiring');
  return data;
};

export const getOverdueLeases = async (): Promise<Lease[]> => {
  const { data } = await client.get('/leases/overdue');
  return data;
};
