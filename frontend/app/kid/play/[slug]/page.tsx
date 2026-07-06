'use client';
// Game runner: loads mission config, mounts the right engine, reports accuracy,
// celebrates with confetti. Effort always earns gems (growth mindset).
import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { GAME_ENGINES, type GameResult } from '@/components/games';
import { play, soundEnabled, toggleSound } from '@/lib/juice';

type Mission = { slug: string; title: string; game_type: string; gems_reward: number; config: Record<string, unknown>; path_name: string; path_emoji: string };
type Reward = { gems: number; stars: number; level: number; gemsEarned: number; streak: number; dailyChest: boolean; chestBonus: number };

const CONFETTI_COLORS = ['oklch(66% 0.17 38)', 'oklch(84% 0.14 92)', 'oklch(70% 0.1 235)', 'oklch(42% 0.09 158)'];

export default function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const childId = useSearchParams().get('child');
  const [mission, setMission] = useState<Mission | null>(null);
  const [result, setResult] = useState<(GameResult & Reward) | null>(null);
  const [sound, setSound] = useState(true);
  useEffect(() => setSound(soundEnabled()), []);

  useEffect(() => {
    api<Mission>(`/missions/${slug}`).then(setMission).catch(() => { window.location.href = '/kid'; });
  }, [slug]);

  async function finish(r: GameResult) {
    const accuracy = Math.round((r.correct / Math.max(1, r.total)) * 100);
    const reward = await api<Reward>(`/children/${childId}/missions/${slug}/complete`, {
      method: 'POST',
      body: JSON.stringify({ accuracy }),
    });
    play(reward.dailyChest ? 'chest' : 'win');
    setResult({ ...r, ...reward });
  }

  if (!mission) return (
    <main className="flex min-h-screen items-center justify-center bg-cream font-kid">
      <span className="float-slow text-7xl" aria-hidden>🌱</span>
    </main>
  );

  const Engine = GAME_ENGINES[mission.game_type];

  return (
    <main className="min-h-screen bg-cream pb-16 font-kid">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Link href="/kid" className="rounded-full bg-paper px-5 py-2 text-lg font-700 text-ink">← Sendero</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-700 text-mist">{mission.path_emoji} {mission.path_name}</span>
          <button onClick={() => setSound(toggleSound())} aria-label={sound ? 'silenciar' : 'activar sonido'}
            className="rounded-full bg-paper px-3 py-2 text-lg">
            {sound ? '🔊' : '🔇'}
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6">
        <h1 className="mb-8 text-center font-kid text-3xl font-700 text-ink">{mission.title}</h1>

        {result ? (
          <div className="relative text-center">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className="confetti rounded-sm" style={{
                  left: `${(i * 41) % 100}%`,
                  background: CONFETTI_COLORS[i % 4],
                  animationDelay: `${(i % 6) * 0.08}s`,
                }} />
              ))}
            </div>
            <div className="pop rounded-blob bg-paper px-8 py-12">
              <p className="text-7xl" aria-hidden>{result.correct === result.total ? '🏆' : '🌟'}</p>
              <h2 className="mt-4 text-3xl font-700 text-ink">
                {result.correct === result.total ? '¡Perfecto!' : '¡Gran esfuerzo!'}
              </h2>
              <p className="mt-2 text-xl text-mist">{result.correct} de {result.total} correctas</p>
              <p className="mt-4 inline-block rounded-full bg-sun px-6 py-2 text-2xl font-700 text-ink">
                +{result.gemsEarned} 💎
              </p>
              {result.dailyChest && (
                <div className="mt-4 rounded-blob bg-sun-soft px-6 py-4">
                  <span className="chest-shake inline-block text-4xl" aria-hidden>🎁</span>
                  <p className="mt-1 text-lg font-700 text-ink">¡Cofre del día! +{result.chestBonus} 💎 extra por venir a jugar</p>
                </div>
              )}
              {result.streak > 1 && <p className="mt-3 text-lg font-700 text-coral">🔥 Racha de {result.streak} días</p>}
              <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => setResult(null)} className="rounded-full bg-cream px-6 py-3 text-lg font-700 text-ink">
                  Jugar otra vez
                </button>
                <Link href="/kid" className="rounded-full bg-pine-deep px-6 py-3 text-lg font-700 text-paper">
                  Seguir el sendero →
                </Link>
              </div>
            </div>
          </div>
        ) : Engine ? (
          <Engine config={mission.config} onFinish={finish} />
        ) : (
          <p className="text-center text-mist">Este juego llega pronto.</p>
        )}
      </div>
    </main>
  );
}
