import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('CRITICAL FATAL: DATABASE_URL environment variable is missing.');
}

const rawUrl = process.env.DATABASE_URL;
const connectionString = rawUrl.startsWith('postgresql+asyncpg://')
  ? rawUrl.replace('postgresql+asyncpg://', 'postgresql://')
  : rawUrl;

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
export default db;
