const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
  const parks = await prisma.park.findMany();
  console.log('=== 所有园区 ===');
  parks.forEach(p => console.log('  ' + p.name + ' (id=' + p.id + ')'));
  console.log('');

  for (const park of parks) {
    console.log('【' + park.name + '】');
    const leases = await prisma.lease.findMany({
      where: { parkId: park.id, status: 'ACTIVE' },
      select: {
        id: true, startDate: true, endDate: true,
        unitPrice: true, quantity: true, monthlyEstimate: true,
        propertyFee: true, utilityFee: true
      }
    });
    leases.forEach((l, i) => {
      const sd = l.startDate.toISOString().slice(0,10);
      const ed = l.endDate.toISOString().slice(0,10);
      const rent_v1 = (l.monthlyEstimate || 0);
      const rent_v2 = (l.unitPrice || 0) * (l.quantity || 0);
      const rent_final = (l.unitPrice || l.monthlyEstimate || 0);
      console.log('  [' + (i+1) + '] 租期:' + sd + '~' + ed + ' | unitPrice=' + l.unitPrice + ' qty=' + l.quantity + ' monthlyEstimate=' + l.monthlyEstimate);
      console.log('      旧逻辑(monthlyEstimate): ' + rent_v1 + ' | 旧逻辑(unitPrice*qty): ' + rent_v2 + ' | 新逻辑(unitPrice): ' + rent_final);
      console.log('      水电=' + l.utilityFee + ' 物业=' + l.propertyFee + ' 月收入=' + (rent_final + (l.utilityFee||0) + (l.propertyFee||0)));
    });
    console.log('');
  }

  await prisma.$disconnect();
}

checkAll().catch(console.error);
