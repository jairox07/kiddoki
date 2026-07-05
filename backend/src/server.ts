import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import authPlugin from './plugins/auth.js';
import authRoutes from './modules/auth.js';
import gamificationRoutes from './modules/gamification.js';
import parentalRoutes from './modules/parental.js';
import subscriptionRoutes from './modules/subscriptions.js';
import leagueRoutes from './modules/leagues.js';
import emailRoutes from './modules/emails.js';
import { config } from './config.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(authPlugin);
await app.register(authRoutes);
await app.register(gamificationRoutes);
await app.register(parentalRoutes);
await app.register(subscriptionRoutes);
await app.register(leagueRoutes);
await app.register(emailRoutes);

app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
  if (err instanceof ZodError) return reply.code(400).send({ error: 'validation', issues: err.issues });
  app.log.error(err);
  reply.code(err.statusCode ?? 500).send({ error: err.message });
});

app.get('/health', async () => ({ ok: true }));

await app.listen({ port: config.port, host: '0.0.0.0' });
