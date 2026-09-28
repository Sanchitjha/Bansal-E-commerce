import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js apps keep secrets in .env.local; the Prisma CLI only auto-loads .env.
// Load .env.local explicitly, and override so a stale/placeholder .env can't win.
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
