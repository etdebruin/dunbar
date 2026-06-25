import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { PublicUser } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { findUserById } from "../repos/users.js";

const TOKEN_PREFIX = "dunbar_pat_";

/** Generate a fresh, opaque personal-access token. The raw value is shown once. */
export function generateToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

/** Hash a raw token for storage/lookup. We never persist the raw value. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface IssuedToken {
  id: string;
  token: string;
}

/** Mint a token for a user and store only its hash. Returns the raw token. */
export function issueToken(db: Db, userId: string, name?: string): IssuedToken {
  const id = randomUUID();
  const token = generateToken();
  db.prepare(
    "INSERT INTO auth_tokens (id, user_id, token_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, userId, hashToken(token), name ?? null, Date.now());
  return { id, token };
}

export interface VerifiedToken {
  user: PublicUser;
  tokenId: string;
}

/**
 * Resolve a raw bearer token to its user. Returns null when the token is
 * unknown or revoked. Updates `last_used_at` as a side effect.
 */
export function verifyToken(db: Db, raw: string): VerifiedToken | null {
  const row = db
    .prepare(
      "SELECT id, user_id FROM auth_tokens WHERE token_hash = ? AND revoked_at IS NULL",
    )
    .get(hashToken(raw)) as { id: string; user_id: string } | undefined;
  if (!row) return null;

  const user = findUserById(db, row.user_id);
  if (!user) return null;

  db.prepare("UPDATE auth_tokens SET last_used_at = ? WHERE id = ?").run(
    Date.now(),
    row.id,
  );
  return { user, tokenId: row.id };
}

/** Revoke a token by its raw value (idempotent). */
export function revokeToken(db: Db, raw: string): void {
  db.prepare(
    "UPDATE auth_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
  ).run(Date.now(), hashToken(raw));
}
