const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function raw() {
  const leases = await prisma.lease.findMany({
    where: { status: 'ACTIVE' },
    include: { customer: true }
  });
  leases.forEach((l, i) => {
    console.log('[' + (i+1) + '] ' + (l.customer?.name || '?') +
      ' | unitPrice=' + l.unitPrice + ' | quantity=' + l.quantity + 
      ' | monthlyEstimate=' + l.monthlyEstimate +
      ' | propertyFee=' + l.propertyFee + ' | utilityFee=' + l.utilityFee +
      ' | parkId=' + l.parkId?.slice(0,8));
  });
  await prisma.$disconnect();
}

raw().catch(console.error);
