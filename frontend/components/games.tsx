'use client';
// Six game engines, config-driven. Each reports {correct, total} to onFinish.
// Feedback is always positive-framed (growth mindset): errors teach, never punish.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type GameResult = { correct: number; total: number };
type GameProps = { config: Record<string, unknown>; onFinish: (r: GameResult) => void };

const CHEERS = ['¡Muy bien!', '¡Genial!', '¡Lo lograste!', '¡Increíble!', '¡Sigue así!'];
const NUDGES = ['¡Casi! Intenta otra vez', 'Mira bien y prueba de nuevo', '¡Tú puedes!'];
const cheer = () => CHEERS[Math.floor(Math.random() * CHEERS.length)];
const nudge = () => NUDGES[Math.floor(Math.random() * NUDGES.length)];
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
const rand = (n: number) => Math.floor(Math.random() * n);

function Feedback({ kind, text }: { kind: 'good' | 'retry'; text: string }) {
  return (
    <p role="status" className={`pop rounded-blob px-6 py-3 text-center text-xl font-700 ${
      kind === 'good' ? 'bg-pine-soft text-pine-deep' : 'bg-sun-soft text-ink'}`}>
      {text}
    </p>
  );
}

function Options({ choices, onPick, disabled, render }: {
  choices: (string | number)[]; onPick: (c: string | number) => void; disabled: boolean;
  render?: (c: string | number) => ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {choices.map((c, i) => (
        <button key={`${c}-${i}`} onClick={() => onPick(c)} disabled={disabled}
          className="min-w-20 rounded-blob bg-paper px-7 py-4 text-3xl font-700 text-ink transition-transform ease-out-quint hover:scale-105 active:scale-95 disabled:opacity-60">
          {render ? render(c) : c}
        </button>
      ))}
    </div>
  );
}

// ============ 1. count-tap: one-to-one correspondence + subitizing (early math) ============
export function CountTap({ config, onFinish }: GameProps) {
  const rounds = (config.rounds as number) ?? 4;
  const max = (config.max as number) ?? 5;
  const items = (config.items as string[]) ?? ['🍎'];
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [fb, setFb] = useState<{ kind: 'good' | 'retry'; text: string } | null>(null);
  const target = useMemo(() => 1 + rand(max), [round, max]);
  const item = useMemo(() => items[rand(items.length)], [round, items]);
  const choices = useMemo(() => {
    const set = new Set([target]);
    while (set.size < 3) set.add(Math.max(1, target + (rand(5) - 2)));
    return shuffle([...set]);
  }, [target]);

  function pick(n: string | number) {
    const ok = n === target;
    setFb({ kind: ok ? 'good' : 'retry', text: ok ? cheer() : nudge() });
    if (ok) {
      if (tapped.size === target) setCorrect((c) => c + 1); // counted every one first: full credit
      setTimeout(() => {
        setFb(null); setTapped(new Set());
        round + 1 >= rounds ? onFinish({ correct: correct + (tapped.size === target ? 1 : 0), total: rounds }) : setRound(round + 1);
      }, 1100);
    }
  }

  return (
    <div className="space-y-8 text-center">
      <p className="text-2xl font-700 text-ink">Toca cada uno para contarlos. ¿Cuántos hay?</p>
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: target }).map((_, i) => (
          <button key={i} onClick={() => setTapped(new Set(tapped).add(i))}
            className={`relative rounded-full p-3 text-6xl transition-transform ease-out-quint active:scale-90 ${tapped.has(i) ? 'bg-sun-soft' : ''}`}>
            <span aria-hidden>{item}</span>
            {tapped.has(i) && <span className="absolute -right-1 -top-1 rounded-full bg-pine px-2 text-sm font-700 text-paper">{[...tapped].indexOf(i) + 1}</span>}
          </button>
        ))}
      </div>
      {fb ? <Feedback {...fb} /> : <Options choices={choices} onPick={pick} disabled={false} />}
      <p className="text-sm text-mist">Ronda {round + 1} de {rounds}</p>
    </div>
  );
}

// ============ 2. memory-pairs: working memory (executive function) ============
export function MemoryPairs({ config, onFinish }: GameProps) {
  const pairs = (config.pairs as number) ?? 4;
  const emojis = (config.emojis as string[]) ?? ['🐮', '🐷', '🐔', '🐴'];
  const deck = useMemo(() => shuffle(shuffle(emojis).slice(0, pairs).flatMap((e) => [e, e])), [pairs, emojis]);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const attempts = useRef(0);

  function flip(i: number) {
    if (open.length === 2 || open.includes(i) || found.has(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      attempts.current += 1;
      const [a, b] = next;
      if (deck[a] === deck[b]) {
        const nf = new Set(found).add(a).add(b);
        setTimeout(() => {
          setFound(nf); setOpen([]);
          if (nf.size === deck.length) {
            onFinish({ correct: Math.min(pairs, Math.max(1, pairs * 2 - attempts.current)), total: pairs });
          }
        }, 500);
      } else {
        setTimeout(() => setOpen([]), 900);
      }
    }
  }

  const cols = deck.length <= 8 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-6';
  return (
    <div className="space-y-6 text-center">
      <p className="text-2xl font-700 text-ink">Encuentra las parejas</p>
      <div className={`grid ${cols} mx-auto max-w-md gap-3`}>
        {deck.map((e, i) => {
          const up = open.includes(i) || found.has(i);
          return (
            <button key={i} onClick={() => flip(i)} aria-label={up ? e : 'carta oculta'}
              className={`aspect-square rounded-2xl text-4xl transition-transform ease-out-quint active:scale-90 ${
                found.has(i) ? 'bg-pine-soft' : up ? 'bg-paper' : 'bg-lago text-transparent'}`}>
              {up ? e : '?'}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-mist">{found.size / 2} de {pairs} parejas</p>
    </div>
  );
}

// ============ 3. pattern: AB/ABC sequences + numeric series (reasoning) ============
export function Pattern({ config, onFinish }: GameProps) {
  const rounds = (config.rounds as number) ?? 4;
  const kind = (config.kind as string) ?? 'AB';
  const tokens = (config.tokens as string[]) ?? ['🔴', '🔵', '🟡'];
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [fb, setFb] = useState<{ kind: 'good' | 'retry'; text: string } | null>(null);

  const puzzle = useMemo(() => {
    if (kind === 'numeric') {
      const start = 1 + rand(10);
      const step = 2 + rand(4);
      const seq = Array.from({ length: 4 }, (_, i) => start + i * step);
      const answer = start + 4 * step;
      const opts = shuffle([answer, answer + step, answer - 1]);
      return { seq: seq.map(String), answer: String(answer), opts: opts.map(String) };
    }
    const unit = shuffle(tokens).slice(0, kind === 'ABC' ? 3 : 2);
    const seq = Array.from({ length: kind === 'ABC' ? 6 : 5 }, (_, i) => unit[i % unit.length]);
    const answer = unit[seq.length % unit.length];
    const opts = shuffle([...new Set([answer, ...shuffle(tokens)])].slice(0, 3));
    return { seq, answer, opts };
  }, [round, kind, tokens]);

  function pick(c: string | number) {
    const ok = c === puzzle.answer;
    if (ok) setCorrect((n) => n + 1);
    setFb({ kind: ok ? 'good' : 'retry', text: ok ? cheer() : `La respuesta era ${puzzle.answer}. ¡A la siguiente!` });
    setTimeout(() => {
      setFb(null);
      round + 1 >= rounds ? onFinish({ correct: correct + (ok ? 1 : 0), total: rounds }) : setRound(round + 1);
    }, 1200);
  }

  return (
    <div className="space-y-8 text-center">
      <p className="text-2xl font-700 text-ink">¿Qué sigue en la serie?</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-5xl">
        {puzzle.seq.map((t, i) => <span key={i}>{t}</span>)}
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-dashed border-mist text-3xl text-mist">?</span>
      </div>
      {fb ? <Feedback {...fb} /> : <Options choices={puzzle.opts} onPick={pick} disabled={false} />}
      <p className="text-sm text-mist">Ronda {round + 1} de {rounds}</p>
    </div>
  );
}

// ============ 4. math-blocks: CRA method, visual quantities before symbols ============
export function MathBlocks({ config, onFinish }: GameProps) {
  const rounds = (config.rounds as number) ?? 5;
  const op = (config.op as string) ?? 'add';
  const max = (config.max as number) ?? 10;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [fb, setFb] = useState<{ kind: 'good' | 'retry'; text: string } | null>(null);

  const prob = useMemo(() => {
    let a: number, b: number, ans: number, sym: string;
    if (op === 'mul') { a = 2 + rand(Math.min(9, max - 1)); b = 2 + rand(8); ans = a * b; sym = '×'; }
    else if (op === 'sub') { a = 2 + rand(max - 1); b = 1 + rand(a - 1); ans = a - b; sym = '−'; }
    else { a = 1 + rand(max - 1); b = 1 + rand(Math.max(1, max - a)); ans = a + b; sym = '+'; }
    const opts = new Set([ans]);
    while (opts.size < 3) opts.add(Math.max(0, ans + (rand(7) - 3)));
    return { a, b, ans, sym, opts: shuffle([...opts]) };
  }, [round, op, max]);

  const visual = op !== 'mul' && prob.a <= 10 && prob.b <= 10;

  function pick(c: string | number) {
    const ok = c === prob.ans;
    if (ok) setCorrect((n) => n + 1);
    setFb({ kind: ok ? 'good' : 'retry', text: ok ? cheer() : `Era ${prob.ans}. ¡La próxima la tienes!` });
    setTimeout(() => {
      setFb(null);
      round + 1 >= rounds ? onFinish({ correct: correct + (ok ? 1 : 0), total: rounds }) : setRound(round + 1);
    }, 1200);
  }

  return (
    <div className="space-y-8 text-center">
      <p className="font-display text-5xl font-800 text-ink">{prob.a} {prob.sym} {prob.b} = ?</p>
      {visual && (
        <div className="flex justify-center gap-8" aria-hidden>
          <div className="flex max-w-40 flex-wrap justify-center gap-1.5">
            {Array.from({ length: prob.a }).map((_, i) => <span key={i} className="h-6 w-6 rounded-md bg-lago" />)}
          </div>
          <div className="flex max-w-40 flex-wrap justify-center gap-1.5">
            {Array.from({ length: prob.b }).map((_, i) => <span key={i} className={`h-6 w-6 rounded-md ${op === 'sub' ? 'bg-coral opacity-50' : 'bg-coral'}`} />)}
          </div>
        </div>
      )}
      {fb ? <Feedback {...fb} /> : <Options choices={prob.opts} onPick={pick} disabled={false} />}
      <p className="text-sm text-mist">Ronda {round + 1} de {rounds}</p>
    </div>
  );
}

// ============ 5. word-builder: phonological awareness, syllable assembly ============
export function WordBuilder({ config, onFinish }: GameProps) {
  const words = (config.words as { word: string; syllables: string[]; emoji: string }[]) ?? [];
  const [idx, setIdx] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [mistake, setMistake] = useState(false);
  const [errors, setErrors] = useState(0);
  const [fb, setFb] = useState<string | null>(null);
  const w = words[idx];
  const pool = useMemo(() => shuffle(w?.syllables.map((s, i) => ({ s, i })) ?? []), [idx, w]);
  const [used, setUsed] = useState<Set<number>>(new Set());

  if (!w) return null;

  function tap(s: string, i: number) {
    if (used.has(i)) return;
    if (s === w.syllables[built.length]) {
      const nb = [...built, s];
      setBuilt(nb);
      setUsed(new Set(used).add(i));
      setMistake(false);
      if (nb.length === w.syllables.length) {
        setFb(cheer());
        setTimeout(() => {
          setFb(null); setBuilt([]); setUsed(new Set());
          idx + 1 >= words.length
            ? onFinish({ correct: Math.max(1, words.length - errors), total: words.length })
            : setIdx(idx + 1);
        }, 1300);
      }
    } else {
      setMistake(true);
      setErrors((e) => e + 1);
      setTimeout(() => setMistake(false), 700);
    }
  }

  return (
    <div className="space-y-8 text-center">
      <p className="text-2xl font-700 text-ink">Arma la palabra con sus sílabas</p>
      <div className="text-7xl" aria-hidden>{w.emoji}</div>
      <div className="flex justify-center gap-2" aria-label={`palabra de ${w.syllables.length} sílabas`}>
        {w.syllables.map((s, i) => (
          <span key={i} className={`flex h-14 min-w-16 items-center justify-center rounded-2xl px-3 text-2xl font-700 ${
            built[i] ? 'bg-pine-soft text-pine-deep' : 'border-4 border-dashed border-mist text-transparent'}`}>
            {built[i] ?? s}
          </span>
        ))}
      </div>
      {fb ? <Feedback kind="good" text={`${fb} ${w.word}`} /> : (
        <div className={`flex flex-wrap justify-center gap-3 ${mistake ? 'animate-pulse' : ''}`}>
          {pool.map(({ s, i }) => (
            <button key={i} onClick={() => tap(s, i)} disabled={used.has(i)}
              className="rounded-blob bg-paper px-6 py-3.5 text-2xl font-700 text-ink transition-transform ease-out-quint hover:scale-105 active:scale-95 disabled:opacity-30">
              {s}
            </button>
          ))}
        </div>
      )}
      {mistake && <p className="text-lg font-700 text-coral">Esa va en otro lugar. ¡Escucha la palabra!</p>}
      <p className="text-sm text-mist">Palabra {idx + 1} de {words.length}</p>
    </div>
  );
}

// ============ 6. heart-scenarios: CASEL social-emotional learning ============
export function HeartScenarios({ config, onFinish }: GameProps) {
  const scenarios = (config.scenarios as { text: string; options: { text: string; good: boolean; feedback: string }[] }[]) ?? [];
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [good, setGood] = useState(0);
  const sc = scenarios[idx];
  const opts = useMemo(() => shuffle(sc?.options.map((o, i) => ({ ...o, i })) ?? []), [idx, sc]);

  if (!sc) return null;

  function next() {
    setPicked(null);
    idx + 1 >= scenarios.length
      ? onFinish({ correct: good, total: scenarios.length })
      : setIdx(idx + 1);
  }

  const chosen = picked !== null ? sc.options[picked] : null;
  return (
    <div className="space-y-8">
      <p className="text-center text-2xl font-700 leading-snug text-ink">{sc.text}</p>
      {chosen ? (
        <div className="space-y-6 text-center">
          <Feedback kind={chosen.good ? 'good' : 'retry'} text={chosen.feedback} />
          <button onClick={() => { if (chosen.good) setGood((g) => g + 1); next(); }}
            className="rounded-full bg-pine-deep px-8 py-3.5 text-xl font-700 text-paper transition-transform ease-out-quint hover:scale-105">
            Siguiente →
          </button>
        </div>
      ) : (
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {opts.map((o) => (
            <button key={o.i} onClick={() => setPicked(o.i)}
              className="rounded-blob bg-paper px-6 py-4 text-left text-xl font-700 text-ink transition-transform ease-out-quint hover:scale-[1.02] active:scale-95">
              {o.text}
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-sm text-mist">Historia {idx + 1} de {scenarios.length}</p>
    </div>
  );
}

export const GAME_ENGINES: Record<string, (p: GameProps) => ReactNode> = {
  'count-tap': (p) => <CountTap {...p} />,
  'memory-pairs': (p) => <MemoryPairs {...p} />,
  'pattern': (p) => <Pattern {...p} />,
  'math-blocks': (p) => <MathBlocks {...p} />,
  'word-builder': (p) => <WordBuilder {...p} />,
  'heart-scenarios': (p) => <HeartScenarios {...p} />,
};
