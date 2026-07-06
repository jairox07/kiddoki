'use client';
// Kid world: warm cream stage, adventure trail of missions (not a card grid),
// guide character with a progress ring, confetti celebration. Anonymous identity only.
import { useEffect, useState } from 'react';
import { api, avatarEmoji } from '@/lib/api';

type Child = { id: string; alias: string; avatar_seed: string; age_band: string; guide_character: string; gems: number; stars: number; level: number; guide_stage: number };
type Mission = { id: string; slug: string; title: string; category: string; gems_reward: number };

const GUIDES: Record<string, string[]> = {
  koki: ['🥚', '🐣', '🐤', '🦜'],
  luna: ['🌑', '🌒', '🌓', '🌕'],
  max: ['🐛', '🦋', '🐉', '✨'],
};
const CATEGORY: Record<string, { icon: string; bg: string }> = {
  math: { icon: '🔢', bg: 'bg-lago-soft' },
  reading: { icon: '📚', bg: 'bg-coral-soft' },
  logic: { icon: '🧩', bg: 'bg-sun-soft' },
  habits: { icon: '🌟', bg: 'bg-pine-soft' },
};
const CONFETTI_COLORS = ['oklch(66% 0.17 38)', 'oklch(84% 0.14 92)', 'oklch(70% 0.1 235)', 'oklch(42% 0.09 158)'];

export default function KidWorld() {
  const [child, setChild] = useState<Child | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    api<Child[]>('/children').then(async (kids) => {
      if (!kids.length) return;
      const kid = kids[0];
      setChild(kid);
      setMissions(await api<Mission[]>(`/missions?ageBand=${kid.age_band}`));
      try {
        await api(`/children/${kid.id}/session/start`, { method: 'POST' });
      } catch (e) {
        if ((e as { status?: number }).status === 423) setBlocked(true);
      }
    }).catch(() => { window.location.href = '/parent'; });
  }, []);

  async function complete(mission: Mission) {
    if (!child || done.has(mission.slug)) return;
    const result = await api<Child & { streak: number }>(`/children/${child.id}/missions/${mission.slug}/complete`, { method: 'POST' });
    setChild({ ...child, ...result });
    setStreak(result.streak);
    setDone(new Set(done).add(mission.slug));
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 1700);
  }

  if (blocked) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-pine-deep p-8 text-center text-paper">
      <div className="float-slow text-8xl" aria-hidden>🌙</div>
      <h1 className="font-kid text-4xl font-700">¡Hora de descansar!</h1>
      <p className="text-xl opacity-80">Mañana el bosque te espera con más aventuras.</p>
    </main>
  );

  if (!child) return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <span className="float-slow text-7xl" aria-hidden>🌱</span>
    </main>
  );

  const guide = GUIDES[child.guide_character] ?? GUIDES.koki;
  const guideFace = guide[Math.min(child.guide_stage - 1, guide.length - 1)];
  const levelPct = child.gems % 100;

  return (
    <main className="min-h-screen bg-cream pb-20 font-kid">
      {celebrating && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="confetti rounded-sm" style={{
              left: `${(i * 41) % 100}%`,
              background: CONFETTI_COLORS[i % 4],
              animationDelay: `${(i % 6) * 0.08}s`,
            }} />
          ))}
          <div className="pop absolute inset-0 flex items-center justify-center">
            <span className="rounded-blob bg-paper px-10 py-6 font-kid text-5xl font-700 text-pine-deep shadow-xl">+gemas 💎</span>
          </div>
        </div>
      )}

      {/* Sky band: identity + guide */}
      <header className="bg-pine-deep px-6 pb-16 pt-8 text-paper">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper text-4xl" aria-hidden>{avatarEmoji(child.avatar_seed)}</span>
            <div>
              <h1 className="text-2xl font-700">{child.alias}</h1>
              <p className="text-sm opacity-70">explorador nivel {child.level}</p>
            </div>
          </div>
          <div className="flex gap-3 text-lg font-700">
            <span className="rounded-full bg-paper/15 px-4 py-1.5">💎 {child.gems}</span>
            <span className="rounded-full bg-paper/15 px-4 py-1.5">⭐ {child.stars}</span>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl items-center gap-6">
          <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="44" fill="none" stroke="oklch(100% 0 0 / 0.15)" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="oklch(84% 0.14 92)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${levelPct * 2.76} 276`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden>{guideFace}</span>
          </div>
          <div>
            <p className="text-xl font-700">Tu amigo crece contigo</p>
            <p className="text-sm opacity-70">{100 - levelPct} gemas para el nivel {child.level + 1}</p>
            {streak > 1 && <p className="mt-1 inline-block rounded-full bg-sun px-3 py-0.5 text-sm font-700 text-ink">🔥 racha de {streak} días</p>}
          </div>
        </div>
      </header>

      {/* Adventure trail */}
      <section className="mx-auto max-w-2xl px-6">
        <h2 className="-mt-6 mb-2 inline-block rounded-full bg-coral px-6 py-2.5 text-xl font-700 text-paper">
          Tu sendero de hoy 🚀
        </h2>
        <ol className="relative mt-6">
          <div className="absolute bottom-8 left-9 top-4 w-1.5 rounded-full bg-pine-soft sm:left-11" aria-hidden />
          {missions.map((m, i) => {
            const cat = CATEGORY[m.category] ?? CATEGORY.habits;
            const isDone = done.has(m.slug);
            return (
              <li key={m.id} className={`relative mb-5 ${i % 2 ? 'sm:ml-16' : 'sm:ml-4'}`}>
                <button onClick={() => complete(m)} disabled={isDone}
                  className={`flex w-full items-center gap-5 rounded-blob p-5 text-left transition-transform ease-out-quint ${
                    isDone ? 'bg-pine-soft opacity-70' : 'bg-paper hover:scale-[1.03] active:scale-95'}`}>
                  <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl ${isDone ? 'bg-paper' : cat.bg}`} aria-hidden>
                    {isDone ? '✅' : cat.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block text-xl font-700 leading-snug text-ink">{m.title}</span>
                    <span className={`text-lg font-700 ${isDone ? 'text-pine' : 'text-coral'}`}>
                      {isDone ? '¡Completada!' : `+${m.gems_reward} 💎`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {missions.length > 0 && done.size === missions.length && (
          <p className="pop mt-8 rounded-blob bg-sun px-6 py-5 text-center text-2xl font-700 text-ink">
            ¡Sendero completo! Eres increíble 🏆
          </p>
        )}
      </section>
    </main>
  );
}
