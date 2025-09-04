import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from '../types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optimize pool settings
  max: 5, // Reduce max connections
  min: 1, // Maintain at least one connection
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Add connection lifecycle management
  maxUses: 7500, // Recycle connections after 7500 queries
});

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool,
  }),
  // Add query logging in development
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

// Log connection events in development
if (process.env.NODE_ENV === 'development') {
  let activeConnections = 0;
  
  pool.on('connect', () => {
    activeConnections++;
    console.log('New connection to database, total connections:', activeConnections);
  });

  pool.on('remove', () => {
    activeConnections--;
    console.log('Connection removed from pool, total connections:', activeConnections);
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