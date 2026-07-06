// Gamification engine: gems/stars, worlds (paths), playable missions, guide progression.
// Hot state (streaks) in Redis; durable state in Postgres.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q, redis } from '../db/index.js';

const GEMS_PER_LEVEL = 100;
const LEVELS_PER_GUIDE_STAGE = 5;

export async function awardMission(childId: string, missionSlug: string, accuracy: number) {
  const { rows: [mission] } = await q<{ id: string; gems_reward: number; stars_reward: number }>(
    'SELECT id, gems_reward, stars_reward FROM missions WHERE slug = $1', [missionSlug],
  );
  if (!mission) throw Object.assign(new Error('mission_not_found'), { statusCode: 404 });

  // Effort always pays (growth mindset): full gems from 70% accuracy, floor of half below.
  const gems = accuracy >= 70 ? mission.gems_reward : Math.max(1, Math.round(mission.gems_reward / 2));

  await q('INSERT INTO mission_completions (child_id, mission_id, gems_earned, accuracy) VALUES ($1, $2, $3, $4)',
    [childId, mission.id, gems, accuracy]);

  const { rows: [progress] } = await q<{ gems: number; stars: number; level: number; guide_stage: number }>(
    `UPDATE child_progress
     SET gems = gems + $2,
         stars = stars + $3,
         level = 1 + (gems + $2) / ${GEMS_PER_LEVEL},
         guide_stage = 1 + ((1 + (gems + $2) / ${GEMS_PER_LEVEL}) - 1) / ${LEVELS_PER_GUIDE_STAGE}
     WHERE child_id = $1
     RETURNING gems, stars, level, guide_stage`,
    [childId, gems, mission.stars_reward],
  );

  // Feed Fantasy leagues: mission gems count as league points this season.
  await q(`UPDATE league_scores SET points = points + $2, updated_at = now() WHERE child_id = $1`, [childId, gems]);

  // Daily streak in Redis (TTL 48h, reset if gap).
  const streakKey = `streak:${childId}`;
  const today = new Date().toISOString().slice(0, 10);
  const last = await redis.hget(streakKey, 'lastDay');
  if (last !== today) {
    await redis.hset(streakKey, 'lastDay', today);
    await redis.hincrby(streakKey, 'count', 1);
    await redis.expire(streakKey, 60 * 60 * 48);
  }

  return { ...progress, gemsEarned: gems };
}

export default async function gamificationRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireParent, app.requireChildOwnership] };

  // Worlds with the child's mission trail: done-today state drives the path UI.
  app.get('/children/:childId/paths', guard, async (req) => {
    const { childId } = req.params as { childId: string };
    const { rows: [child] } = await q<{ age_band: string }>('SELECT age_band FROM children WHERE id = $1', [childId]);
    const { rows: paths } = await q('SELECT id, slug, name, emoji, tagline, pedagogy FROM paths ORDER BY sort');
    const { rows: missions } = await q(
      `SELECT m.id, m.slug, m.title, m.game_type, m.difficulty, m.gems_reward, m.path_id,
              EXISTS (SELECT 1 FROM mission_completions mc
                      WHERE mc.mission_id = m.id AND mc.child_id = $2
                        AND mc.completed_at > date_trunc('day', now())) AS done_today,
              (SELECT MAX(mc.accuracy) FROM mission_completions mc
               WHERE mc.mission_id = m.id AND mc.child_id = $2) AS best_accuracy
       FROM missions m WHERE m.age_band = $1 ORDER BY m.sort, m.difficulty`,
      [child.age_band, childId],
    );
    return paths.map((p) => ({ ...p, missions: missions.filter((m) => m.path_id === p.id) }));
  });

  app.get('/missions/:slug', { preHandler: [app.requireParent] }, async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const { rows: [mission] } = await q(
      `SELECT m.slug, m.title, m.game_type, m.difficulty, m.gems_reward, m.config, p.name AS path_name, p.emoji AS path_emoji
       FROM missions m LEFT JOIN paths p ON p.id = m.path_id WHERE m.slug = $1`, [slug],
    );
    if (!mission) return reply.code(404).send({ error: 'mission_not_found' });
    return mission;
  });

  app.post('/children/:childId/missions/:slug/complete',
    { preHandler: [app.requireParent, app.requireCoppaConsent, app.requireChildOwnership] },
    async (req) => {
      const { childId, slug } = req.params as { childId: string; slug: string };
      const { accuracy } = z.object({ accuracy: z.number().int().min(0).max(100).default(100) })
        .parse(req.body ?? {});
      const progress = await awardMission(childId, slug, accuracy);
      const streak = await redis.hget(`streak:${childId}`, 'count');
      return { ...progress, streak: Number(streak ?? 1) };
    });

  app.get('/children/:childId/progress', guard, async (req) => {
    const { childId } = req.params as { childId: string };
    const { rows: [progress] } = await q('SELECT * FROM child_progress WHERE child_id = $1', [childId]);
    const streak = await redis.hget(`streak:${childId}`, 'count');
    return { ...progress, streak: Number(streak ?? 0) };
  });
}
