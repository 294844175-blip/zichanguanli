import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始迁移面积数据...');
  
  // 获取所有资产
  const assets = await prisma.asset.findMany();
  
  for (const asset of assets) {
    // @ts-ignore - 兼容旧数据结构
    const currentArea = (asset as any).area || 0;
    
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        graphicArea: currentArea,
        assetArea: currentArea,
      },
    });
    
    console.log(`✅ 迁移资产 ${asset.name}: area=${currentArea} -> graphicArea=${currentArea}, assetArea=${currentArea}`);
  }
  
  console.log('\n🎉 所有数据迁移完成！');
}

main()
  .catch((e) => {
    console.error('❌ 迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
