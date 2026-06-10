export type AssetStatus = 'VACANT' | 'RENTED' | 'EXPIRING' | 'RISK' | 'CONSTRUCTION';
export type LeaseStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'OVERDUE';
export type RiskLevel = 'NORMAL' | 'HIGH';
export type CustomerType = 'TENANT' | 'PROSPECT';
export type CostType = 'SPACE' | 'UTILITY' | 'PROPERTY' | 'MAINTENANCE';
export type AlertType = 'EXPIRING' | 'OVERDUE' | 'VACANT' | 'LOW_YIELD';
export type AlertStatus = 'UNREAD' | 'READ' | 'RESOLVED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Park {
  id: string;
  name: string;
  code: string;
  orgId: string;
  backgroundUrl?: string;
  backgroundX: number;
  backgroundY: number;
  backgroundScale: number;
  backgroundLocked: boolean;
  status: string;
  totalArea: number;
  buildingArea: number;
  rentableArea: number;
  greenArea: number;
  hardenedArea: number;
  parkingSpaces: number;
  boardSpaces: number;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  type: string;
  status: AssetStatus;
  graphicArea: number;
  assetArea: number;
  rentableArea: number;
  buildingArea: number;
  projectionArea: number;
  sliceX: number;
  sliceY: number;
  sliceWidth: number;
  sliceHeight: number;
  sliceRotation: number;
  sliceIcon?: string;
  sliceTitle?: string;
  unitPrice: number;
  propertyFeeUnit: number;
  utilityFeeUnit: number;
  parkId: string;
  score: number;
  zIndex?: number;
  customer?: string;
  industry?: string;
  contractNo?: string;
  phone?: string;
  floorHeight?: number;
  loadCapacity?: number;
  passage?: string;
  startDate?: string;
  endDate?: string;
  lease?: Lease;
  costs?: AssetCost[];
  park?: Park;
  building?: Building;
  floor?: Floor;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  id: string;
  name: string;
  parkId: string;
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

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  contact?: string;
  phone?: string;
  email?: string;
  industry?: string;
  needs?: string;
  status: string;
  parkId?: string;
  intendedAssetId?: string;
  intendedLeaseMode?: string;
  intendedQuantity?: number;
  leases?: Lease[];
  followUps?: FollowUp[];
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: string;
  assetId: string;
  customerId: string;
  parkId: string;
  startDate: string;
  endDate: string;
  rentMethod: string;
  billingUnit: string;
  unitPrice: number;
  quantity: number;
  dailyEstimate: number;
  monthlyEstimate: number;
  propertyFee: number;
  utilityFee: number;
  waterFee: number;
  electricFee: number;
  status: LeaseStatus;
  riskLevel: RiskLevel;
  deposit: number;
  contractUrl?: string;
  asset?: Asset;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

export interface AssetCost {
  id: string;
  assetId: string;
  type: CostType;
  amount: number;
  date: string;
  description?: string;
  invoiceUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  content: string;
  followUpDate: string;
  nextFollowUp?: string;
  result?: string;
  createdBy: string;
  createdAt: string;
}

export interface RevenueRecord {
  id: string;
  parkId: string;
  period: string;
  targetRevenue: number;
  actualRevenue: number;
  expectedRevenue: number;
  completionRate: number;
  grossProfit: number;
  grossMargin: number;
  totalCost: number;
  spaceCost: number;
  utilityCost: number;
  propertyCost: number;
  maintenanceCost: number;
  receivable: number;
  overdue: number;
  notOverdue: number;
  overdueRate: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  targetId: string;
  targetType: string;
  message: string;
  status: AlertStatus;
  severity: AlertSeverity;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  realName?: string;
  phone?: string;
  email?: string;
  status: string;
  roleId: string;
  orgId?: string;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  dataScope: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  children?: Organization[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssetTypeBreakdownItem {
  name: string;
  value: number;
}

export interface OccupancyStats {
  totalAssets: number;
  rentedAssets: number;
  expiringAssets: number;
  vacantAssets: number;
  constructionAssets: number;
  totalRentableArea: number;
  rentedArea: number;
  vacantArea: number;
  occupancyRate: number;
}

export interface CustomerStats {
  totalCustomers: number;
  tenantCustomers: number;
  prospectCustomers: number;
}

export interface LeaseStats {
  totalLeases: number;
  activeLeases: number;
  expiringLeases: number;
  overdueLeases: number;
}

export interface AlertStats {
  vacantOver30Days: number;
  highRiskCustomers: number;
  overdueRentCustomers: number;
}

export interface MonthlyTrendItem {
  month: string;
  name: string;
  occupancyRate: number;
  revenue: number;
  grossMargin: number;
}

export interface DashboardOverview {
  occupancy: OccupancyStats;
  revenue: {
    targetRevenue: number;
    actualRevenue: number;
    expectedRevenue: number;
    completionRate: number;
    grossProfit: number;
    grossMargin: number;
    totalCost: number;
  };
  costs: {
    spaceCost: number;
    utilityCost: number;
    propertyCost: number;
    maintenanceCost: number;
    totalCost: number;
  };
  assetTypeBreakdown: AssetTypeBreakdownItem[];
  customers: CustomerStats;
  leases: LeaseStats;
  alerts: AlertStats;
}

export interface HikvisionConfig {
  appKey: string;
  appSecret: string;
  ip: string;
  port: string;
  cameraIndexCode: string;
  protocol: 'rtsp' | 'hls' | 'ws';
  streamType: 'main' | 'sub';
}

export interface Camera {
  id: string;
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  name: string;
  hikvisionConfig?: HikvisionConfig;
}
