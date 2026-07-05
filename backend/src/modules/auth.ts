// Parent registration + login + anonymous child profile creation.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q } from '../db/index.js';
import { encryptPII, hashPassword, verifyPassword } from '../lib/crypto.js';
import { generateAlias, generateAvatarSeed } from '../lib/anonymizer.js';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  coppaConsent: z.literal(true, { errorMap: () => ({ message: 'COPPA consent is mandatory' }) }),
});

const childSchema = z.object({
  ageBand: z.enum(['early', 'middle', 'upper']),
  guideCharacter: z.enum(['koki', 'luna', 'max']).default('koki'),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const existing = await q('SELECT 1 FROM parents WHERE email = $1', [body.email]);
    if (existing.rowCount) return reply.code(409).send({ error: 'email_taken' });

    const { rows } = await q<{ id: string }>(
      `INSERT INTO parents (email, email_enc, name_enc, password_hash, consent_coppa, consent_at)
       VALUES ($1, $2, $3, $4, TRUE, now()) RETURNING id`,
      [body.email, encryptPII(body.email), encryptPII(body.name), hashPassword(body.password)],
    );
    await q(`INSERT INTO subscriptions (parent_id, tier, status) VALUES ($1, 'semilla', 'trialing')`, [rows[0].id]);

    const token = app.jwt.sign({ parentId: rows[0].id, coppaConsent: true }, { expiresIn: '7d' });
    return { token };
  });

  app.post('/auth/login', async (req, reply) => {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const { rows } = await q<{ id: string; password_hash: string; consent_coppa: boolean }>(
      'SELECT id, password_hash, consent_coppa FROM parents WHERE email = $1', [email],
    );
    if (!rows[0] || !verifyPassword(password, rows[0].password_hash)) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }
    return { token: app.jwt.sign({ parentId: rows[0].id, coppaConsent: rows[0].consent_coppa }, { expiresIn: '7d' }) };
  });

  // Child profile: parent provides ONLY age band. Alias + avatar generated server-side.
  app.post('/children', { preHandler: [app.requireParent, app.requireCoppaConsent] }, async (req) => {
    const body = childSchema.parse(req.body);
    const { rows } = await q(
      `INSERT INTO children (parent_id, alias, avatar_seed, age_band, guide_character)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, alias, avatar_seed, age_band, guide_character`,
      [req.user.parentId, generateAlias(), generateAvatarSeed(), body.ageBand, body.guideCharacter],
    );
    await q('INSERT INTO child_progress (child_id) VALUES ($1)', [rows[0].id]);
    await q('INSERT INTO time_limits (child_id) VALUES ($1)', [rows[0].id]);
    return rows[0];
  });

  app.get('/children', { preHandler: [app.requireParent] }, async (req) => {
    const { rows } = await q(
      `SELECT c.id, c.alias, c.avatar_seed, c.age_band, c.guide_character, p.gems, p.stars, p.level, p.guide_stage
       FROM children c JOIN child_progress p ON p.child_id = c.id WHERE c.parent_id = $1`,
      [req.user.parentId],
    );
    return rows;
  });
}
