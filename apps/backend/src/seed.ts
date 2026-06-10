import bcrypt from 'bcryptjs';
import prisma from './config/database';

async function seed() {
  console.log('Seeding database...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: '系统管理员',
      code: 'ADMIN',
      description: '拥有所有权限',
      permissions: '*',
      dataScope: 'ALL',
    },
  });

  const operatorRole = await prisma.role.upsert({
    where: { code: 'OPERATOR' },
    update: {},
    create: {
      name: '运营人员',
      code: 'OPERATOR',
      description: '园区运营权限',
      permissions: '["asset:view","asset:edit","customer:view","customer:edit","lease:view","lease:edit"]',
      dataScope: 'ORG',
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { code: 'VIEWER' },
    update: {},
    create: {
      name: '只读用户',
      code: 'VIEWER',
      description: '仅查看权限',
      permissions: '["asset:view","customer:view","lease:view"]',
      dataScope: 'ORG',
    },
  });

  console.log('Roles created:', adminRole.name, operatorRole.name, viewerRole.name);

  // Create default organization
  const defaultOrg = await prisma.organization.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: '总部',
      code: 'HQ',
    },
  });

  console.log('Organization created:', defaultOrg.name);

  // Create admin user (always reset password)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: bcrypt.hashSync('admin123', 10),
      realName: '管理员',
      roleId: adminRole.id,
      orgId: defaultOrg.id,
      status: 'ACTIVE',
    },
    create: {
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      realName: '管理员',
      roleId: adminRole.id,
      orgId: defaultOrg.id,
      status: 'ACTIVE',
    },
  });

  console.log('Admin user created:', adminUser.username, '(password: admin123)');
  console.log('Seed completed!');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
