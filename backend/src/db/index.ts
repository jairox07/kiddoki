import pg from 'pg';
import { Redis } from 'ioredis';
import { config } from '../config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });
export const redis = new Redis(config.redisUrl);

export const q = <T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]) =>
  pool.query<T>(text, params);
