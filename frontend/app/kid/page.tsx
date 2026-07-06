'use client';
// Kid home: four worlds, each with its mission trail. Anonymous identity,
// guide progress ring, daily streak. Missions link to the game runner.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, avatarEmoji } from '@/lib/api';

type Child = { id: string; alias: string; avatar_seed: string; age_band: string; guide_character: string; gems: number; stars: number; level: number; guide_stage: number };
type Mission = { id: string; slug: string; title: string; game_type: string; difficulty: number; gems_reward: number; done_today: boolean; best_accuracy: number | null };
type World = { id: string; slug: string; name: string; emoji: string; tagline: string; missions: Mission[] };

const GUIDES: Record<string, string[]> = {
  koki: ['🥚', '🐣', '🐤', '🦜'],
  luna: ['🌑', '🌒', '🌓', '🌕'],
  max: ['🐛', '🦋', '🐉', '✨'],
};
const WORLD_BG: Record<string, string> = {
  numeros: 'bg-lago-soft', palabras: 'bg-coral-soft', logica: 'bg-sun-soft', corazon: 'bg-pine-soft',
};

export default function KidHome() {
  const [child, setChild] = useState<Child | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [streak, setStreak] = useState(0);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    api<Child[]>('/children').then(async (kids) => {
      if (!kids.length) return;
      const kid = kids[0];
      setChild(kid);
      const [paths, progress] = await Promise.all([
        api<World[]>(`/children/${kid.id}/paths`),
        api<{ streak: number }>(`/children/${kid.id}/progress`),
      ]);
      setWorlds(paths);
      setStreak(progress.streak);
      try {
        await api(`/children/${kid.id}/session/start`, { method: 'POST' });
      } catch (e) {
        if ((e as { status?: number }).status === 423) setBlocked(true);
      }
    }).catch(() => { window.location.href = '/parent'; });
  }, []);

  if (blocked) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-pine-deep p-8 text-center font-kid text-paper">
      <div className="float-slow text-8xl" aria-hidden>🌙</div>
      <h1 className="text-4xl font-700">¡Hora de descansar!</h1>
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
  const doneCount = worlds.flatMap((w) => w.missions).filter((m) => m.done_today).length;

  return (
    <main className="min-h-screen bg-cream pb-20 font-kid">
      <header className="bg-pine-deep px-6 pb-14 pt-8 text-paper">
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
        <div className="mx-auto mt-7 flex max-w-2xl items-center gap-6">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="44" fill="none" stroke="oklch(100% 0 0 / 0.15)" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="oklch(84% 0.14 92)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${levelPct * 2.76} 276`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-4xl" aria-hidden>{guideFace}</span>
          </div>
          <div>
            <p className="text-lg font-700">Tu amigo crece contigo</p>
            <p className="text-sm opacity-70">{100 - levelPct} gemas para el nivel {child.level + 1}</p>
            <div className="mt-1.5 flex gap-2">
              {streak > 1 && <span className="rounded-full bg-sun px-3 py-0.5 text-sm font-700 text-ink">🔥 {streak} días</span>}
              {doneCount > 0 && <span className="rounded-full bg-paper/15 px-3 py-0.5 text-sm font-700">✅ {doneCount} hoy</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-10 px-6 pt-10">
        {worlds.map((w) => (
          <section key={w.id}>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-700 text-ink">{w.emoji} {w.name}</h2>
              <p className="text-sm text-mist">{w.tagline}</p>
            </div>
            <ol className="relative mt-4">
              <div className="absolute bottom-8 left-8 top-4 w-1.5 rounded-full bg-paper" aria-hidden />
              {w.missions.map((m, i) => (
                <li key={m.id} className={`relative mb-4 ${i % 2 ? 'sm:ml-14' : 'sm:ml-2'}`}>
                  <Link href={`/kid/play/${m.slug}?child=${child.id}`}
                    className={`flex items-center gap-4 rounded-blob p-4 transition-transform ease-out-quint hover:scale-[1.02] active:scale-95 ${
                      m.done_today ? 'bg-pine-soft' : 'bg-paper'}`}>
                    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl ${m.done_today ? 'bg-paper' : WORLD_BG[w.slug] ?? 'bg-cream'}`} aria-hidden>
                      {m.done_today ? '✅' : w.emoji}
                    </span>
                    <span className="flex-1">
                      <span className="block text-lg font-700 leading-snug text-ink">{m.title}</span>
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-mist">{'●'.repeat(m.difficulty)}{'○'.repeat(3 - m.difficulty)}</span>
                        <span className={`font-700 ${m.done_today ? 'text-pine' : 'text-coral'}`}>
                          {m.done_today ? `¡Lista! ${m.best_accuracy ?? 100}%` : `+${m.gems_reward} 💎`}
                        </span>
                      </span>
                    </span>
                    <span className="text-2xl text-mist" aria-hidden>›</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
