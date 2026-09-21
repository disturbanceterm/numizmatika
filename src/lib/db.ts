/**
 * Prisma klijent (singleton) sa better-sqlite3 adapterom.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const DEFAULT_DATABASE_URL = "file:./data/numizmatika.db";

function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

// REASON: Next.js u dev modu re-evaluira module pri hot reload-u; globalni keš sprječava
// otvaranje desetina SQLite konekcija na isti fajl.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
