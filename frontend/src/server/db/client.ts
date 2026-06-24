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

export function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: getConnectionString(),
      max: 20,
      idleTimeoutMillis: 30000,
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
