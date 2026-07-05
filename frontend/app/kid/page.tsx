'use client';
// Kid dashboard: big touch targets, zero text-dependence for early band,
// anonymous alias + avatar only, guide character, missions as game cards.
import { useEffect, useState } from 'react';
import { api, avatarEmoji } from '@/lib/api';

type Child = { id: string; alias: string; avatar_seed: string; age_band: string; guide_character: string; gems: number; stars: number; level: number; guide_stage: number };
type Mission = { id: string; slug: string; title: string; category: string; gems_reward: number };

const GUIDES: Record<string, string[]> = {
  koki: ['🥚', '🐣', '🐤', '🦜'], // evolves with guide_stage
  luna: ['🌑', '🌒', '🌓', '🌕'],
  max: ['🐛', '🦋', '🐉', '✨'],
};
const CATEGORY_ICON: Record<string, string> = { math: '🔢', reading: '📚', logic: '🧩', habits: '🌟' };

export default function KidDashboard() {
  const [child, setChild] = useState<Child | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    api<Child[]>('/children').then(async (kids) => {
      if (!kids.length) return;
      const kid = kids[0]; // MVP: first child; add profile picker later
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
    if (!child) return;
    const result = await api<Child & { streak: number }>(`/children/${child.id}/missions/${mission.slug}/complete`, { method: 'POST' });
    setChild({ ...child, ...result });
    setCelebration(`+${mission.gems_reward} 💎`);
    setTimeout(() => setCelebration(null), 1800);
  }

  if (blocked) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-indigo-950 p-8 text-center text-white">
      <div className="text-8xl">🌙</div>
      <h1 className="text-3xl font-black">¡Hora de descansar!</h1>
      <p className="text-xl">Mañana hay más aventuras.</p>
    </main>
  );

  if (!child) return <main className="flex min-h-screen items-center justify-center text-6xl animate-bounce">🌱</main>;

  const guide = GUIDES[child.guide_character] ?? GUIDES.koki;

  return (
    <main className="mx-auto max-w-2xl p-6">
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sun/60 text-8xl font-black animate-ping">{celebration}</div>
      )}

      {/* Header: anonymous identity + progress */}
      <header className="kid-card mb-6 flex items-center gap-4 !border-sky">
        <span className="text-6xl">{avatarEmoji(child.avatar_seed)}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">{child.alias}</h1>
          <p className="font-bold text-forest">Nivel {child.level}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-sky">💎 {child.gems}</div>
          <div className="text-xl font-black text-sun">⭐ {child.stars}</div>
        </div>
      </header>

      {/* Guide character */}
      <section className="kid-card mb-6 flex items-center gap-4 !border-kiwi bg-gradient-to-r from-kiwi/10 to-sky/10">
        <span className="text-7xl">{guide[Math.min(child.guide_stage - 1, guide.length - 1)]}</span>
        <p className="text-lg font-bold text-slate-700">
          ¡Tu amigo crece contigo! Completa misiones para que evolucione.
        </p>
      </section>

      {/* Missions */}
      <h2 className="mb-4 text-2xl font-black text-slate-800">Misiones de hoy 🚀</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {missions.map((m) => (
          <button key={m.id} onClick={() => complete(m)}
            className="kid-card flex items-center gap-4 text-left active:scale-95">
            <span className="text-5xl">{CATEGORY_ICON[m.category] ?? '🎯'}</span>
            <div>
              <div className="text-lg font-black text-slate-800">{m.title}</div>
              <div className="font-bold text-sky">+{m.gems_reward} 💎</div>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
