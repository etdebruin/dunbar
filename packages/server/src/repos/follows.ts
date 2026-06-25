import type { PublicUser } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { rowToPublicUser, type UserRow } from "./users.js";

export function isFollowing(
  db: Db,
  followerId: string,
  followeeId: string,
): boolean {
  const row = db
    .prepare("SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?")
    .get(followerId, followeeId);
  return row !== undefined;
}

export function countFollowing(db: Db, followerId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?")
    .get(followerId) as { n: number };
  return row.n;
}

export function insertFollow(
  db: Db,
  followerId: string,
  followeeId: string,
  createdAt: number,
): void {
  db.prepare(
    "INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)",
  ).run(followerId, followeeId, createdAt);
}

/** Remove a follow edge. Returns true if one existed. */
export function deleteFollow(
  db: Db,
  followerId: string,
  followeeId: string,
): boolean {
  const info = db
    .prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?")
    .run(followerId, followeeId);
  return info.changes > 0;
}

/** Users that `userId` follows, most-recently-followed first. */
export function listFollowing(db: Db, userId: string): PublicUser[] {
  const rows = db
    .prepare(
      `SELECT u.* FROM follows f JOIN users u ON u.id = f.followee_id
       WHERE f.follower_id = ? ORDER BY f.rowid DESC`,
    )
    .all(userId) as unknown as UserRow[];
  return rows.map(rowToPublicUser);
}

/** Users that follow `userId`, most-recent first. */
export function listFollowers(db: Db, userId: string): PublicUser[] {
  const rows = db
    .prepare(
      `SELECT u.* FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.followee_id = ? ORDER BY f.rowid DESC`,
    )
    .all(userId) as unknown as UserRow[];
  return rows.map(rowToPublicUser);
}
