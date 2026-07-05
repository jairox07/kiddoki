// PII encryption for COPPA/GDPR-K compliance. AES-256-GCM, key from env.
// Format: base64(iv).base64(tag).base64(ciphertext)
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

const key = Buffer.from(config.piiKey, 'hex');

export function encryptPII(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${ct.toString('base64')}`;
}

export function decryptPII(payload: string): string {
  const [iv, tag, ct] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

// Password hashing — scrypt from stdlib, no extra dependency.
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(password, Buffer.from(salt, 'hex'), 64);
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}
