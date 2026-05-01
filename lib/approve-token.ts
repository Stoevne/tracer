/**
 * HMAC-Magic-Tokens für Approve-Links.
 *
 * Token = base64url(HMAC_SHA256(APPROVAL_SECRET, "<scope>:<id>")).
 * Constant-time-Compare beim Verify.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.APPROVAL_SECRET;
  if (!s || s.length < 16) {
    throw new Error("Missing or too-short APPROVAL_SECRET (min 16 chars)");
  }
  return s;
}

export function makeToken(scope: string, id: string): string {
  const h = createHmac("sha256", secret());
  h.update(`${scope}:${id}`);
  return h.digest("base64url");
}

export function verifyToken(scope: string, id: string, token: string): boolean {
  const expected = makeToken(scope, id);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
