import type { PublicUser } from "@dunbar/shared";
import type { Db } from "../db/index.js";

/** Raw `users` row shape (snake_case, as stored). */
export interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  created_at: number | string;
}

/** Map a DB row to the public API representation. */
export function rowToPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    createdAt: Number(row.created_at),
  };
}

export async function findUserById(
  db: Db,
  id: string,
): Promise<PublicUser | null> {
  const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? rowToPublicUser(rows[0] as UserRow) : null;
}

export async function findUserByUsername(
  db: Db,
  username: string,
): Promise<PublicUser | null> {
  const { rows } = await db.query(
    "SELECT * FROM users WHERE username = $1",
    [username],
  );
  return rows[0] ? rowToPublicUser(rows[0] as UserRow) : null;
}

/** Patch a user's profile fields. Only provided keys are written. */
export async function updateUserProfile(
  db: Db,
  id: string,
  patch: { displayName?: string | null; bio?: string | null },
): Promise<PublicUser | null> {
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (patch.displayName !== undefined) {
    values.push(patch.displayName);
    sets.push(`display_name = $${values.length}`);
  }
  if (patch.bio !== undefined) {
    values.push(patch.bio);
    sets.push(`bio = $${values.length}`);
  }
  if (sets.length > 0) {
    values.push(id);
    await db.query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length}`,
      values,
    );
  }
  return findUserById(db, id);
}

export async function insertUser(
  db: Db,
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    createdAt: number;
  },
): Promise<PublicUser> {
  const { rows } = await db.query(
    `INSERT INTO users (id, username, display_name, bio, created_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user.id, user.username, user.displayName ?? null, null, user.createdAt],
  );
  return rowToPublicUser(rows[0] as UserRow);
}
