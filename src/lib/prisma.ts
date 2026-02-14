import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const url = process.env.DATABASE_URL;
if (process.env.NODE_ENV !== 'production') {
    console.log('----------------------------------------------------');
    console.log('Prisma Client Initializing...');
    console.log('DATABASE_URL:', url ? url.replace(/:[^:@]+@/, ':****@') : 'UNDEFINED');
    console.log('----------------------------------------------------');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
