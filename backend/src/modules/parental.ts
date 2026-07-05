// Parent dashboard: usage metrics, time limits (scheduler enforcement), cognitive reports.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q, redis } from '../db/index.js';

export default async function parentalRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireParent, app.requireChildOwnership] };

  // --- Time limits (Scheduler) ---
  app.put('/children/:childId/limits', guard, async (req) => {
    const { childId } = req.params as { childId: string };
    const body = z.object({
      dailyMinutes: z.number().int().min(10).max(240),
      windowStart: z.string().regex(/^\d{2}:\d{2}$/),
      windowEnd: z.string().regex(/^\d{2}:\d{2}$/),
    }).parse(req.body);
    await q(
      `UPDATE time_limits SET daily_minutes = $2, window_start = $3, window_end = $4 WHERE child_id = $1`,
      [childId, body.dailyMinutes, body.windowStart, body.windowEnd],
    );
    return { ok: true };
  });

  // --- Session tracking: kid app calls start/heartbeat; Redis holds live counter ---
  app.post('/children/:childId/session/start', guard, async (req, reply) => {
    const { childId } = req.params as { childId: string };
    const { rows: [limits] } = await q<{ daily_minutes: number; window_start: string; window_end: string }>(
      'SELECT daily_minutes, window_start, window_end FROM time_limits WHERE child_id = $1', [childId],
    );
    const usedToday = Number(await redis.get(`usage:${childId}:today`) ?? 0);
    const now = new Date().toTimeString().slice(0, 5);
    if (usedToday >= limits.daily_minutes * 60 || now < limits.window_start.slice(0, 5) || now > limits.window_end.slice(0, 5)) {
      return reply.code(423).send({ error: 'time_limit_reached', message: 'Tiempo de juego terminado por hoy 🌙' });
    }
    const { rows: [session] } = await q<{ id: number }>(
      'INSERT INTO usage_sessions (child_id, started_at) VALUES ($1, now()) RETURNING id', [childId],
    );
    return { sessionId: session.id, remainingSeconds: limits.daily_minutes * 60 - usedToday };
  });

  app.post('/children/:childId/session/:sessionId/heartbeat', guard, async (req) => {
    const { childId, sessionId } = req.params as { childId: string; sessionId: string };
    const key = `usage:${childId}:today`;
    const total = await redis.incrby(key, 30); // heartbeat every 30s
    await redis.expire(key, secondsUntilMidnight());
    await q('UPDATE usage_sessions SET ended_at = now(), seconds = EXTRACT(EPOCH FROM now() - started_at)::int WHERE id = $1', [sessionId]);
    return { usedSecondsToday: total };
  });

  // --- Metrics for parent charts ---
  app.get('/children/:childId/metrics', guard, async (req) => {
    const { childId } = req.params as { childId: string };
    const [usage, byCategory] = await Promise.all([
      q(`SELECT date_trunc('day', started_at)::date AS day, COALESCE(SUM(seconds), 0)::int AS seconds
         FROM usage_sessions WHERE child_id = $1 AND started_at > now() - INTERVAL '14 days'
         GROUP BY 1 ORDER BY 1`, [childId]),
      q(`SELECT m.category, COUNT(*)::int AS completed, SUM(mc.gems_earned)::int AS gems
         FROM mission_completions mc JOIN missions m ON m.id = mc.mission_id
         WHERE mc.child_id = $1 AND mc.completed_at > now() - INTERVAL '30 days'
         GROUP BY 1`, [childId]),
    ]);
    return { dailyUsage: usage.rows, cognitiveDevelopment: byCategory.rows };
  });
}

function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}
