import argon2 from "argon2";

/**
 * Password hashing — the only place plaintext passwords are ever processed.
 *
 * Argon2id with OWASP-recommended minimums (19 MiB memory, 2 iterations,
 * 1 lane). The encoded PHC string carries salt and parameters, so no separate
 * salt column is needed. Hashes never leave this module; nothing here is ever
 * serialized into an API response.
 */

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Malformed stored hash must fail closed, never throw into the request.
    return false;
  }
}

/** True when the stored hash was produced with weaker parameters than current. */
export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, HASH_OPTIONS);
}
