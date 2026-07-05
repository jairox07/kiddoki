// Gamification engine: gems/stars, missions, guide character progression.
// Hot state (session, streaks) in Redis; durable state in Postgres.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q, redis } from '../db/index.js';

const GEMS_PER_LEVEL = 100;
const LEVELS_PER_GUIDE_STAGE = 5;

export async function awardMission(childId: string, missionSlug: string) {
  const { rows: [mission] } = await q<{ id: string; gems_reward: number; stars_reward: number }>(
    'SELECT id, gems_reward, stars_reward FROM missions WHERE slug = $1', [missionSlug],
  );
  if (!mission) throw Object.assign(new Error('mission_not_found'), { statusCode: 404 });

  await q('INSERT INTO mission_completions (child_id, mission_id, gems_earned) VALUES ($1, $2, $3)',
    [childId, mission.id, mission.gems_reward]);

  const { rows: [progress] } = await q<{ gems: number; stars: number; level: number; guide_stage: number }>(
    `UPDATE child_progress
     SET gems = gems + $2,
         stars = stars + $3,
         level = 1 + (gems + $2) / ${GEMS_PER_LEVEL},
         guide_stage = 1 + ((1 + (gems + $2) / ${GEMS_PER_LEVEL}) - 1) / ${LEVELS_PER_GUIDE_STAGE}
     WHERE child_id = $1
     RETURNING gems, stars, level, guide_stage`,
    [childId, mission.gems_reward, mission.stars_reward],
  );

  // Feed Fantasy leagues: mission gems count as league points this season.
  await q(
    `UPDATE league_scores SET points = points + $2, updated_at = now() WHERE child_id = $1`,
    [childId, mission.gems_reward],
  );

  // Daily streak in Redis (TTL 48h, reset if gap).
  const streakKey = `streak:${childId}`;
  const today = new Date().toISOString().slice(0, 10);
  const last = await redis.hget(streakKey, 'lastDay');
  if (last !== today) {
    await redis.hset(streakKey, 'lastDay', today);
    await redis.hincrby(streakKey, 'count', 1);
    await redis.expire(streakKey, 60 * 60 * 48);
  }

  return progress;
}

export default async function gamificationRoutes(app: FastifyInstance) {
  app.get('/missions', { preHandler: [app.requireParent] }, async (req) => {
    const { ageBand } = z.object({ ageBand: z.enum(['early', 'middle', 'upper']) }).parse(req.query);
    const { rows } = await q('SELECT * FROM missions WHERE age_band = $1', [ageBand]);
    return rows;
  });

  app.post('/children/:childId/missions/:slug/complete',
    { preHandler: [app.requireParent, app.requireCoppaConsent, app.requireChildOwnership] },
    async (req) => {
      const { childId, slug } = req.params as { childId: string; slug: string };
      const progress = await awardMission(childId, slug);
      const streak = await redis.hget(`streak:${childId}`, 'count');
      return { ...progress, streak: Number(streak ?? 1) };
    });

  app.get('/children/:childId/progress',
    { preHandler: [app.requireParent, app.requireChildOwnership] },
    async (req) => {
      const { childId } = req.params as { childId: string };
      const { rows: [progress] } = await q('SELECT * FROM child_progress WHERE child_id = $1', [childId]);
      const streak = await redis.hget(`streak:${childId}`, 'count');
      return { ...progress, streak: Number(streak ?? 0) };
    });
}
