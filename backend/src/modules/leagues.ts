// Fantasy Play — parent-only leagues. Children appear ONLY as anonymous
// alias + avatar; leaderboards expose points and percentiles, never PII.
// Gated to 'brote' and 'bosque' tiers.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { q } from '../db/index.js';
import { generateInviteCode } from '../lib/anonymizer.js';

async function requireFantasyTier(req: FastifyRequest, reply: FastifyReply) {
  const { rows: [sub] } = await q<{ tier: string; status: string }>(
    'SELECT tier, status FROM subscriptions WHERE parent_id = $1', [req.user.parentId],
  );
  if (!sub || sub.status !== 'active' && sub.status !== 'trialing' || sub.tier === 'semilla') {
    reply.code(402).send({ error: 'upgrade_required', message: 'Fantasy Play requiere plan Brote o Bosque.' });
  }
}

export default async function leagueRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireParent, app.requireCoppaConsent, requireFantasyTier] };

  app.post('/leagues', guard, async (req) => {
    const { name } = z.object({ name: z.string().min(3).max(50) }).parse(req.body);
    const { rows: [league] } = await q(
      `INSERT INTO leagues (name, owner_id, invite_code) VALUES ($1, $2, $3)
       RETURNING id, name, invite_code, season_end`,
      [name, req.user.parentId, generateInviteCode()],
    );
    return league;
  });

  // Join via secure invite code — parent enrolls one of THEIR children.
  app.post('/leagues/join', guard, async (req, reply) => {
    const { inviteCode, childId } = z.object({ inviteCode: z.string().length(8), childId: z.string().uuid() }).parse(req.body);
    const { rows: [league] } = await q<{ id: string }>('SELECT id FROM leagues WHERE invite_code = $1 AND season_end > now()', [inviteCode.toUpperCase()]);
    if (!league) return reply.code(404).send({ error: 'invalid_or_expired_code' });
    const owned = await q('SELECT 1 FROM children WHERE id = $1 AND parent_id = $2', [childId, req.user.parentId]);
    if (!owned.rowCount) return reply.code(403).send({ error: 'not_your_child' });

    await q(`INSERT INTO league_members (league_id, child_id, parent_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [league.id, childId, req.user.parentId]);
    await q(`INSERT INTO league_scores (league_id, child_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [league.id, childId]);
    return { ok: true, leagueId: league.id };
  });

  app.get('/leagues/mine', { preHandler: [app.requireParent] }, async (req) => {
    const { rows } = await q(
      `SELECT DISTINCT l.id, l.name, l.invite_code, l.season_end, l.owner_id = $1 AS is_owner,
              (SELECT COUNT(*)::int FROM league_members m WHERE m.league_id = l.id) AS member_count
       FROM leagues l
       LEFT JOIN league_members lm ON lm.league_id = l.id
       WHERE l.owner_id = $1 OR lm.parent_id = $1`,
      [req.user.parentId],
    );
    return rows;
  });

  // Leaderboard: anonymous aliases, points, percentile rank. No parent/child PII.
  app.get('/leagues/:leagueId/leaderboard', { preHandler: [app.requireParent] }, async (req, reply) => {
    const { leagueId } = req.params as { leagueId: string };
    const member = await q('SELECT 1 FROM leagues l LEFT JOIN league_members m ON m.league_id = l.id WHERE l.id = $1 AND (l.owner_id = $2 OR m.parent_id = $2)',
      [leagueId, req.user.parentId]);
    if (!member.rowCount) return reply.code(403).send({ error: 'not_league_member' });

    const { rows } = await q(
      `SELECT c.alias, c.avatar_seed, s.points,
              RANK() OVER (ORDER BY s.points DESC)::int AS rank,
              ROUND(PERCENT_RANK() OVER (ORDER BY s.points) * 100)::int AS percentile,
              c.parent_id = $2 AS is_mine
       FROM league_scores s JOIN children c ON c.id = s.child_id
       WHERE s.league_id = $1 ORDER BY s.points DESC`,
      [leagueId, req.user.parentId],
    );

    // Collective milestones: celebrate the league as a group.
    const { rows: [totals] } = await q<{ total_points: string; total_missions: string }>(
      `SELECT COALESCE(SUM(s.points), 0) AS total_points,
              (SELECT COUNT(*) FROM mission_completions mc
               WHERE mc.child_id IN (SELECT child_id FROM league_members WHERE league_id = $1)) AS total_missions
       FROM league_scores s WHERE s.league_id = $1`, [leagueId],
    );
    const totalPoints = Number(totals.total_points);
    const milestones = [500, 1000, 5000, 10000].filter((m) => totalPoints >= m)
      .map((m) => ({ threshold: m, label: `¡La liga alcanzó ${m} gemas juntas! 🎉` }));

    return { leaderboard: rows, collective: { totalPoints, totalMissions: Number(totals.total_missions), milestones } };
  });

  // Rotate invite code (owner only) — invalidates leaked codes.
  app.post('/leagues/:leagueId/rotate-code', guard, async (req, reply) => {
    const { leagueId } = req.params as { leagueId: string };
    const { rows: [league] } = await q(
      'UPDATE leagues SET invite_code = $2 WHERE id = $1 AND owner_id = $3 RETURNING invite_code',
      [leagueId, generateInviteCode(), req.user.parentId],
    );
    if (!league) return reply.code(403).send({ error: 'owner_only' });
    return league;
  });
}
