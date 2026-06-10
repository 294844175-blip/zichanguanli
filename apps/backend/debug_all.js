const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllLeases() {
  const leases = await prisma.lease.findMany({
    where: { status: "ACTIVE" },
    include: { asset: true, customer: true, park: true }
  });

  console.log("=== 所有 ACTIVE 状态订单 (按园区分组) ===\n");

  const parkGroups = {};
  leases.forEach(l => {
    const parkName = l.park?.name || "未知园区";
    if (!parkGroups[parkName]) parkGroups[parkName] = [];
    parkGroups[parkName].push(l);
  });

  for (const parkName in parkGroups) {
    console.log("【" + parkName + "】");
    let parkTotal = 0;
    parkGroups[parkName].forEach((l, idx) => {
      const rent = l.monthlyEstimate || (l.unitPrice || 0) * (l.quantity || 0);
      const utility = l.utilityFee || 0;
      const property = l.propertyFee || 0;
      const sum = rent + utility + property;
      parkTotal += sum;
      console.log("  [" + (idx+1) + "] 资产: " + (l.asset?.name || "未知"));
      console.log("       客户: " + (l.customer?.name || "未知"));
      console.log("       租期: " + l.startDate?.toISOString().slice(0,10) + " ~ " + l.endDate?.toISOString().slice(0,10));
      console.log("       unitPrice: " + l.unitPrice + "  quantity: " + l.quantity + "  monthlyEstimate: " + l.monthlyEstimate);
      console.log("       计算: 租金=" + rent + " + 水电费=" + utility + " + 物业费=" + property + " = " + sum);
    });
    console.log("       园区小计: " + parkTotal.toLocaleString() + "\n");
  }

  await prisma.$disconnect();
}

checkAllLeases().catch(console.error);
