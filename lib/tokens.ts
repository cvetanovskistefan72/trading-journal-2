import crypto from "crypto";

/**
 * Generate a cryptographically-random password-reset token.
 * Returns { raw, hashed } — email the raw one, store the hashed one.
 */
export function generateResetToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hashed = hashToken(raw);
  return { raw, hashed };
}

/** SHA-256 the token so a DB dump can't be used to hijack accounts. */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
