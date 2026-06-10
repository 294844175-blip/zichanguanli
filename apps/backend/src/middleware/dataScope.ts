import { AuthRequest } from './auth';
import prisma from '../config/database';

export async function applyDataScope(user: AuthRequest['user'], query: any) {
  if (!user) return query;
  
  const role = await prisma.role.findUnique({
    where: { id: user.roleId },
  });
  
  if (!role) return query;
  
  const dataScope = role.dataScope as string;
  
  switch (dataScope) {
    case 'ALL':
      return query;
    case 'ORG':
      if (user.orgId) {
        return query.where({ park: { orgId: user.orgId } });
      }
      return query.where({ id: null });
    case 'PARK':
      const parkAccesses = await prisma.parkAccess.findMany({
        where: { userId: user.id },
        select: { parkId: true },
      });
      const parkIds = parkAccesses.map(pa => pa.parkId);
      return query.where({ parkId: { in: parkIds } });
    case 'CUSTOM':
      const customParks = await prisma.parkAccess.findMany({
        where: { userId: user.id },
        select: { parkId: true },
      });
      const customParkIds = customParks.map(cp => cp.parkId);
      return query.where({ parkId: { in: customParkIds } });
    default:
      return query.where({ id: null });
  }
}
