import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hashes a password using scrypt with a random salt.
 * Returns a string in the format "salt:hash" (both hex-encoded).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored hash.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const computedHash = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(hash, 'hex'), computedHash);
  } catch {
    return false;
  }
}
