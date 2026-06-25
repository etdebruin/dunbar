import type { PublicUser } from "@dunbar/shared";
import type { Db } from "../db/index.js";

/** Raw `users` row shape (snake_case, as stored). */
export interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  created_at: number;
}

/** Map a DB row to the public API representation. */
export function rowToPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    createdAt: row.created_at,
  };
}

export function findUserById(db: Db, id: string): PublicUser | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
  return row ? rowToPublicUser(row) : null;
}

export function findUserByUsername(
  db: Db,
  username: string,
): PublicUser | null {
  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;
  return row ? rowToPublicUser(row) : null;
}

export function insertUser(
  db: Db,
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    createdAt: number;
  },
): PublicUser {
  db.prepare(
    "INSERT INTO users (id, username, display_name, bio, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    user.id,
    user.username,
    user.displayName ?? null,
    null,
    user.createdAt,
  );
  return findUserById(db, user.id)!;
}
