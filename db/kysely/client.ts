import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from '../types';

declare global {
  // eslint-disable-next-line no-var
  var __kysely_singleton: { pool: Pool; db: Kysely<DB> } | undefined;
}

class KyselySingleton {
  private constructor() {}

  static getInstance() {
    if (globalThis.__kysely_singleton) {
      return globalThis.__kysely_singleton;
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      min: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      maxUses: 7500,
    });

    const db = new Kysely<DB>({
      dialect: new PostgresDialect({ pool }),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    });

    // simple dev instrumentation
    if (process.env.NODE_ENV === 'development') {
      let active = 0;
      pool.on('connect', () => {
        active++;
        console.log('[db] connect, active:', active);
      });
      pool.on('remove', () => {
        active = Math.max(0, active - 1);
        console.log('[db] remove, active:', active);
      });
    }

    globalThis.__kysely_singleton = { pool, db };
    return globalThis.__kysely_singleton;
  }
}

const singleton = KyselySingleton.getInstance();
export const db = singleton.db;
export const pool = singleton.pool;