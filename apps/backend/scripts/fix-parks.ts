import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('查询所有园区...');
  const parks = await prisma.park.findMany({
    include: {
      _count: {
        select: {
          assets: true,
          leases: true,
          revenueRecords: true
        }
      }
    }
  });

  console.log('园区列表:');
  parks.forEach(park => {
    console.log(`- ${park.name} (ID: ${park.id}, Code: ${park.code})`);
    console.log(`  资产: ${park._count.assets}, 租约: ${park._count.leases}, 收入记录: ${park._count.revenueRecords}`);
  });

  // 找到名称为"华东运营中心"的园区
  const eastChinaParks = parks.filter(p => p.name === '华东运营中心');
  
  if (eastChinaParks.length > 1) {
    console.log('\n找到多个华东运营中心，删除没有数据的...');
    
    // 找到没有数据的园区
    const parkToDelete = eastChinaParks.find(park => 
      park._count.assets === 0 && 
      park._count.leases === 0 && 
      park._count.revenueRecords === 0
    );
    
    if (parkToDelete) {
      console.log(`将删除园区: ${parkToDelete.name} (ID: ${parkToDelete.id})`);
      
      // 先删除关联的楼宇和楼层
      await prisma.floor.deleteMany({
        where: { building: { parkId: parkToDelete.id } }
      });
      await prisma.building.deleteMany({
        where: { parkId: parkToDelete.id }
      });
      
      // 再删除园区
      await prisma.park.delete({
        where: { id: parkToDelete.id }
      });
      console.log('删除成功！');
    } else {
      console.log('所有园区都有数据，请手动选择要删除的');
    }
  } else {
    console.log('\n只有一个华东运营中心，无需删除');
  }
}

main()
  .catch((e) => {
    console.error('错误:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
