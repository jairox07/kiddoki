export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://kiddoki:kiddoki_dev@localhost:5432/kiddoki',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret',
  piiKey: process.env.PII_ENCRYPTION_KEY ?? '00'.repeat(32),
};
