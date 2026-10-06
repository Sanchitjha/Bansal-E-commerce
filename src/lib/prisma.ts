import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  // Interactive transactions (checkout, cancellations) run several queries in a row; the 5s default is
  // too tight when the database is briefly slow, and a timeout would roll the whole order back.
  return new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 30_000 } });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
