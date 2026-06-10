import client from './client';
import { User, Role, Organization, Park } from '../types';

export const getUsers = async (params?: { keyword?: string }): Promise<User[]> => {
  const { data } = await client.get('/users', { params });
  return data;
};

export const exportUsers = async (params?: { keyword?: string }): Promise<void> => {
  const response = await client.get('/users/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let fileName = 'users.csv';
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

export const createUser = async (data: Partial<User>): Promise<User> => {
  const { data: res } = await client.post('/users', data);
  return res;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const { data: res } = await client.put(`/users/${id}`, data);
  return res;
};

export const toggleUserStatus = async (id: string, status: string): Promise<User> => {
  const { data } = await client.put(`/users/${id}/status`, { status });
  return data;
};

export const getRoles = async (params?: { keyword?: string }): Promise<Role[]> => {
  const { data } = await client.get('/roles', { params });
  return data;
};

export const exportRoles = async (params?: { keyword?: string }): Promise<void> => {
  const response = await client.get('/roles/export', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let fileName = 'roles.csv';
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

export const createRole = async (data: Partial<Role>): Promise<Role> => {
  const { data: res } = await client.post('/roles', data);
  return res;
};

export const updateRole = async (id: string, data: Partial<Role>): Promise<Role> => {
  const { data: res } = await client.put(`/roles/${id}`, data);
  return res;
};

export const getOrgTree = async (): Promise<Organization[]> => {
  const { data } = await client.get('/organizations/tree');
  return data;
};

export const createOrg = async (data: Partial<Organization>): Promise<Organization> => {
  const { data: res } = await client.post('/organizations', data);
  return res;
};

export const updateOrg = async (id: string, data: Partial<Organization>): Promise<Organization> => {
  const { data: res } = await client.put(`/organizations/${id}`, data);
  return res;
};

export const deleteOrg = async (id: string): Promise<void> => {
  await client.delete(`/organizations/${id}`);
};

export const deleteUser = async (id: string): Promise<void> => {
  await client.delete(`/users/${id}`);
};

export const deleteRole = async (id: string): Promise<void> => {
  await client.delete(`/roles/${id}`);
};

export const getUserParks = async (userId: string): Promise<Park[]> => {
  const { data } = await client.get(`/users/${userId}/parks`);
  return data;
};

export const assignUserParks = async (userId: string, parkIds: string[]): Promise<Park[]> => {
  const { data } = await client.post(`/users/${userId}/parks`, { parkIds });
  return data;
};

export const removeUserPark = async (userId: string, parkId: string): Promise<void> => {
  await client.delete(`/users/${userId}/parks/${parkId}`);
};

export const login = async (username: string, password: string): Promise<{ token: string; user: any }> => {
  const { data } = await client.post('/auth/login', { username, password });
  return data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
