import {
  Driver,
  DatabaseConnection,
  CompiledQuery,
  QueryResult,
} from 'kysely';
import { Pool, PoolClient } from 'pg';

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const RETRYABLE_ERRORS = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  '57014', // query_canceled
  '08006', // connection_failure
  '08001', // unable_to_establish_connection
  '57P01', // admin_shutdown
  '53300', // too_many_connections
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as NodeJS.ErrnoException).code || '';
  const str = `${error.message} ${code}`.toLowerCase();
  return RETRYABLE_ERRORS.some((e) => str.includes(e.toLowerCase()));
}

class RetryConnection implements DatabaseConnection {
  constructor(
    private client: PoolClient,
    private options: RetryOptions
  ) {}

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await this.client.query(compiledQuery.sql, [
          ...compiledQuery.parameters,
        ]);
        return {
          rows: result.rows as R[],
          numAffectedRows: BigInt(result.rowCount ?? 0),
        };
      } catch (error) {
        lastError = error;

        if (!isRetryable(error)) {
          throw error;
        }

        if (attempt < this.options.maxRetries) {
          const delayMs = Math.min(
            this.options.initialDelayMs * 2 ** attempt,
            this.options.maxDelayMs
          );
          console.warn(
            `[DB Retry] Attempt ${attempt + 1}/${this.options.maxRetries} in ${delayMs}ms:`,
            (error as Error).message
          );
          await delay(delayMs);
        }
      }
    }

    throw lastError;
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Streaming not supported');
  }

  release(): void {
    this.client.release();
  }
}

export class RetryDriver implements Driver {
  private pool: Pool;
  private options: RetryOptions;

  constructor(pool: Pool, options: Partial<RetryOptions> = {}) {
    this.pool = pool;
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialDelayMs: options.initialDelayMs ?? 100,
      maxDelayMs: options.maxDelayMs ?? 5000,
    };
  }

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.pool.connect();
    return new RetryConnection(client, this.options);
  }
  async beginTransaction(conn: DatabaseConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw('BEGIN'));
  }

  async commitTransaction(conn: DatabaseConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw('COMMIT'));
  }

  async rollbackTransaction(conn: DatabaseConnection): Promise<void> {
    await conn.executeQuery(CompiledQuery.raw('ROLLBACK'));
  }

  async releaseConnection(conn: DatabaseConnection): Promise<void> {
    (conn as RetryConnection).release();
  }

  async destroy(): Promise<void> {
    await this.pool.end();
  }
}