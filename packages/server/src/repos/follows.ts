import type { PublicUser } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { rowToPublicUser, type UserRow } from "./users.js";

export async function isFollowing(
  db: Db,
  followerId: string,
  followeeId: string,
): Promise<boolean> {
  const { rows } = await db.query(
    "SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2",
    [followerId, followeeId],
  );
  return rows.length > 0;
}

export async function countFollowing(
  db: Db,
  followerId: string,
): Promise<number> {
  const { rows } = await db.query(
    "SELECT COUNT(*) AS n FROM follows WHERE follower_id = $1",
    [followerId],
  );
  return Number((rows[0] as { n: number | string }).n);
}

export async function insertFollow(
  db: Db,
  followerId: string,
  followeeId: string,
  createdAt: number,
): Promise<void> {
  await db.query(
    `INSERT INTO follows (follower_id, followee_id, created_at)
     VALUES ($1, $2, $3)`,
    [followerId, followeeId, createdAt],
  );
}

/** Remove a follow edge. Returns true if one existed. */
export async function deleteFollow(
  db: Db,
  followerId: string,
  followeeId: string,
): Promise<boolean> {
  const { rowCount } = await db.query(
    "DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2",
    [followerId, followeeId],
  );
  return (rowCount ?? 0) > 0;
}

/** Users that `userId` follows, most-recently-followed first. */
export async function listFollowing(
  db: Db,
  userId: string,
): Promise<PublicUser[]> {
  const { rows } = await db.query(
    `SELECT u.* FROM follows f JOIN users u ON u.id = f.followee_id
     WHERE f.follower_id = $1 ORDER BY f.seq DESC`,
    [userId],
  );
  return (rows as UserRow[]).map(rowToPublicUser);
}

/** Users that follow `userId`, most-recent first. */
export async function listFollowers(
  db: Db,
  userId: string,
): Promise<PublicUser[]> {
  const { rows } = await db.query(
    `SELECT u.* FROM follows f JOIN users u ON u.id = f.follower_id
     WHERE f.followee_id = $1 ORDER BY f.seq DESC`,
    [userId],
  );
  return (rows as UserRow[]).map(rowToPublicUser);
}
