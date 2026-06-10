import client from './client';
import { Customer, FollowUp } from '../types';

export const getCustomers = async (params?: { type?: string; status?: string; parkId?: string; keyword?: string }): Promise<Customer[]> => {
  const { data } = await client.get('/customers', { params });
  return data;
};

export const exportCustomers = async (params?: { type?: string; status?: string; parkId?: string; keyword?: string }): Promise<void> => {
  const response = await client.get('/customers/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let fileName = 'customers.csv';
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

export const getCustomerById = async (id: string): Promise<Customer> => {
  const { data } = await client.get(`/customers/${id}`);
  return data;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const { data: res } = await client.post('/customers', data);
  return res;
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
  const { data: res } = await client.put(`/customers/${id}`, data);
  return res;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await client.delete(`/customers/${id}`);
};

export const getFollowUps = async (customerId: string): Promise<FollowUp[]> => {
  const { data } = await client.get(`/customers/${customerId}/follow-ups`);
  return data;
};

export const createFollowUp = async (customerId: string, data: Partial<FollowUp>): Promise<FollowUp> => {
  const { data: res } = await client.post(`/customers/${customerId}/follow-ups`, data);
  return res;
};

export const updateFollowUp = async (customerId: string, followUpId: string, data: Partial<FollowUp>): Promise<FollowUp> => {
  const { data: res } = await client.put(`/customers/${customerId}/follow-ups/${followUpId}`, data);
  return res;
};

export const matchProspect = async (params: { needs?: string; minArea?: number; maxBudget?: number }): Promise<any[]> => {
  const { data } = await client.post('/customers/match', params);
  return data;
};
