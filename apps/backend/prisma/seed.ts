import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  // 创建一个默认组织
  const org = await prisma.organization.upsert({
    where: { code: 'ROOT_ORG' },
    update: {},
    create: {
      code: 'ROOT_ORG',
      name: '园区资产管理集团',
    },
  });

  // 创建三个园区
  const parks = [
    {
      code: 'HD_OPERATIONS',
      name: '华东运营中心',
      totalArea: 62000,
      buildingArea: 32000,
      rentableArea: 11000,
      status: 'ACTIVE',
    },
    {
      code: 'DN_OPERATIONS',
      name: '东南运营中心',
      totalArea: 48500,
      buildingArea: 25000,
      rentableArea: 8500,
      status: 'ACTIVE',
    },
    {
      code: 'DB_OPERATIONS',
      name: '东北运营中心',
      totalArea: 53010,
      buildingArea: 27770.94,
      rentableArea: 9000,
      status: 'ACTIVE',
    },
  ];

  const createdParks = [];
  for (const parkData of parks) {
    const park = await prisma.park.upsert({
      where: { code: parkData.code },
      update: parkData,
      create: {
        ...parkData,
        orgId: org.id,
      },
    });
    createdParks.push(park);
  }

  // 为每个园区创建楼宇和楼层
  for (const park of createdParks) {
    // 创建3个楼宇
    const buildings = [];
    for (let i = 1; i <= 3; i++) {
      const building = await prisma.building.upsert({
        where: { id: `${park.code}-building-${i}` },
        update: {},
        create: {
          id: `${park.code}-building-${i}`,
          name: `${i}栋`,
          parkId: park.id,
        },
      });
      buildings.push(building);

      // 为每个楼宇创建3个楼层
      const floors = ['1F', '2F', '3F'];
      for (let j = 0; j < floors.length; j++) {
        await prisma.floor.upsert({
          where: { id: `${building.id}-floor-${j + 1}` },
          update: {},
          create: {
            id: `${building.id}-floor-${j + 1}`,
            name: floors[j],
            buildingId: building.id,
          },
        });
      }
    }
  }

  console.log('数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
