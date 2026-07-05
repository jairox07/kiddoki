// Email automation: templates + triggers. Provider-agnostic sender —
// swap `send` body for Resend/SendGrid API call in prod.
import type { FastifyInstance } from 'fastify';
import { q } from '../db/index.js';
import { decryptPII } from '../lib/crypto.js';

type TemplateData = Record<string, string | number>;

const templates = {
  weekly_report: (d: TemplateData) => ({
    subject: `📊 Reporte semanal de ${d.alias}`,
    html: `<h1>Esta semana ${d.alias} brilló ✨</h1>
           <p>Misiones completadas: <b>${d.missions}</b></p>
           <p>Gemas ganadas: <b>${d.gems}</b> 💎</p>
           <p>Tiempo de uso: <b>${d.minutes} min</b></p>
           <p>Área más fuerte: <b>${d.topCategory}</b></p>`,
  }),
  milestone: (d: TemplateData) => ({
    subject: `🏆 ¡${d.alias} alcanzó un hito!`,
    html: `<h1>${d.milestone}</h1><p>Celebra este logro con tu peque.</p>`,
  }),
  league_milestone: (d: TemplateData) => ({
    subject: `🎉 Tu liga "${d.leagueName}" celebró un hito colectivo`,
    html: `<h1>${d.milestone}</h1><p>Todos los niños de la liga lo lograron juntos.</p>`,
  }),
} as const;

// ponytail: console sender; replace with Resend fetch call for prod
async function send(to: string, subject: string, html: string) {
  console.log(`[email] to=${to} subject="${subject}" bytes=${html.length}`);
  return { id: `sim_${Date.now()}` };
}

export async function sendTemplate(parentId: string, template: keyof typeof templates, data: TemplateData) {
  const { rows: [parent] } = await q<{ email_enc: string }>('SELECT email_enc FROM parents WHERE id = $1', [parentId]);
  if (!parent) return;
  const { subject, html } = templates[template](data);
  await send(decryptPII(parent.email_enc), subject, html);
  await q('INSERT INTO email_log (parent_id, template) VALUES ($1, $2)', [parentId, template]);
}

// Weekly report job: run via cron (node --run or external scheduler hitting this endpoint).
export async function runWeeklyReports() {
  const { rows: children } = await q<{ id: string; parent_id: string; alias: string }>(
    'SELECT id, parent_id, alias FROM children',
  );
  for (const child of children) {
    const { rows: [stats] } = await q<{ missions: string; gems: string; minutes: string; top_category: string | null }>(
      `SELECT COUNT(mc.id) AS missions, COALESCE(SUM(mc.gems_earned), 0) AS gems,
              COALESCE((SELECT SUM(seconds) / 60 FROM usage_sessions
                WHERE child_id = $1 AND started_at > now() - INTERVAL '7 days'), 0)::int AS minutes,
              (SELECT m.category FROM mission_completions x JOIN missions m ON m.id = x.mission_id
               WHERE x.child_id = $1 AND x.completed_at > now() - INTERVAL '7 days'
               GROUP BY m.category ORDER BY COUNT(*) DESC LIMIT 1) AS top_category
       FROM mission_completions mc
       WHERE mc.child_id = $1 AND mc.completed_at > now() - INTERVAL '7 days'`, [child.id],
    );
    await sendTemplate(child.parent_id, 'weekly_report', {
      alias: child.alias,
      missions: Number(stats.missions),
      gems: Number(stats.gems),
      minutes: Number(stats.minutes),
      topCategory: stats.top_category ?? 'explorando',
    });
  }
}

export default async function emailRoutes(app: FastifyInstance) {
  // Trigger endpoint for external cron (protect with internal token in prod).
  app.post('/internal/jobs/weekly-reports', async () => {
    await runWeeklyReports();
    return { ok: true };
  });
}
