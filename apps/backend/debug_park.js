const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEastChina() {
  const parks = await prisma.park.findMany();
  console.log("所有园区:");
  parks.forEach(p => console.log("  ID: " + p.id + ", 名称: " + p.name));
  console.log("");

  const park = parks.find(p => p.name && p.name.indexOf("华东") >= 0);
  if (!park) {
    console.log("未找到包含'华东'的园区");
    await prisma.$disconnect();
    return;
  }

  console.log("园区: " + park.name + " (ID: " + park.id + ")");
  console.log("");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const leases = await prisma.lease.findMany({
    where: {
      parkId: park.id,
      status: "ACTIVE",
      startDate: { lte: monthEnd.toISOString() },
      endDate: { gte: monthStart.toISOString() }
    },
    include: { asset: true, customer: true }
  });

  console.log("当前月有效订单数: " + leases.length);
  console.log("");

  let total = 0;
  leases.forEach((l, idx) => {
    const rent = l.monthlyEstimate || (l.unitPrice || 0) * (l.quantity || 0);
    const utility = l.utilityFee || 0;
    const property = l.propertyFee || 0;
    const sum = rent + utility + property;
    total += sum;
    console.log("[" + (idx+1) + "] 资产: " + (l.asset?.name || "未知"));
    console.log("     客户: " + (l.customer?.name || "未知"));
    console.log("     租期: " + l.startDate?.toISOString().slice(0,10) + " ~ " + l.endDate?.toISOString().slice(0,10));
    console.log("     unitPrice: " + l.unitPrice + ", quantity: " + l.quantity + ", monthlyEstimate: " + l.monthlyEstimate);
    console.log("     租金: " + rent + ", 水电费: " + utility + ", 物业费: " + property + ", 合计: " + sum);
    console.log("");
  });

  console.log("本月收入总计: " + total.toLocaleString());
  await prisma.$disconnect();
}

checkEastChina().catch(console.error);
