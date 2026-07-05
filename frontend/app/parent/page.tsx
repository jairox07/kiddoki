'use client';
// Parent dashboard: auth, children, usage metrics, subscription tiers, Fantasy Play leagues.
import { useEffect, useState, type FormEvent } from 'react';
import { api, avatarEmoji } from '@/lib/api';

type Child = { id: string; alias: string; avatar_seed: string; age_band: string; gems: number; stars: number; level: number };
type Sub = { tier: 'semilla' | 'brote' | 'bosque'; status: string; details: { monthlyUsd: number; maxChildren: number; features: string[] } };
type League = { id: string; name: string; invite_code: string; is_owner: boolean; member_count: number };
type LeaderRow = { alias: string; avatar_seed: string; points: number; rank: number; percentile: number; is_mine: boolean };
type Metrics = { dailyUsage: { day: string; seconds: number }[]; cognitiveDevelopment: { category: string; completed: number; gems: number }[] };

const TIER_INFO = {
  semilla: { emoji: '🌱', name: 'Semilla', price: '$4.99' },
  brote: { emoji: '🌿', name: 'Brote', price: '$9.99' },
  bosque: { emoji: '🌳', name: 'Bosque', price: '$14.99' },
} as const;

export default function ParentDashboard() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => setToken(localStorage.getItem('kiddoki_token')), []);
  return token === null && typeof window !== 'undefined' && !localStorage.getItem('kiddoki_token')
    ? <AuthForm onAuth={(t) => { localStorage.setItem('kiddoki_token', t); setToken(t); }} />
    : token ? <Dashboard /> : null;
}

function AuthForm({ onAuth }: { onAuth: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const { token } = await api<{ token: string }>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(mode === 'register' ? { ...body, coppaConsent: true } : body),
      });
      onAuth(token);
    } catch {
      setError('Error de autenticación. Revisa tus datos.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-black text-forest">Kiddoki para padres</h1>
      <form onSubmit={submit} className="parent-card flex flex-col gap-3">
        {mode === 'register' && <input name="name" placeholder="Tu nombre" required className="rounded-lg border p-3" />}
        <input name="email" type="email" placeholder="Email" required className="rounded-lg border p-3" />
        <input name="password" type="password" placeholder="Contraseña (mín. 8)" required minLength={8} className="rounded-lg border p-3" />
        {mode === 'register' && (
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" required className="mt-1" />
            Doy mi consentimiento parental verificable (COPPA/GDPR-K). Los perfiles de mis hijos serán 100% anónimos.
          </label>
        )}
        {error && <p className="text-sm text-berry">{error}</p>}
        <button className="rounded-xl bg-forest py-3 font-bold text-white">
          {mode === 'register' ? 'Crear cuenta' : 'Entrar'}
        </button>
        <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="text-sm text-sky underline">
          {mode === 'register' ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
        </button>
      </form>
    </main>
  );
}

function Dashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const refresh = () => Promise.all([
    api<Child[]>('/children').then(setChildren),
    api<Sub>('/subscriptions/me').then(setSub),
    api<League[]>('/leagues/mine').then(setLeagues).catch(() => setLeagues([])),
  ]);
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (selectedChild) api<Metrics>(`/children/${selectedChild}/metrics`).then(setMetrics);
  }, [selectedChild]);

  async function addChild(ageBand: string) {
    await api('/children', { method: 'POST', body: JSON.stringify({ ageBand }) });
    refresh();
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-forest">Panel de padres 🌳</h1>
        <button onClick={() => { localStorage.removeItem('kiddoki_token'); location.reload(); }} className="text-sm text-slate-400">Salir</button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Children + metrics */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="parent-card">
            <h2 className="mb-3 font-bold text-slate-700">Mis hijos (perfiles anónimos)</h2>
            <div className="flex flex-wrap gap-3">
              {children.map((c) => (
                <button key={c.id} onClick={() => setSelectedChild(c.id)}
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 ${selectedChild === c.id ? 'border-forest bg-kiwi/10' : 'border-slate-200'}`}>
                  <span className="text-3xl">{avatarEmoji(c.avatar_seed)}</span>
                  <div className="text-left text-sm">
                    <div className="font-bold">{c.alias}</div>
                    <div className="text-slate-500">Nivel {c.level} · 💎{c.gems}</div>
                  </div>
                </button>
              ))}
              <div className="flex gap-1">
                {(['early', 'middle', 'upper'] as const).map((band) => (
                  <button key={band} onClick={() => addChild(band)}
                    className="rounded-xl border-2 border-dashed border-slate-300 px-3 text-xs text-slate-500 hover:border-forest">
                    + {band === 'early' ? '1-4' : band === 'middle' ? '5-7' : '8-11'} años
                  </button>
                ))}
              </div>
            </div>
          </div>

          {metrics && (
            <div className="parent-card">
              <h2 className="mb-3 font-bold text-slate-700">Tiempo de uso (14 días)</h2>
              <div className="flex h-32 items-end gap-1">
                {metrics.dailyUsage.length === 0 && <p className="text-sm text-slate-400">Sin datos aún.</p>}
                {metrics.dailyUsage.map((d) => (
                  <div key={d.day} className="flex-1 rounded-t bg-sky" title={`${d.day}: ${Math.round(d.seconds / 60)} min`}
                    style={{ height: `${Math.min(100, (d.seconds / 3600) * 100)}%` }} />
                ))}
              </div>
              <h2 className="mb-3 mt-6 font-bold text-slate-700">Desarrollo cognitivo (30 días)</h2>
              {metrics.cognitiveDevelopment.map((c) => (
                <div key={c.category} className="mb-2 flex items-center gap-2 text-sm">
                  <span className="w-20 font-medium capitalize">{c.category}</span>
                  <div className="h-3 flex-1 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-kiwi" style={{ width: `${Math.min(100, c.completed * 10)}%` }} />
                  </div>
                  <span className="text-slate-500">{c.completed} misiones</span>
                </div>
              ))}
            </div>
          )}

          <FantasySection leagues={leagues} childrenList={children} onChange={refresh} tier={sub?.tier} />
        </section>

        {/* Subscription */}
        <section className="flex flex-col gap-4">
          <div className="parent-card">
            <h2 className="mb-3 font-bold text-slate-700">Mi plan</h2>
            {sub && (
              <div className="mb-4 rounded-xl bg-kiwi/10 p-3 text-center">
                <div className="text-3xl">{TIER_INFO[sub.tier].emoji}</div>
                <div className="font-black text-forest">{TIER_INFO[sub.tier].name}</div>
                <div className="text-xs uppercase text-slate-400">{sub.status}</div>
              </div>
            )}
            {(Object.keys(TIER_INFO) as (keyof typeof TIER_INFO)[]).map((tier) => (
              <button key={tier} disabled={sub?.tier === tier && sub?.status === 'active'}
                onClick={async () => { await api('/subscriptions/simulate-payment', { method: 'POST', body: JSON.stringify({ tier }) }); refresh(); }}
                className="mb-2 flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 hover:border-forest disabled:opacity-40">
                <span>{TIER_INFO[tier].emoji} {TIER_INFO[tier].name}</span>
                <span className="font-bold">{TIER_INFO[tier].price}/mes</span>
              </button>
            ))}
            <p className="mt-2 text-xs text-slate-400">Pagos simulados (Stripe test mode).</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FantasySection({ leagues, childrenList, onChange, tier }: {
  leagues: League[]; childrenList: Child[]; onChange: () => void; tier?: string;
}) {
  const [board, setBoard] = useState<{ leaderboard: LeaderRow[]; collective: { totalPoints: number; milestones: { label: string }[] } } | null>(null);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const locked = tier === 'semilla';

  useEffect(() => {
    if (activeLeague) api(`/leagues/${activeLeague}/leaderboard`).then((b) => setBoard(b as typeof board));
  }, [activeLeague]);

  async function createLeague() {
    const name = prompt('Nombre de la liga:');
    if (name) { await api('/leagues', { method: 'POST', body: JSON.stringify({ name }) }); onChange(); }
  }
  async function joinLeague() {
    const inviteCode = prompt('Código de invitación:');
    const childId = childrenList[0]?.id;
    if (inviteCode && childId) {
      await api('/leagues/join', { method: 'POST', body: JSON.stringify({ inviteCode, childId }) });
      onChange();
    }
  }

  return (
    <div className="parent-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-700">⚔️ Fantasy Play — Competencia sana</h2>
        {!locked && (
          <div className="flex gap-2">
            <button onClick={createLeague} className="rounded-lg bg-forest px-3 py-1 text-sm font-bold text-white">Crear liga</button>
            <button onClick={joinLeague} className="rounded-lg border border-forest px-3 py-1 text-sm font-bold text-forest">Unirme</button>
          </div>
        )}
      </div>

      {locked ? (
        <p className="text-sm text-slate-500">🔒 Disponible en planes Brote y Bosque. Los niños compiten de forma 100% anónima con sus avatares.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {leagues.map((l) => (
              <button key={l.id} onClick={() => setActiveLeague(l.id)}
                className={`rounded-lg border px-3 py-1 text-sm ${activeLeague === l.id ? 'border-forest bg-kiwi/10 font-bold' : 'border-slate-200'}`}>
                {l.name} ({l.member_count})
                {l.is_owner && <span className="ml-1 text-xs text-slate-400">código: {l.invite_code}</span>}
              </button>
            ))}
            {leagues.length === 0 && <p className="text-sm text-slate-400">Crea una liga e invita a otros padres con un código seguro.</p>}
          </div>

          {board && (
            <>
              {board.collective.milestones.map((m) => (
                <div key={m.label} className="mb-2 rounded-lg bg-sun/20 p-2 text-center text-sm font-bold">{m.label}</div>
              ))}
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-400"><th>#</th><th>Explorador</th><th>Puntos</th><th>Percentil</th></tr></thead>
                <tbody>
                  {board.leaderboard.map((row) => (
                    <tr key={row.alias} className={row.is_mine ? 'bg-kiwi/10 font-bold' : ''}>
                      <td className="py-1">{row.rank}</td>
                      <td>{avatarEmoji(row.avatar_seed)} {row.alias}</td>
                      <td>💎 {row.points}</td>
                      <td>P{row.percentile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-slate-400">Solo alias anónimos y percentiles — nunca datos reales de los niños.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
