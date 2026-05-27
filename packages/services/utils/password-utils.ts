import crypto from "node:crypto";

import { env } from "../env";

const SALT_BYTES = 32;

export function generateSalt(): string {
    return crypto.randomBytes(SALT_BYTES).toString("hex");
}

export function hashPassword(salt: string, password: string): string {
    return crypto.createHmac(env.HASHING_ALGORITHM, salt).update(password).digest("hex");
}

/**
 * Constant-time comparison of a candidate plaintext password against a
 * previously stored (salt, hash) pair. Returns false (instead of throwing)
 * for any malformed input so callers can use it in a simple if-check.
 */
export function verifyPassword(
    salt: string,
    storedHash: string,
    candidatePassword: string,
): boolean {
    try {
        const candidateHash = hashPassword(salt, candidatePassword);
        const a = Buffer.from(candidateHash, "hex");
        const b = Buffer.from(storedHash, "hex");
        if (a.length === 0 || a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}
