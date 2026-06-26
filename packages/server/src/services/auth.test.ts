import { describe, expect, it } from "vitest";
import { createMemoryDb } from "../db/memory.js";
import type { Db } from "../db/index.js";
import {
  generateToken,
  hashToken,
  issueToken,
  revokeToken,
  verifyToken,
} from "./auth.js";

async function seedUser(db: Db, id = "u1", username = "et") {
  await db.query(
    "INSERT INTO users (id, username, created_at) VALUES ($1, $2, $3)",
    [id, username, 1700000000000],
  );
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
  it("persists only the hash, never the raw token", async () => {
    const db = await createMemoryDb();
    await seedUser(db);
    const { token } = await issueToken(db, "u1");
    const { rows } = await db.query("SELECT token_hash FROM auth_tokens");
    expect(rows[0].token_hash).toBe(hashToken(token));
    expect(rows[0].token_hash).not.toBe(token);
  });

  it("verifies a valid token and returns its user", async () => {
    const db = await createMemoryDb();
    await seedUser(db);
    const { token } = await issueToken(db, "u1");
    const result = await verifyToken(db, token);
    expect(result?.user.username).toBe("et");
    expect(result?.user.id).toBe("u1");
  });

  it("returns null for an unknown token", async () => {
    const db = await createMemoryDb();
    expect(await verifyToken(db, "dunbar_pat_nope")).toBe(null);
  });

  it("records last_used_at on verification", async () => {
    const db = await createMemoryDb();
    await seedUser(db);
    const { token } = await issueToken(db, "u1");
    await verifyToken(db, token);
    const { rows } = await db.query("SELECT last_used_at FROM auth_tokens");
    expect(rows[0].last_used_at).not.toBe(null);
  });

  it("rejects a revoked token", async () => {
    const db = await createMemoryDb();
    await seedUser(db);
    const { token } = await issueToken(db, "u1");
    await revokeToken(db, token);
    expect(await verifyToken(db, token)).toBe(null);
  });
});
