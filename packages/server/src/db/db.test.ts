import { describe, expect, it } from "vitest";
import { createMemoryDb } from "./memory.js";

describe("createMemoryDb / migrate", () => {
  it("creates all core tables", async () => {
    const db = await createMemoryDb();
    for (const t of ["users", "auth_tokens", "posts", "follows"]) {
      // throws if the table doesn't exist
      await expect(
        db.query(`SELECT * FROM ${t} LIMIT 0`),
      ).resolves.toBeTruthy();
    }
  });

  it("round-trips a user", async () => {
    const db = await createMemoryDb();
    await db.query(
      "INSERT INTO users (id, username, display_name, bio, created_at) VALUES ($1, $2, $3, $4, $5)",
      ["u1", "et", "Et", null, 1700000000000],
    );
    const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [
      "u1",
    ]);
    expect(rows[0].username).toBe("et");
    expect(rows[0].display_name).toBe("Et");
    expect(rows[0].bio).toBe(null);
  });

  it("stores big timestamps without truncation", async () => {
    const db = await createMemoryDb();
    const ts = 1782427918503;
    await db.query(
      "INSERT INTO users (id, username, created_at) VALUES ($1, $2, $3)",
      ["u1", "et", ts],
    );
    const { rows } = await db.query("SELECT created_at FROM users");
    expect(Number(rows[0].created_at)).toBe(ts);
  });

  it("enforces unique usernames", async () => {
    const db = await createMemoryDb();
    await db.query(
      "INSERT INTO users (id, username, created_at) VALUES ($1, $2, $3)",
      ["u1", "et", 1],
    );
    await expect(
      db.query(
        "INSERT INTO users (id, username, created_at) VALUES ($1, $2, $3)",
        ["u2", "et", 2],
      ),
    ).rejects.toThrow();
  });

  it("rejects a self-follow via CHECK constraint", async () => {
    const db = await createMemoryDb();
    await db.query(
      "INSERT INTO users (id, username, created_at) VALUES ($1, $2, $3)",
      ["u1", "et", 1],
    );
    await expect(
      db.query(
        "INSERT INTO follows (follower_id, followee_id, created_at) VALUES ($1, $2, $3)",
        ["u1", "u1", 1],
      ),
    ).rejects.toThrow();
  });

  it("cascades token deletion when a user is removed", async () => {
    const db = await createMemoryDb();
    await db.query(
      "INSERT INTO users (id, username, created_at) VALUES ($1, $2, $3)",
      ["u1", "et", 1],
    );
    await db.query(
      "INSERT INTO auth_tokens (id, user_id, token_hash, created_at) VALUES ($1, $2, $3, $4)",
      ["t1", "u1", "hash", 1],
    );
    await db.query("DELETE FROM users WHERE id = $1", ["u1"]);
    const { rows } = await db.query("SELECT COUNT(*) AS n FROM auth_tokens");
    expect(Number(rows[0].n)).toBe(0);
  });
});
