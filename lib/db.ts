import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

declare global {
  var __prisma: PrismaClient | undefined;
}

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaLibSql({ url });

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
