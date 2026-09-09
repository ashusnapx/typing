import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

let dbInstance: NodePgDatabase<typeof schema> | undefined;
let poolInstance: Pool | undefined;

function getConnectionString(): string {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error('CRITICAL FATAL: DATABASE_URL environment variable is missing.');
  }
  return rawUrl.startsWith('postgresql+asyncpg://')
    ? rawUrl.replace('postgresql+asyncpg://', 'postgresql://')
    : rawUrl;
}

/* Connections per function instance, not per site.
 *
 * This defaulted to 50, against a Supabase pooler that accepts 200 clients in
 * total — so four warm instances could exhaust it and the fifth would start
 * failing everything, at exactly the moment traffic was high enough to have
 * spawned five. Vercel runs as many instances as concurrency demands, so the
 * only safe number here is a small one: each instance needs a couple of
 * connections at a time, and the pooler multiplexes the rest.
 *
 * Five per instance leaves room for forty concurrent instances, which is far
 * more than the request rate this app generates — nearly every page is static
 * and a whole ten-minute test touches the server exactly twice. */
const POOL_MAX = parseInt(process.env.DATABASE_POOL_MAX || '5', 10);

export function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: getConnectionString(),
      max: POOL_MAX,
      // Idle connections are released quickly so a burst does not leave every
      // instance holding the pooler's slots long after the burst has passed.
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return poolInstance;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

export const pool = new Proxy({} as Pool, {
  get(_, prop) {
    return Reflect.get(getPool(), prop, getPool());
  },
  set(_, prop, value) {
    Reflect.set(getPool(), prop, value);
    return true;
  },
});

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    return Reflect.get(getDb(), prop, getDb());
  },
  set(_, prop, value) {
    Reflect.set(getDb(), prop, value);
    return true;
  },
});

export default db;
