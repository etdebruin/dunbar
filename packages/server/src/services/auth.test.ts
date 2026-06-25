import { describe, expect, it } from "vitest";
import { createDb } from "../db/index.js";
import {
  generateToken,
  hashToken,
  issueToken,
  revokeToken,
  verifyToken,
} from "./auth.js";

function seedUser(db: ReturnType<typeof createDb>, id = "u1", username = "et") {
  db.prepare(
    "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
  ).run(id, username, 1700000000000);
}

describe("token helpers", () => {
  it("hashes deterministically and distinctly", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("generates unique prefixed tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a.startsWith("dunbar_pat_")).toBe(true);
  });
});

describe("issueToken / verifyToken", () => {
  it("persists only the hash, never the raw token", () => {
    const db = createDb(":memory:");
    seedUser(db);
    const { token } = issueToken(db, "u1");
    const stored = db
      .prepare("SELECT token_hash FROM auth_tokens")
      .get() as { token_hash: string };
    expect(stored.token_hash).toBe(hashToken(token));
    expect(stored.token_hash).not.toBe(token);
  });

  it("verifies a valid token and returns its user", () => {
    const db = createDb(":memory:");
    seedUser(db);
    const { token } = issueToken(db, "u1");
    const result = verifyToken(db, token);
    expect(result?.user.username).toBe("et");
    expect(result?.user.id).toBe("u1");
  });

  it("returns null for an unknown token", () => {
    const db = createDb(":memory:");
    expect(verifyToken(db, "dunbar_pat_nope")).toBe(null);
  });

  it("records last_used_at on verification", () => {
    const db = createDb(":memory:");
    seedUser(db);
    const { token } = issueToken(db, "u1");
    verifyToken(db, token);
    const row = db
      .prepare("SELECT last_used_at FROM auth_tokens")
      .get() as { last_used_at: number | null };
    expect(row.last_used_at).not.toBe(null);
  });

  it("rejects a revoked token", () => {
    const db = createDb(":memory:");
    seedUser(db);
    const { token } = issueToken(db, "u1");
    revokeToken(db, token);
    expect(verifyToken(db, token)).toBe(null);
  });
});
