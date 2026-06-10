const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const eastPark = await prisma.park.findFirst({ where: { name: { contains: '华东' } } });
  if (!eastPark) { console.log('未找到华东运营中心'); return; }

  console.log('园区:', eastPark.name, '(id:', eastPark.id, ')');
  console.log('\n=== 所有资产（后端 DB 原始数据）===');

  const assets = await prisma.asset.findMany({
    where: { parkId: eastPark.id },
    select: {
      id: true, name: true, type: true,
      assetArea: true, rentableArea: true,
      graphicArea: true, buildingArea: true, projectionArea: true,
    },
  });

  assets.forEach((a, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${a.name}`);
    console.log(`    type: ${a.type} | assetArea: ${a.assetArea} | rentableArea: ${a.rentableArea}`);
    console.log(`    graphicArea: ${a.graphicArea} | buildingArea: ${a.buildingArea} | projectionArea: ${a.projectionArea}`);
  });

  console.log('\n=== 按类型汇总 rentableArea ===');
  const typeMap = { '冻库': 0, '冷藏库': 0, '常温库': 0, '办公': 0, '配套': 0 };
  assets.forEach(a => {
    const type = a.type || '配套';
    const area = a.rentableArea || a.assetArea || 0;
    if (type in typeMap) typeMap[type] += area;
    else typeMap['配套'] += area;
  });

  let total = 0;
  Object.entries(typeMap).forEach(([name, value]) => {
    console.log(`  ${name}: ${Math.round(value)} ㎡`);
    total += value;
  });
  console.log(`  总计: ${Math.round(total)} ㎡`);

  console.log('\n=== 按类型汇总 assetArea ===');
  const typeMap2 = { '冻库': 0, '冷藏库': 0, '常温库': 0, '办公': 0, '配套': 0 };
  assets.forEach(a => {
    const type = a.type || '配套';
    const area = a.assetArea || 0;
    if (type in typeMap2) typeMap2[type] += area;
    else typeMap2['配套'] += area;
  });

  let total2 = 0;
  Object.entries(typeMap2).forEach(([name, value]) => {
    console.log(`  ${name}: ${Math.round(value)} ㎡`);
    total2 += value;
  });
  console.log(`  总计: ${Math.round(total2)} ㎡`);

  console.log('\n=== 按类型汇总 graphicArea ===');
  const typeMap3 = { '冻库': 0, '冷藏库': 0, '常温库': 0, '办公': 0, '配套': 0 };
  assets.forEach(a => {
    const type = a.type || '配套';
    const area = a.graphicArea || 0;
    if (type in typeMap3) typeMap3[type] += area;
    else typeMap3['配套'] += area;
  });

  let total3 = 0;
  Object.entries(typeMap3).forEach(([name, value]) => {
    console.log(`  ${name}: ${Math.round(value)} ㎡`);
    total3 += value;
  });
  console.log(`  总计: ${Math.round(total3)} ㎡`);
}

main().finally(() => prisma.$disconnect());
