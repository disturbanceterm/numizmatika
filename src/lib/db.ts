/**
 * Prisma klijent (singleton) sa libsql adapterom (lokalni SQLite fajl).
 *
 * @changelog
 * 2026-09-21  Početna verzija (better-sqlite3).
 * 2026-09-21  Prelazak na @prisma/adapter-libsql: better-sqlite3 nema gotove binarne fajlove za
 *             novije Node verzije na Windowsu pa `npm install` traži Python + VS Build Tools;
 *             libsql isporučuje N-API binarne fajlove za win32/darwin/linux nezavisno od Node verzije.
 */
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const DEFAULT_DATABASE_URL = "file:./data/numizmatika.db";

function createClient() {
  const adapter = new PrismaLibSql({
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
