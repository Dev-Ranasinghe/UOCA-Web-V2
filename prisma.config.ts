import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7's CLI no longer auto-loads .env files, and Next.js's own env
// loading only applies inside `next dev`/`next build` — not to the
// standalone `prisma` CLI process. Load .env.local explicitly so
// `prisma migrate`/`generate` see the same values the app does.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI operations (migrate/introspect) need the *direct* connection —
    // Supabase's pooled/pgbouncer URL doesn't support the prepared
    // statements Prisma Migrate relies on. The app itself connects via the
    // pooled URL through a driver adapter instead — see lib/prisma.ts.
    url: process.env.DIRECT_URL,
  },
});
