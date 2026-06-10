import prisma from '../config/database';
import { isExpiringSoon, isOverdue } from '../utils/dateUtils';

export async function checkLeaseStatus() {
  const leases = await prisma.lease.findMany({
    where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
  });
  
  const updates = [];
  
  for (const lease of leases) {
    let newStatus = lease.status;
    let newRiskLevel = lease.riskLevel;
    
    if (isOverdue(lease.endDate)) {
      newStatus = 'EXPIRED';
      newRiskLevel = 'HIGH';
    } else if (isExpiringSoon(lease.endDate, 3)) {
      newStatus = 'EXPIRING';
      newRiskLevel = 'HIGH';
    }
    
    if (newStatus !== lease.status || newRiskLevel !== lease.riskLevel) {
      updates.push(
        prisma.lease.update({
          where: { id: lease.id },
          data: { status: newStatus, riskLevel: newRiskLevel },
        })
      );
    }
  }
  
  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
  
  return updates.length;
}

export async function getExpiringLeases(months: number = 3) {
  const now = new Date();
  const threshold = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
  
  return prisma.lease.findMany({
    where: {
      endDate: { gte: now, lte: threshold },
      status: 'ACTIVE',
    },
    include: { asset: true, customer: true },
  });
}

export async function getOverdueLeases() {
  return prisma.lease.findMany({
    where: {
      endDate: { lt: new Date() },
      status: { not: 'EXPIRED' },
    },
    include: { asset: true, customer: true },
  });
}
