/**
 * Password hashing using the Web Crypto API (built into Node 18+).
 * No external dependency needed — works in both Node and edge runtimes.
 *
 * Uses PBKDF2-SHA256 with 100,000 iterations — OWASP minimum recommendation.
 * Format stored in DB:  pbkdf2$<iterations>$<salt_hex>$<hash_hex>
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // 256 bits
const ALGO = "SHA-256";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: ALGO },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const saltHex = Buffer.from(salt).toString("hex");
  const hashHex = Buffer.from(hashBuffer).toString("hex");
  return `pbkdf2$${ITERATIONS}$${saltHex}$${hashHex}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = parseInt(parts[1], 10);
  const salt = Buffer.from(parts[2], "hex");
  const storedHash = parts[3];

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: ALGO },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const hashHex = Buffer.from(hashBuffer).toString("hex");

  // Constant-time compare to prevent timing attacks
  return timingSafeEqual(hashHex, storedHash);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
