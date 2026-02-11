import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const adminPassword = await hash('admin123', 10);
  const staffPassword = await hash('staff123', 10);
  const userPassword = await hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@company.com' },
    update: {},
    create: {
      email: 'staff@company.com',
      password: staffPassword,
      name: 'Staff Member',
      role: 'STAFF',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@company.com' },
    update: {},
    create: {
      email: 'user@company.com',
      password: userPassword,
      name: 'Regular User',
      role: 'USER',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'ai_enabled' },
    update: { value: 'true' },
    create: {
      key: 'ai_enabled',
      value: 'true',
    },
  });

  console.log('Seeding finished.');
  console.log({ admin, staff, user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });