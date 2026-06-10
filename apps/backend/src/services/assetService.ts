import prisma from '../config/database';
import { calculateAssetScore } from '../utils/scoreCalculator';

export async function updateAssetScore(assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { leases: true, costs: true },
  });
  
  if (!asset) return;
  
  const totalCost = asset.costs.reduce((sum, c) => sum + c.amount, 0);
  
  const activeLease = asset.leases.find(l => l.status === 'ACTIVE') || asset.leases[asset.leases.length - 1];
  
  const score = calculateAssetScore({
    status: asset.status,
    unitPrice: asset.unitPrice,
    area: asset.area,
    monthlyEstimate: activeLease?.monthlyEstimate || 0,
    leaseEndDate: activeLease?.endDate || new Date(),
    totalCost,
  });
  
  await prisma.asset.update({
    where: { id: assetId },
    data: { score },
  });
  
  return score;
}
