import Link from 'next/link';

const STEPS = [
  { n: '01', title: 'Tú tienes la cuenta', body: 'Registro con consentimiento parental verificable. Tus datos viven cifrados con AES-256-GCM; los de tu hijo, simplemente no existen.' },
  { n: '02', title: 'Tu hijo recibe una identidad de juego', body: 'El sistema genera un alias y un avatar: "Delfín Brillante 39". Sin nombre real, sin foto, sin nada que rastrear. Anonimidad por arquitectura.' },
  { n: '03', title: 'Aprende jugando, tú ves el progreso', body: 'Misiones de matemáticas, lectura y lógica que suman gemas. Tú ves métricas de desarrollo cognitivo y controlas el tiempo de pantalla al minuto.' },
];

const TIERS = [
  { name: 'Semilla', price: '4.99', tagline: 'Para empezar', features: ['1 perfil infantil', 'Juegos base curados', 'Reporte semanal', 'Límites de tiempo'], featured: false },
  { name: 'Brote', price: '9.99', tagline: 'El favorito de las familias', features: ['3 perfiles infantiles', 'Catálogo completo', 'Fantasy Play: ligas entre familias', 'Métricas de desarrollo cognitivo'], featured: true },
  { name: 'Bosque', price: '14.99', tagline: 'Para familias grandes', features: ['6 perfiles infantiles', 'Todo lo de Brote', 'Contenido sin conexión', 'Soporte prioritario'], featured: false },
];

const BOARD = [
  { rank: 1, avatar: '🦊', alias: 'Zorro Valiente 17', points: 340, mine: false },
  { rank: 2, avatar: '🐬', alias: 'Delfín Brillante 39', points: 315, mine: true },
  { rank: 3, avatar: '🦉', alias: 'Búho Curioso 82', points: 290, mine: false },
  { rank: 4, avatar: '🐼', alias: 'Panda Estelar 55', points: 244, mine: false },
];

export default function Landing() {
  return (
    <main>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-2xl font-800 tracking-tight text-pine-deep">kiddoki</span>
        <div className="flex items-center gap-6">
          <Link href="/parent" className="text-sm font-600 text-mist hover:text-ink">Entrar</Link>
          <Link href="/parent" className="rounded-full bg-pine-deep px-5 py-2.5 text-sm font-700 text-paper transition-transform ease-out-quint hover:scale-105">
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="rise mb-5 inline-block rounded-full bg-sun-soft px-4 py-1.5 text-sm font-700 text-ink">
            COPPA y GDPR-K de nacimiento, no de parche
          </p>
          <h1 className="rise font-display text-5xl font-800 leading-[1.04] tracking-tight text-ink text-balance sm:text-7xl">
            Aprender jugando.
            <br />
            <span className="text-pine">Anónimo</span> por diseño.
          </h1>
          <p className="rise rise-2 mt-6 max-w-[58ch] text-lg leading-relaxed text-mist">
            Kiddoki es la plataforma educativa donde los niños de 1 a 11 años juegan, compiten y crecen
            sin exponer jamás su nombre, su cara ni sus datos. Los padres ven todo. Internet no ve nada.
          </p>
          <div className="rise rise-3 mt-9 flex flex-wrap items-center gap-4">
            <Link href="/parent" className="rounded-full bg-coral px-7 py-3.5 font-700 text-paper transition-transform ease-out-quint hover:scale-105">
              Prueba 14 días gratis
            </Link>
            <Link href="/kid" className="font-700 text-pine underline decoration-2 underline-offset-4 hover:text-pine-deep">
              Ver el mundo del niño
            </Link>
          </div>
        </div>

        {/* Anonymity transformation visual */}
        <figure className="rise rise-2 relative">
          <div className="rounded-blob bg-cream p-8">
            <div className="flex items-center gap-4 rounded-2xl bg-paper p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lago-soft text-xs font-700 text-mist">foto</div>
              <div>
                <div className="h-3 w-28 rounded bg-lago-soft" aria-hidden />
                <div className="mt-2 h-2.5 w-40 rounded bg-cream" aria-hidden />
              </div>
              <span className="ml-auto text-xs font-700 uppercase tracking-wide text-coral">nunca entra</span>
            </div>
            <div className="my-4 text-center font-display text-2xl text-pine" aria-hidden>↓</div>
            <div className="flex items-center gap-4 rounded-2xl bg-pine-deep p-4 text-paper">
              <span className="text-4xl" aria-hidden>🐬</span>
              <div>
                <div className="font-kid text-lg font-700">Delfín Brillante 39</div>
                <div className="text-sm opacity-70">nivel 7 · 315 gemas</div>
              </div>
              <span className="ml-auto text-xs font-700 uppercase tracking-wide text-sun">lo único visible</span>
            </div>
          </div>
          <figcaption className="mt-3 text-center text-sm text-mist">
            La identidad real nunca toca el producto: se genera una de juego.
          </figcaption>
        </figure>
      </header>

      {/* Manifesto: drenched pine */}
      <section className="bg-pine-deep py-24 text-paper">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl font-700 leading-snug tracking-tight text-balance sm:text-5xl">
            Las plataformas infantiles prometen seguridad.
            Nosotros la hicimos <span className="text-sun">imposible de romper</span>:
            no guardamos lo que no existe.
          </h2>
          <div className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-3">
            <div>
              <p className="font-display text-4xl font-800 text-sun">0</p>
              <p className="mt-1 text-sm leading-relaxed opacity-80">nombres, fotos o datos reales de niños en toda la base de datos</p>
            </div>
            <div>
              <p className="font-display text-4xl font-800 text-sun">AES-256</p>
              <p className="mt-1 text-sm leading-relaxed opacity-80">cifrado de los datos del padre, la única PII del sistema</p>
            </div>
            <div>
              <p className="font-display text-4xl font-800 text-sun">100%</p>
              <p className="mt-1 text-sm leading-relaxed opacity-80">de las funciones sociales operan sobre alias generados</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: editorial numbered, alternating */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-4xl font-800 tracking-tight text-ink">Cómo funciona</h2>
        <div className="mt-14 space-y-16">
          {STEPS.map((s, i) => (
            <article key={s.n} className={`flex flex-col gap-6 sm:flex-row sm:items-baseline sm:gap-12 ${i % 2 ? 'sm:flex-row-reverse sm:text-right' : ''}`}>
              <span className="font-display text-7xl font-800 text-pine-soft" aria-hidden>{s.n}</span>
              <div className="max-w-xl">
                <h3 className="font-display text-2xl font-700 text-ink">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-mist">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Fantasy Play */}
      <section className="bg-cream py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full bg-coral-soft px-4 py-1.5 text-sm font-700 text-coral">Exclusivo de Kiddoki</p>
            <h2 className="font-display text-4xl font-800 leading-tight tracking-tight text-ink text-balance">
              Fantasy Play: la liga donde compiten los logros, no las identidades
            </h2>
            <p className="mt-5 max-w-[55ch] leading-relaxed text-mist">
              Los padres crean ligas privadas con códigos seguros e invitan a otras familias.
              Los niños compiten por resolver retos de matemáticas y completar lecturas,
              visibles solo como sus avatares. Percentiles, hitos colectivos y celebración
              compartida: presión social cero, motivación real.
            </p>
            <ul className="mt-7 space-y-3 text-sm font-600 text-ink">
              <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-coral" aria-hidden />Códigos de invitación rotables de un solo uso</li>
              <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-coral" aria-hidden />Tablas por logros educativos, nunca por tiempo de pantalla</li>
              <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-coral" aria-hidden />Hitos colectivos: la liga entera gana junta</li>
            </ul>
          </div>
          <div className="rounded-blob bg-paper p-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h3 className="font-display text-xl font-700 text-ink">Liga Exploradores</h3>
              <span className="text-sm font-600 text-mist">semana 3 de 4</span>
            </div>
            <ol className="space-y-2">
              {BOARD.map((r) => (
                <li key={r.rank} className={`flex items-center gap-4 rounded-2xl px-4 py-3 ${r.mine ? 'bg-sun-soft' : ''}`}>
                  <span className="w-5 font-display text-lg font-700 text-mist">{r.rank}</span>
                  <span className="text-2xl" aria-hidden>{r.avatar}</span>
                  <span className="font-600 text-ink">{r.alias}</span>
                  <span className="ml-auto font-display font-700 text-pine">{r.points}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-2xl bg-pine-soft px-4 py-3 text-center text-sm font-700 text-pine-deep">
              🎉 ¡La liga superó 1,000 gemas juntas!
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-4xl font-800 tracking-tight text-ink">Un precio por familia, no por niño</h2>
        <p className="mt-3 max-w-[60ch] text-mist">Tres niveles, cancelación en un clic, 14 días de prueba en todos.</p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-center">
          {TIERS.map((t) => (
            <div key={t.name} className={t.featured
              ? 'rounded-blob bg-pine-deep p-9 text-paper lg:py-12'
              : 'rounded-blob bg-cream p-8'}>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl font-700">{t.name}</h3>
                <p className={`text-sm font-600 ${t.featured ? 'text-sun' : 'text-coral'}`}>{t.tagline}</p>
              </div>
              <p className="mt-4 font-display text-5xl font-800">
                ${t.price}<span className="text-base font-500 opacity-60"> /mes</span>
              </p>
              <ul className={`mt-6 space-y-2.5 text-sm ${t.featured ? 'opacity-90' : 'text-mist'}`}>
                {t.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <Link href="/parent" className={`mt-8 block rounded-full py-3 text-center font-700 transition-transform ease-out-quint hover:scale-105 ${
                t.featured ? 'bg-sun text-ink' : 'bg-ink text-paper'}`}>
                Empezar con {t.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-mist">
          <span className="font-display text-lg font-800 text-pine-deep">kiddoki</span>
          <p>Cumplimiento COPPA y GDPR-K · Cifrado AES-256-GCM · Hecho para familias</p>
        </div>
      </footer>
    </main>
  );
}
