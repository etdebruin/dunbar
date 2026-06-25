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

/** Patch a user's profile fields. Only provided keys are written. */
export function updateUserProfile(
  db: Db,
  id: string,
  patch: { displayName?: string | null; bio?: string | null },
): PublicUser | null {
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (patch.displayName !== undefined) {
    sets.push("display_name = ?");
    values.push(patch.displayName);
  }
  if (patch.bio !== undefined) {
    sets.push("bio = ?");
    values.push(patch.bio);
  }
  if (sets.length > 0) {
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(
      ...values,
      id,
    );
  }
  return findUserById(db, id);
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
  ).run(user.id, user.username, user.displayName ?? null, null, user.createdAt);
  return findUserById(db, user.id)!;
}
