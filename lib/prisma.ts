import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 has no built-in query engine — the app connects via an explicit
// driver adapter, using the *pooled* connection string (pgbouncer), unlike
// prisma.config.ts's CLI-only direct connection used for migrations.
//
// node-pg closes idle pooled connections after 10s by default, and reopening one
// to the remote pooler (TCP + TLS + auth) costs several seconds on a high-latency
// link — so a visitor arriving after a short lull paid that on every page. Keep
// connections warm much longer (and TCP keepalive so the pooler doesn't drop them).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 5 * 60 * 1000,
  keepAlive: true,
});

// Reused across hot-reloads in dev so Server Component re-renders don't open
// a fresh connection pool each time (a common serverless/Next.js footgun).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
