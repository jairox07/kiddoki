// Micro-reward audio: tiny WebAudio synth, no assets. Mute persists in localStorage.
let ctx: AudioContext | null = null;

export function soundEnabled(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('kiddoki_sound') !== 'off';
}
export function toggleSound(): boolean {
  const next = !soundEnabled();
  localStorage.setItem('kiddoki_sound', next ? 'on' : 'off');
  return next;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur);
}

export function play(kind: 'correct' | 'retry' | 'win' | 'chest') {
  if (!soundEnabled()) return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  if (kind === 'correct') { tone(660, 0, 0.12); tone(880, 0.1, 0.18); }
  else if (kind === 'retry') { tone(330, 0, 0.2, 'triangle', 0.07); }
  else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25)); }
  else { tone(392, 0, 0.1); tone(523, 0.1, 0.1); tone(659, 0.2, 0.1); tone(784, 0.3, 0.3); }
}
