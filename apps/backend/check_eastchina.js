const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPark() {
  const parks = await prisma.park.findMany();
  const park = parks.find(p => p.name && p.name.indexOf('华东') >= 0);
  
  if (!park) {
    console.log('未找到华东运营中心');
    await prisma.$disconnect();
    return;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  console.log('=== 华东运营中心 ===');
  console.log('园区 ID: ' + park.id);
  console.log('当前月份: ' + monthStart.toISOString().slice(0,7));
  console.log('筛选条件: status=ACTIVE, 租期覆盖当前月');
  console.log('');

  const leases = await prisma.lease.findMany({
    where: {
      parkId: park.id,
      status: 'ACTIVE',
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart }
    },
    include: { asset: true, customer: true }
  });

  console.log('订单总数: ' + leases.length);
  console.log('');

  let total = 0;
  leases.forEach((l, idx) => {
    const rent = l.monthlyEstimate || l.unitPrice || 0;
    const utility = l.utilityFee || 0;
    const property = l.propertyFee || 0;
    const sum = rent + utility + property;
    total += sum;
    console.log('[' + (idx+1) + '] 资产: ' + (l.asset?.name || '未知'));
    console.log('     客户: ' + (l.customer?.name || '未知'));
    console.log('     租期: ' + l.startDate?.toISOString().slice(0,10) + ' ~ ' + l.endDate?.toISOString().slice(0,10));
    console.log('     unitPrice: ' + l.unitPrice + ', quantity: ' + l.quantity + ', monthlyEstimate: ' + l.monthlyEstimate);
    console.log('     月租金: ' + rent + ' (用 monthlyEstimate || unitPrice)');
    console.log('     水电费: ' + utility + ', 物业费: ' + property);
    console.log('     月收入合计: ' + sum);
    console.log('');
  });

  console.log('=========================');
  console.log('本月收入总计: ¥' + total.toLocaleString());

  // 再查一下所有 ACTIVE 订单（不限制日期）
  const allLeases = await prisma.lease.findMany({
    where: { parkId: park.id, status: 'ACTIVE' },
    include: { asset: true, customer: true }
  });
  
  console.log('');
  console.log('=== 所有 ACTIVE 订单（无日期限制）===');
  console.log('订单总数: ' + allLeases.length);
  allLeases.forEach((l, idx) => {
    const rent = l.monthlyEstimate || l.unitPrice || 0;
    const sum = rent + (l.utilityFee || 0) + (l.propertyFee || 0);
    console.log('[' + (idx+1) + '] 客户: ' + (l.customer?.name || '未知') + ', 租期: ' + l.startDate?.toISOString().slice(0,10) + '~' + l.endDate?.toISOString().slice(0,10) + ', 月收入: ' + sum);
  });

  await prisma.$disconnect();
}

checkPark().catch(console.error);
