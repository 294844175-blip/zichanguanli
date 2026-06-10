import client from './client';

export interface Building {
  id: string;
  name: string;
  parkId: string;
  floors?: Floor[];
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  name: string;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
}

export const getBuildings = async (params?: { parkId?: string }): Promise<Building[]> => {
  const { data } = await client.get('/buildings', { params });
  return data;
};

export const getBuildingById = async (id: string): Promise<Building> => {
  const { data } = await client.get(`/buildings/${id}`);
  return data;
};

export const createBuilding = async (building: Omit<Building, 'id' | 'createdAt' | 'updatedAt' | 'floors'>): Promise<Building> => {
  const { data } = await client.post('/buildings', building);
  return data;
};

export const updateBuilding = async (id: string, building: Partial<Omit<Building, 'id' | 'createdAt' | 'updatedAt' | 'floors'>>): Promise<Building> => {
  const { data } = await client.put(`/buildings/${id}`, building);
  return data;
};

export const deleteBuilding = async (id: string): Promise<void> => {
  await client.delete(`/buildings/${id}`);
};

export const getFloors = async (params?: { buildingId?: string }): Promise<Floor[]> => {
  const { data } = await client.get('/floors', { params });
  return data;
};

export const getFloorById = async (id: string): Promise<Floor> => {
  const { data } = await client.get(`/floors/${id}`);
  return data;
};

export const createFloor = async (floor: Omit<Floor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Floor> => {
  const { data } = await client.post('/floors', floor);
  return data;
};

export const updateFloor = async (id: string, floor: Partial<Omit<Floor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Floor> => {
  const { data } = await client.put(`/floors/${id}`, floor);
  return data;
};

export const deleteFloor = async (id: string): Promise<void> => {
  await client.delete(`/floors/${id}`);
};
