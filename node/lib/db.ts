import { PrismaClient } from '@prisma/client';

// Một kết nối dùng chung (tránh mở quá nhiều kết nối khi chạy "npm run dev").
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = db;
