import { PostgresStore, PgVector } from '@mastra/pg';

export const pStore = new PostgresStore({
  connectionString: process.env.DATABASE_URL,
  max: 3,                    // Limit pool size to prevent connection exhaustion
  idleTimeoutMillis: 30000,  // 30s idle timeout to release unused connections
});
