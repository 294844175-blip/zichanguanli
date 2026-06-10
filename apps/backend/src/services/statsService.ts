import prisma from '../config/database';

export async function getAssetTypeBreakdown(parkId?: string) {
  const where = parkId ? { parkId } : {};
  
  const assets = await prisma.asset.findMany({
    where,
    select: {
      type: true,
      assetArea: true,
    },
  });
  
  // 标准化类型映射：将各种不同的输入类型映射到5类标准类型
  const typeMap: Record<string, number> = {
    '冻库': 0,
    '冷藏库': 0,
    '常温库': 0,
    '办公': 0,
    '配套': 0,
  };
  
  const normalizeType = (rawType: string): string => {
    const type = rawType || '';
    if (type.includes('冻库') || type.includes('冷库') || type.includes('冷藏')) {
      if (type.includes('冻库')) return '冻库';
      if (type === '冷库' || type.includes('冷藏')) return '冷藏库';
      return '冻库';
    }
    if (type.includes('常温') || type === '库房') return '常温库';
    if (type.includes('办公') || type === '办公室' || type === '写字楼') return '办公';
    if (type.includes('厂房') || type.includes('商铺') || type.includes('车位')) return '配套';
    if (type === 'PARK' || type === 'SPACE' || type === '') return '配套';
    return '配套';
  };
  
  assets.forEach(asset => {
    const stdType = normalizeType(asset.type);
    typeMap[stdType] += asset.assetArea || 0;
  });
  
  return Object.entries(typeMap).map(([name, value]) => ({
    name,
    value,
  }));
}

export async function getOccupancyStats(parkId?: string) {
  const where = parkId ? { parkId } : {};
  
  // 按资产数量统计
  const [totalAssets, rentedAssets, expiringAssets, vacantAssets, constructionAssets] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.count({ where: { ...where, status: 'RENTED' } }),
    prisma.asset.count({ where: { ...where, status: 'EXPIRING' } }),
    prisma.asset.count({ where: { ...where, status: 'VACANT' } }),
    prisma.asset.count({ where: { ...where, status: 'CONSTRUCTION' } }),
  ]);
  
  // 总资产面积
  const rentableAreaSum = await prisma.asset.aggregate({
    where,
    _sum: { assetArea: true },
  });
  
  // 已出租面积：所有活跃租赁订单的租赁数量之和
  const leasedQuantitySum = await prisma.lease.aggregate({
    where: {
      ...(parkId ? { parkId } : {}),
      status: { in: ['ACTIVE', 'EXPIRING', 'OVERDUE'] },
    },
    _sum: { quantity: true },
  });
  
  // 空置资产的面积
  const vacantAreaSum = await prisma.asset.aggregate({
    where: { ...where, status: 'VACANT' },
    _sum: { assetArea: true },
  });
  
  const totalRentable = rentableAreaSum._sum.assetArea || 0;
  const rentedArea = leasedQuantitySum._sum.quantity || 0;
  const vacantArea = vacantAreaSum._sum.assetArea || 0;
  
  // 出租率 = 已出租面积 / 总可出租面积 * 100%
  const occupancyRate = totalRentable > 0 ? (rentedArea / totalRentable) * 100 : 0;
  
  return {
    totalAssets,
    rentedAssets,
    expiringAssets,
    vacantAssets,
    constructionAssets,
    totalRentableArea: totalRentable,
    rentedArea,
    vacantArea,
    occupancyRate,
  };
}

export async function getCustomerStats(parkId?: string) {
  const where: any = {};
  if (parkId) {
    where.OR = [
      { parkId },
      { leases: { some: { parkId } } },
    ];
  }
  
  const leaseWhere: any = {};
  if (parkId) {
    leaseWhere.parkId = parkId;
  }
  
  const [totalCustomers, tenantCustomers, prospectCustomers, tenantWithActiveLeases] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { ...where, type: 'TENANT' } }),
    prisma.customer.count({ where: { ...where, type: 'PROSPECT' } }),
    prisma.customer.count({
      where: {
        ...(parkId ? {
          OR: [{ parkId }, { leases: { some: { parkId } } }],
        } : {}),
        leases: {
          some: {
            ...leaseWhere,
            status: { in: ['ACTIVE', 'EXPIRING', 'OVERDUE'] },
          },
        },
      },
    }),
  ]);
  
  return {
    totalCustomers,
    tenantCustomers: tenantWithActiveLeases,
    prospectCustomers,
  };
}

export async function getLeaseStats(parkId?: string) {
  const where = parkId ? { parkId } : {};
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  const [totalLeases, activeLeases, expiringLeases, overdueLeases] = await Promise.all([
    prisma.lease.count({ where }),
    prisma.lease.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.lease.count({
      where: {
        ...where,
        endDate: {
          gte: today.toISOString(),
          lte: thirtyDaysLater.toISOString(),
        },
      },
    }),
    prisma.lease.count({ where: { ...where, status: 'OVERDUE' } }),
  ]);
  
  return {
    totalLeases,
    activeLeases,
    expiringLeases,
    overdueLeases,
  };
}

export async function getAlertStats(parkId?: string) {
  const where = parkId ? { parkId } : {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [vacantOver30Days, highRiskCustomers, overdueRentCustomers] = await Promise.all([
    prisma.asset.count({
      where: {
        ...where,
        status: 'VACANT',
        updatedAt: { lte: thirtyDaysAgo.toISOString() },
      },
    }),
    prisma.customer.count({
      where: {
        ...(parkId ? {
          OR: [{ parkId }, { leases: { some: { parkId } } }],
        } : {}),
        leases: { some: { riskLevel: 'HIGH' } },
      },
    }),
    prisma.customer.count({
      where: {
        ...(parkId ? {
          OR: [{ parkId }, { leases: { some: { parkId } } }],
        } : {}),
        leases: { some: { status: 'OVERDUE' } },
      },
    }),
  ]);
  
  return {
    vacantOver30Days,
    highRiskCustomers,
    overdueRentCustomers,
  };
}

export async function getRevenueStats(parkId?: string, period?: string) {
  const leaseWhere: any = {};
  if (parkId) leaseWhere.parkId = parkId;

  // 计算当月起止日期
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 只统计租赁中(ACTIVE)状态且租期覆盖当前月的订单
  leaseWhere.status = 'ACTIVE';
  leaseWhere.startDate = { lte: monthEnd.toISOString() };
  leaseWhere.endDate = { gte: monthStart.toISOString() };

  const leases = await prisma.lease.findMany({ where: leaseWhere });

  // 月收入 = 月租金 + 物业费 + 水电费
  // 月租金 = 租赁单价 × 租赁数量
  // 物业费 = 物业费单价 × 租赁数量
  // 水电费 = 水费单价 × 租赁数量 + 电费单价 × 租赁数量
  const actualRevenue = leases.reduce((sum, lease) => {
    const qty = lease.quantity || 1;
    const rent = (lease.unitPrice || 0) * qty;
    const property = (lease.propertyFee || 0) * qty;
    const water = (lease.waterFee || 0) * qty;
    const electric = (lease.electricFee || 0) * qty;
    return sum + rent + property + water + electric;
  }, 0);
  
  // 获取成本数据
  const costWhere: any = {};
  if (parkId) costWhere.parkId = parkId;
  // 如果有period参数，使用period，否则使用当前月份
  if (!period) {
    const now = new Date();
    period = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  costWhere.period = period;
  
  const costRecords = await prisma.revenueRecord.findMany({ where: costWhere });
  const totalCost = costRecords.reduce((sum, record) => sum + (record.totalCost || 0), 0);
  
  const grossProfit = actualRevenue - totalCost;
  const grossMargin = actualRevenue > 0 ? (grossProfit / actualRevenue) * 100 : 0;
  
  // 保留原有的其他字段，保持兼容性
  const targetRevenue = costRecords.reduce((sum, record) => sum + (record.targetRevenue || 0), 0);
  const expectedRevenue = costRecords.reduce((sum, record) => sum + (record.expectedRevenue || 0), 0);
  
  return {
    targetRevenue,
    actualRevenue,
    expectedRevenue,
    completionRate: targetRevenue > 0 ? (actualRevenue / targetRevenue) * 100 : 0,
    grossProfit,
    grossMargin,
    totalCost,
  };
}

export async function getCostBreakdown(parkId?: string, period?: string) {
  const where: any = {};
  if (parkId) where.parkId = parkId;
  if (period) where.period = period;
  
  const records = await prisma.revenueRecord.findMany({ where });
  
  const totals = records.reduce((acc, r) => ({
    spaceCost: acc.spaceCost + r.spaceCost,
    utilityCost: acc.utilityCost + r.utilityCost,
    propertyCost: acc.propertyCost + r.propertyCost,
    maintenanceCost: acc.maintenanceCost + r.maintenanceCost,
  }), { spaceCost: 0, utilityCost: 0, propertyCost: 0, maintenanceCost: 0 });
  
  return {
    ...totals,
    totalCost: Object.values(totals).reduce((a, b) => a + b, 0),
  };
}

export async function getMonthlyTrends(parkId?: string, year?: string) {
  const targetYear = parseInt(year || new Date().getFullYear().toString());

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return `${targetYear}-${month.toString().padStart(2, '0')}`;
  });

  const trends = await Promise.all(
    months.map(async (period, i) => {
      const monthNum = i + 1;
      const monthStart = new Date(targetYear, monthNum - 1, 1);
      const monthEnd = new Date(targetYear, monthNum, 0, 23, 59, 59);

      // 每个月的收入 = 租期覆盖该月的 ACTIVE 订单的 (租金+水电+物业费) 之和
      const leaseWhere: any = {
        status: 'ACTIVE',
        startDate: { lte: monthEnd.toISOString() },
        endDate: { gte: monthStart.toISOString() },
      };
      if (parkId) leaseWhere.parkId = parkId;

      const leases = await prisma.lease.findMany({ where: leaseWhere });

      // 月收入 = 月租金 + 物业费 + 水电费
      const revenue = leases.reduce((sum, lease) => {
        const qty = lease.quantity || 1;
        const rent = (lease.unitPrice || 0) * qty;
        const property = (lease.propertyFee || 0) * qty;
        const water = (lease.waterFee || 0) * qty;
        const electric = (lease.electricFee || 0) * qty;
        return sum + rent + property + water + electric;
      }, 0);

      const revenueWhere: any = { period };
      if (parkId) revenueWhere.parkId = parkId;
      const revenueRecord = await prisma.revenueRecord.findFirst({ where: revenueWhere });

      const assetWhere = parkId ? { parkId } : {};
      // 总可出租面积
      const totalRentableSum = await prisma.asset.aggregate({
        where: assetWhere,
        _sum: { assetArea: true },
      });
      // 已出租面积 = 租期覆盖该月的活跃租赁订单的 quantity 之和
      const rentedArea = leases.reduce((sum, lease) => sum + (lease.quantity || 0), 0);
      const totalRentable = totalRentableSum._sum.assetArea || 0;
      const totalAssets = totalRentable; // 兼容字段
      const rentedAssets = rentedArea; // 兼容字段

      let grossMargin = revenueRecord?.grossMargin;
      if (!grossMargin && revenue > 0) {
        const totalCost = revenueRecord?.totalCost || 0;
        const grossProfit = revenue - totalCost;
        grossMargin = (grossProfit / revenue) * 100;
      }

      return {
        month: period,
        name: `${i + 1}月`,
        occupancyRate: totalRentable > 0 ? (rentedArea / totalRentable) * 100 : 0,
        revenue: revenue,
        grossMargin: grossMargin || 0,
      };
    })
  );

  return trends;
}
