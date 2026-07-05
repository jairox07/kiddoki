// Thin API client. Token in localStorage (MVP); move to httpOnly cookie for prod.
const BASE = '/api';

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kiddoki_token') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw Object.assign(new Error(`API ${res.status}`), { status: res.status, body: await res.json().catch(() => null) });
  return res.json();
}

// Deterministic avatar from seed — no photos ever (COPPA).
export function avatarEmoji(seed: string): string {
  const ANIMALS = ['🦊', '🦉', '🐬', '🐼', '🐦', '🐯', '🐨', '🐲'];
  return ANIMALS[parseInt(seed.slice(0, 2), 16) % ANIMALS.length];
}
