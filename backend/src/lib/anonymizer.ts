// Anonymous identity generator. Children NEVER use real names or photos —
// system generates alias + deterministic avatar seed (COPPA anonymity guarantee).
import { randomBytes, randomInt } from 'node:crypto';

const ADJECTIVES = ['Azul', 'Valiente', 'Curioso', 'Veloz', 'Brillante', 'Alegre', 'Mágico', 'Estelar'];
const ANIMALS = ['Zorro', 'Búho', 'Delfín', 'Panda', 'Colibrí', 'Tigre', 'Koala', 'Dragón'];

export function generateAlias(): string {
  return `${ANIMALS[randomInt(ANIMALS.length)]} ${ADJECTIVES[randomInt(ADJECTIVES.length)]} ${randomInt(10, 99)}`;
}

export function generateAvatarSeed(): string {
  return randomBytes(8).toString('hex'); // frontend renders deterministic SVG avatar from seed
}

// Secure league invite codes — 8 chars, unambiguous alphabet.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateInviteCode(): string {
  return Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}
