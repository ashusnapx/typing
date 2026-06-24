import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  // Config loader needs a fallback or warning
  console.warn('Warning: DATABASE_URL not set in environment during Drizzle config parsing.');
}

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './src/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
