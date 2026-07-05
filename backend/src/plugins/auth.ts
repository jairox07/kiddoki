// Auth plugin: JWT + COPPA guards.
// - requireParent: valid parent JWT
// - requireCoppaConsent: parent gave verifiable consent before any child data flows
// - requireChildOwnership: parent can only touch their own children's data
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { q } from '../db/index.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { parentId: string; coppaConsent: boolean };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    requireParent: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireCoppaConsent: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireChildOwnership: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(jwt, { secret: config.jwtSecret });

  app.decorate('requireParent', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'unauthorized' });
    }
  });

  app.decorate('requireCoppaConsent', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user?.coppaConsent) {
      reply.code(403).send({ error: 'coppa_consent_required', message: 'Verifiable parental consent required before accessing child features.' });
    }
  });

  app.decorate('requireChildOwnership', async (req: FastifyRequest, reply: FastifyReply) => {
    const childId = (req.params as Record<string, string>).childId ?? (req.body as Record<string, string> | null)?.childId;
    if (!childId) return;
    const { rowCount } = await q('SELECT 1 FROM children WHERE id = $1 AND parent_id = $2', [childId, req.user.parentId]);
    if (!rowCount) reply.code(403).send({ error: 'not_your_child' });
  });
});
