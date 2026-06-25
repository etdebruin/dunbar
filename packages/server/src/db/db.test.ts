import { describe, expect, it } from "vitest";
import { createDb } from "./index.js";

function tableNames(db: ReturnType<typeof createDb>): string[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((r) => (r as { name: string }).name);
}

describe("createDb", () => {
  it("creates all core tables", () => {
    const db = createDb(":memory:");
    const tables = tableNames(db);
    for (const t of ["users", "auth_tokens", "posts", "follows"]) {
      expect(tables).toContain(t);
    }
  });

  it("enables foreign key enforcement", () => {
    const db = createDb(":memory:");
    const row = db.prepare("PRAGMA foreign_keys").get() as {
      foreign_keys: number;
    };
    expect(row.foreign_keys).toBe(1);
  });

  it("round-trips a user", () => {
    const db = createDb(":memory:");
    db.prepare(
      "INSERT INTO users (id, username, display_name, bio, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run("u1", "et", "Et", null, 1700000000000);
    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get("u1") as Record<string, unknown>;
    expect(user.username).toBe("et");
    expect(user.display_name).toBe("Et");
    expect(user.bio).toBe(null);
  });

  it("enforces unique usernames", () => {
    const db = createDb(":memory:");
    const insert = db.prepare(
      "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
    );
    insert.run("u1", "et", 1);
    expect(() => insert.run("u2", "et", 2)).toThrow();
  });

  it("rejects a self-follow via CHECK constraint", () => {
    const db = createDb(":memory:");
    db.prepare(
      "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
    ).run("u1", "et", 1);
    expect(() =>
      db
        .prepare(
          "INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)",
        )
        .run("u1", "u1", 1),
    ).toThrow();
  });

  it("cascades token deletion when a user is removed", () => {
    const db = createDb(":memory:");
    db.prepare(
      "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
    ).run("u1", "et", 1);
    db.prepare(
      "INSERT INTO auth_tokens (id, user_id, token_hash, created_at) VALUES (?, ?, ?, ?)",
    ).run("t1", "u1", "hash", 1);
    db.prepare("DELETE FROM users WHERE id = ?").run("u1");
    const count = db
      .prepare("SELECT COUNT(*) AS n FROM auth_tokens")
      .get() as { n: number };
    expect(count.n).toBe(0);
  });
});
