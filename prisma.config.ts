/**
 * Prisma CLI konfiguracija (Prisma 7).
 *
 * @changelog
 * 2026-09-21  Početna verzija; DATABASE_URL sa podrazumijevanom vrijednošću data/numizmatika.db.
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

// REASON: Baza živi u data/ (uz uploads/) da se cijela kolekcija bekapuje kopiranjem jednog foldera.
export const DEFAULT_DATABASE_URL = "file:./data/numizmatika.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? DEFAULT_DATABASE_URL,
  },
});
