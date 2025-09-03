import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from '../types';

// Create a single pool instance with proper configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool configuration to prevent exhaustion
  max: 20, // Maximum number of connections in the pool
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool,
  }),
});

// Log connection events in development
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.log('New connection to database');
  });

  pool.on('remove', () => {
    console.log('Connection removed from pool');
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down database pool...');
  await pool.end();
  process.exit(0);
});

// Export pool for manual cleanup if needed
export { pool };