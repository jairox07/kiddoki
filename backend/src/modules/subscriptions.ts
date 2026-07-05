// Simulated Stripe integration. Same shape as real Stripe flow —
// swap SimulatedStripe for the stripe SDK when going live.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { q } from '../db/index.js';

export const TIERS = {
  semilla: { priceId: 'price_semilla', monthlyUsd: 4.99, maxChildren: 1, features: ['juegos_basicos', 'reportes_semanales'] },
  brote:   { priceId: 'price_brote',   monthlyUsd: 9.99, maxChildren: 3, features: ['juegos_basicos', 'juegos_premium', 'reportes_semanales', 'fantasy_play'] },
  bosque:  { priceId: 'price_bosque',  monthlyUsd: 14.99, maxChildren: 6, features: ['todo', 'fantasy_play', 'contenido_offline', 'soporte_prioritario'] },
} as const;

// ponytail: in-memory Stripe simulator; replace with `stripe` SDK + real webhooks for prod
const SimulatedStripe = {
  async createCheckoutSession(parentId: string, tier: keyof typeof TIERS) {
    return { id: `cs_sim_${randomUUID()}`, url: `/checkout/simulated?tier=${tier}&parent=${parentId}` };
  },
  async completeCheckout(parentId: string, tier: keyof typeof TIERS) {
    return { customerId: `cus_sim_${parentId.slice(0, 8)}`, subId: `sub_sim_${randomUUID()}` };
  },
};

export default async function subscriptionRoutes(app: FastifyInstance) {
  app.get('/subscriptions/tiers', async () => TIERS);

  app.get('/subscriptions/me', { preHandler: [app.requireParent] }, async (req) => {
    const { rows: [sub] } = await q('SELECT tier, status, current_period_end FROM subscriptions WHERE parent_id = $1', [req.user.parentId]);
    return { ...sub, details: TIERS[sub.tier as keyof typeof TIERS] };
  });

  app.post('/subscriptions/checkout', { preHandler: [app.requireParent] }, async (req) => {
    const { tier } = z.object({ tier: z.enum(['semilla', 'brote', 'bosque']) }).parse(req.body);
    return SimulatedStripe.createCheckoutSession(req.user.parentId, tier);
  });

  // Simulated webhook: in prod this is POST /webhooks/stripe with signature verification.
  app.post('/subscriptions/simulate-payment', { preHandler: [app.requireParent] }, async (req) => {
    const { tier } = z.object({ tier: z.enum(['semilla', 'brote', 'bosque']) }).parse(req.body);
    const { customerId, subId } = await SimulatedStripe.completeCheckout(req.user.parentId, tier);
    await q(
      `UPDATE subscriptions SET tier = $2, status = 'active', stripe_customer_id = $3, stripe_sub_id = $4,
       current_period_end = now() + INTERVAL '30 days' WHERE parent_id = $1`,
      [req.user.parentId, tier, customerId, subId],
    );
    await q(`INSERT INTO payment_events (parent_id, type, payload) VALUES ($1, 'invoice.paid', $2)`,
      [req.user.parentId, JSON.stringify({ tier, amount: TIERS[tier].monthlyUsd })]);
    return { ok: true, tier, status: 'active' };
  });

  app.post('/subscriptions/cancel', { preHandler: [app.requireParent] }, async (req) => {
    await q(`UPDATE subscriptions SET status = 'canceled' WHERE parent_id = $1`, [req.user.parentId]);
    return { ok: true };
  });
}
