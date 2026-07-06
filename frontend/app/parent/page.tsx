'use client';
// Parent home: calm editorial surface. Sections separated by rhythm, not boxes.
// Auth, anonymous children, usage + cognitive charts, Fantasy Play, plan.
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, avatarEmoji } from '@/lib/api';

type Child = { id: string; alias: string; avatar_seed: string; age_band: string; gems: number; stars: number; level: number };
type Sub = { tier: 'semilla' | 'brote' | 'bosque'; status: string; details: { monthlyUsd: number; maxChildren: number } };
type League = { id: string; name: string; invite_code: string; is_owner: boolean; member_count: number };
type LeaderRow = { alias: string; avatar_seed: string; points: number; rank: number; percentile: number; is_mine: boolean };
type Board = { leaderboard: LeaderRow[]; collective: { totalPoints: number; totalMissions: number; milestones: { label: string }[] } };
type Metrics = { dailyUsage: { day: string; seconds: number }[]; cognitiveDevelopment: { category: string; completed: number; gems: number }[] };

const TIERS = [
  { id: 'semilla', name: 'Semilla', price: 4.99, blurb: '1 hijo, juegos base' },
  { id: 'brote', name: 'Brote', price: 9.99, blurb: '3 hijos + Fantasy Play' },
  { id: 'bosque', name: 'Bosque', price: 14.99, blurb: '6 hijos, todo incluido' },
] as const;
const CATEGORY_LABEL: Record<string, string> = { math: 'Matemáticas', reading: 'Lectura', logic: 'Lógica', habits: 'Hábitos' };
const BAND_LABEL: Record<string, string> = { early: '1 a 4 años', middle: '5 a 7 años', upper: '8 a 11 años' };

export default function ParentPage() {
  const [token, setToken] = useState<string | null | 'none'>(null);
  useEffect(() => setToken(localStorage.getItem('kiddoki_token') ?? 'none'), []);
  if (token === null) return null;
  if (token === 'none') return <AuthScreen onAuth={(t) => { localStorage.setItem('kiddoki_token', t); setToken(t); }} />;
  return <Home />;
}

function AuthScreen({ onAuth }: { onAuth: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const { token } = await api<{ token: string }>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(mode === 'register' ? { ...body, coppaConsent: true } : body),
      });
      onAuth(token);
    } catch {
      setError(mode === 'login' ? 'Email o contraseña incorrectos.' : 'No pudimos crear la cuenta. ¿Ya existe ese email?');
      setBusy(false);
    }
  }

  const input = 'w-full rounded-2xl border border-pine-soft bg-paper px-4 py-3.5 font-body text-ink outline-none transition-colors focus:border-pine';

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-pine-deep p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <span className="font-display text-2xl font-800">kiddoki</span>
        <blockquote className="max-w-md">
          <p className="font-display text-3xl font-700 leading-snug text-balance">
            "Por fin una app donde mi hija compite con sus primos y yo no tuve que subir ni una foto."
          </p>
          <footer className="mt-4 text-sm opacity-70">Madre de la beta, liga familiar de 6 niños</footer>
        </blockquote>
        <p className="text-sm opacity-60">Cifrado AES-256-GCM · COPPA · GDPR-K</p>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-3xl font-800 tracking-tight text-ink">
            {mode === 'register' ? 'Crea tu cuenta familiar' : 'Hola de nuevo'}
          </h1>
          <p className="mt-2 text-mist">
            {mode === 'register' ? 'Dos minutos. Tu hijo nunca dará un solo dato.' : 'Tu bosque te espera.'}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'register' && <input name="name" placeholder="Tu nombre" required className={input} autoComplete="name" />}
            <input name="email" type="email" placeholder="Email" required className={input} autoComplete="email" />
            <input name="password" type="password" placeholder="Contraseña (mínimo 8)" required minLength={8} className={input}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
            {mode === 'register' && (
              <label className="flex items-start gap-3 rounded-2xl bg-cream p-4 text-sm leading-relaxed text-ink">
                <input type="checkbox" required className="mt-1 accent-pine" />
                Doy mi consentimiento parental verificable (COPPA/GDPR-K). Entiendo que los perfiles de mis
                hijos serán 100% anónimos: sin nombres reales ni fotos, jamás.
              </label>
            )}
            {error && <p role="alert" className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-600 text-coral">{error}</p>}
            <button disabled={busy} className="w-full rounded-full bg-pine-deep py-3.5 font-700 text-paper transition-transform ease-out-quint hover:scale-[1.02] disabled:opacity-50">
              {busy ? 'Un momento…' : mode === 'register' ? 'Crear cuenta gratis' : 'Entrar'}
            </button>
          </form>
          <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}
            className="mt-5 text-sm font-600 text-pine underline decoration-2 underline-offset-4">
            {mode === 'register' ? 'Ya tengo cuenta' : 'Quiero crear una cuenta'}
          </button>
        </div>
      </section>
    </main>
  );
}

function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = useCallback(() => Promise.all([
    api<Child[]>('/children').then((kids) => {
      setChildren(kids);
      setSelected((cur) => cur ?? kids[0]?.id ?? null);
    }),
    api<Sub>('/subscriptions/me').then(setSub),
    api<League[]>('/leagues/mine').then(setLeagues).catch(() => setLeagues([])),
  ]), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (selected) api<Metrics>(`/children/${selected}/metrics`).then(setMetrics);
  }, [selected]);

  async function addChild(ageBand: string) {
    await api('/children', { method: 'POST', body: JSON.stringify({ ageBand }) });
    refresh();
  }
  const active = children.find((c) => c.id === selected);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">
      <nav className="flex items-center justify-between py-6">
        <span className="font-display text-2xl font-800 text-pine-deep">kiddoki</span>
        <div className="flex items-center gap-5 text-sm">
          {sub && <span className="rounded-full bg-pine-soft px-4 py-1.5 font-700 text-pine-deep">Plan {sub.tier}</span>}
          <button onClick={() => { localStorage.removeItem('kiddoki_token'); location.reload(); }} className="font-600 text-mist hover:text-ink">
            Salir
          </button>
        </div>
      </nav>

      {/* Children strip */}
      <header className="mt-6">
        <h1 className="font-display text-4xl font-800 tracking-tight text-ink">Tu bosque</h1>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {children.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`flex items-center gap-3 rounded-full py-2 pl-2 pr-5 transition-colors ${
                selected === c.id ? 'bg-pine-deep text-paper' : 'bg-cream text-ink hover:bg-pine-soft'}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-2xl" aria-hidden>{avatarEmoji(c.avatar_seed)}</span>
              <span className="text-left">
                <span className="block text-sm font-700 leading-tight">{c.alias}</span>
                <span className={`text-xs ${selected === c.id ? 'opacity-70' : 'text-mist'}`}>nivel {c.level} · 💎 {c.gems}</span>
              </span>
            </button>
          ))}
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-full border-2 border-dashed border-pine-soft px-5 py-3 text-sm font-700 text-pine hover:border-pine">
              + Añadir hijo
            </summary>
            <div className="absolute z-10 mt-2 w-52 rounded-2xl bg-paper p-2 shadow-lg">
              {Object.entries(BAND_LABEL).map(([band, label]) => (
                <button key={band} onClick={() => addChild(band)} className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-600 text-ink hover:bg-cream">
                  {label}
                </button>
              ))}
              <p className="px-4 py-2 text-xs text-mist">El alias y avatar se generan solos. Nunca pedimos su nombre.</p>
            </div>
          </details>
        </div>
      </header>

      {children.length === 0 && (
        <section className="mt-16 rounded-blob bg-cream px-8 py-16 text-center">
          <p className="text-5xl" aria-hidden>🌱</p>
          <h2 className="mt-4 font-display text-2xl font-700 text-ink">Planta tu primera semilla</h2>
          <p className="mx-auto mt-2 max-w-md text-mist">
            Crea el perfil de tu hijo. Solo elige su rango de edad: nosotros generamos su identidad
            de juego anónima al instante.
          </p>
        </section>
      )}

      {active && metrics && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-700 text-ink">La semana de {active.alias}</h2>
          <div className="mt-8 grid gap-14 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h3 className="text-sm font-700 uppercase tracking-wide text-mist">Tiempo de uso · 14 días</h3>
              <UsageChart data={metrics.dailyUsage} />
            </div>
            <div>
              <h3 className="text-sm font-700 uppercase tracking-wide text-mist">Desarrollo cognitivo · 30 días</h3>
              {metrics.cognitiveDevelopment.length === 0 ? (
                <p className="mt-6 text-mist">Aún sin misiones completadas. El sendero espera.</p>
              ) : (
                <ul className="mt-6 space-y-5">
                  {metrics.cognitiveDevelopment.map((c) => (
                    <li key={c.category}>
                      <div className="flex items-baseline justify-between">
                        <span className="font-700 text-ink">{CATEGORY_LABEL[c.category] ?? c.category}</span>
                        <span className="text-sm text-mist">{c.completed} misiones · {c.gems} gemas</span>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-cream">
                        <div className="h-2.5 rounded-full bg-pine transition-all duration-700 ease-out-quint"
                          style={{ width: `${Math.min(100, c.completed * 12)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      <FantasyPlay leagues={leagues} childrenList={children} tier={sub?.tier} onChange={refresh} />

      {/* Plan */}
      <section className="mt-20">
        <h2 className="font-display text-2xl font-700 text-ink">Tu plan</h2>
        <div className="mt-6 flex flex-wrap gap-4">
          {TIERS.map((t) => {
            const current = sub?.tier === t.id;
            return (
              <button key={t.id} disabled={current && sub?.status === 'active'}
                onClick={async () => { await api('/subscriptions/simulate-payment', { method: 'POST', body: JSON.stringify({ tier: t.id }) }); refresh(); }}
                className={`flex-1 rounded-blob p-6 text-left transition-transform ease-out-quint hover:scale-[1.02] disabled:scale-100 ${
                  current ? 'bg-pine-deep text-paper' : 'bg-cream text-ink'}`}>
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-xl font-700">{t.name}</span>
                  {current && <span className="rounded-full bg-sun px-3 py-0.5 text-xs font-700 text-ink">actual</span>}
                </div>
                <p className={`mt-1 text-sm ${current ? 'opacity-70' : 'text-mist'}`}>{t.blurb}</p>
                <p className="mt-3 font-display text-2xl font-800">${t.price}<span className="text-sm font-500 opacity-60">/mes</span></p>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-mist">Pagos en modo simulado (Stripe test). Cambia de plan cuando quieras.</p>
      </section>
    </main>
  );
}

function UsageChart({ data }: { data: { day: string; seconds: number }[] }) {
  if (data.length === 0) return <p className="mt-6 text-mist">Sin sesiones registradas todavía.</p>;
  const max = Math.max(...data.map((d) => d.seconds), 1800);
  const W = 440, H = 140, gap = 6;
  const bw = (W - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="mt-6 w-full" role="img" aria-label="Minutos de uso por día">
      {data.map((d, i) => {
        const h = Math.max(4, (d.seconds / max) * H);
        const mins = Math.round(d.seconds / 60);
        return (
          <g key={d.day}>
            <rect x={i * (bw + gap)} y={H - h} width={bw} height={h} rx="5" fill="oklch(70% 0.1 235)">
              <title>{`${d.day.slice(0, 10)}: ${mins} min`}</title>
            </rect>
            <text x={i * (bw + gap) + bw / 2} y={H + 16} textAnchor="middle" fontSize="11" fill="oklch(60% 0.02 155)">
              {new Date(d.day).getDate()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FantasyPlay({ leagues, childrenList, tier, onChange }: {
  leagues: League[]; childrenList: Child[]; tier?: string; onChange: () => void;
}) {
  const [board, setBoard] = useState<Board | null>(null);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const [form, setForm] = useState<'create' | 'join' | null>(null);
  const [copied, setCopied] = useState(false);
  const locked = !tier || tier === 'semilla';

  useEffect(() => {
    if (activeLeague) api<Board>(`/leagues/${activeLeague}/leaderboard`).then(setBoard);
  }, [activeLeague]);
  useEffect(() => {
    if (!activeLeague && leagues.length) setActiveLeague(leagues[0].id);
  }, [leagues, activeLeague]);

  async function submitCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('name') as string;
    await api('/leagues', { method: 'POST', body: JSON.stringify({ name }) });
    setForm(null);
    onChange();
  }
  async function submitJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api('/leagues/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode: (fd.get('code') as string).toUpperCase(), childId: fd.get('childId') }),
    });
    setForm(null);
    onChange();
  }
  const current = leagues.find((l) => l.id === activeLeague);

  return (
    <section className="mt-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-700 text-ink">Fantasy Play</h2>
          <p className="mt-1 text-sm text-mist">Ligas familiares privadas. Compiten los logros, nunca las identidades.</p>
        </div>
        {!locked && (
          <div className="flex gap-3">
            <button onClick={() => setForm(form === 'create' ? null : 'create')} className="rounded-full bg-coral px-5 py-2.5 text-sm font-700 text-paper transition-transform ease-out-quint hover:scale-105">
              Crear liga
            </button>
            <button onClick={() => setForm(form === 'join' ? null : 'join')} className="rounded-full bg-cream px-5 py-2.5 text-sm font-700 text-ink hover:bg-pine-soft">
              Tengo un código
            </button>
          </div>
        )}
      </div>

      {locked ? (
        <div className="mt-6 rounded-blob bg-cream px-8 py-10">
          <p className="max-w-[55ch] font-600 text-ink">
            🔒 Fantasy Play vive en los planes Brote y Bosque. Invita a primos y amigos: sus avatares
            compiten en retos de matemáticas y lectura mientras los nombres reales se quedan en casa.
          </p>
        </div>
      ) : (
        <>
          {form === 'create' && (
            <form onSubmit={submitCreate} className="mt-6 flex flex-wrap gap-3">
              <input name="name" required minLength={3} maxLength={50} placeholder="Nombre de la liga (ej. Primos 2026)"
                className="min-w-64 flex-1 rounded-full border border-pine-soft bg-paper px-5 py-3 outline-none focus:border-pine" />
              <button className="rounded-full bg-pine-deep px-6 py-3 font-700 text-paper">Crear</button>
            </form>
          )}
          {form === 'join' && (
            <form onSubmit={submitJoin} className="mt-6 flex flex-wrap gap-3">
              <input name="code" required minLength={8} maxLength={8} placeholder="CÓDIGO"
                className="w-40 rounded-full border border-pine-soft bg-paper px-5 py-3 font-mono uppercase tracking-widest outline-none focus:border-pine" />
              <select name="childId" required className="rounded-full border border-pine-soft bg-paper px-5 py-3 outline-none">
                {childrenList.map((c) => <option key={c.id} value={c.id}>{c.alias}</option>)}
              </select>
              <button className="rounded-full bg-pine-deep px-6 py-3 font-700 text-paper">Unirme</button>
            </form>
          )}

          {leagues.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {leagues.map((l) => (
                <button key={l.id} onClick={() => setActiveLeague(l.id)}
                  className={`rounded-full px-4 py-2 text-sm font-700 ${activeLeague === l.id ? 'bg-ink text-paper' : 'bg-cream text-ink'}`}>
                  {l.name}
                </button>
              ))}
              {current?.is_owner && (
                <button
                  onClick={() => { navigator.clipboard.writeText(current.invite_code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="ml-auto rounded-full bg-sun-soft px-4 py-2 font-mono text-sm font-700 tracking-widest text-ink">
                  {copied ? '¡Copiado!' : `${current.invite_code} ⧉`}
                </button>
              )}
            </div>
          )}

          {board && (
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <ol>
                {board.leaderboard.map((r) => (
                  <li key={r.alias} className={`flex items-center gap-4 border-b border-cream px-3 py-3.5 ${r.is_mine ? 'rounded-2xl bg-sun-soft' : ''}`}>
                    <span className="w-6 font-display text-lg font-700 text-mist">{r.rank}</span>
                    <span className="text-2xl" aria-hidden>{avatarEmoji(r.avatar_seed)}</span>
                    <span className="font-600 text-ink">{r.alias}{r.is_mine && <span className="ml-2 text-xs font-700 text-coral">tu peque</span>}</span>
                    <span className="ml-auto text-sm text-mist">P{r.percentile}</span>
                    <span className="w-16 text-right font-display text-lg font-700 text-pine">{r.points}</span>
                  </li>
                ))}
              </ol>
              <aside>
                <h3 className="text-sm font-700 uppercase tracking-wide text-mist">La liga junta</h3>
                <p className="mt-3 font-display text-5xl font-800 text-ink">{board.collective.totalPoints}<span className="text-lg text-mist"> gemas</span></p>
                <p className="text-sm text-mist">{board.collective.totalMissions} misiones completadas entre todos</p>
                {board.collective.milestones.map((m) => (
                  <p key={m.label} className="mt-4 rounded-2xl bg-pine-soft px-4 py-3 text-sm font-700 text-pine-deep">{m.label}</p>
                ))}
              </aside>
            </div>
          )}
        </>
      )}
    </section>
  );
}
