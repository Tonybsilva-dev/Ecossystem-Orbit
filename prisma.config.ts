import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

/**
 * Prisma Configuration
 * 
 * In Prisma 7+, the datasource URL is configured here instead of schema.prisma.
 * For Prisma 6.19.0, we keep the URL in schema.prisma for compatibility,
 * but this file prepares for future migration to Prisma 7.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

