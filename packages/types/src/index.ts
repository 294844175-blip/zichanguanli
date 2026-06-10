export interface Asset {
  id: string;
  name: string;
  category: string;
  status: AssetStatus;
  location: string;
  purchaseDate: string;
  price: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateAssetInput {
  name: string;
  category: string;
  location: string;
  purchaseDate: string;
  price: number;
  description?: string;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  status?: AssetStatus;
}
