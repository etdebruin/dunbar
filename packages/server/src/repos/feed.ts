import type { Paginated, PostWithAuthor } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { decodeCursor } from "../lib/cursor.js";
import { buildPage } from "./posts.js";

interface FeedRow {
  seq: number | string;
  id: string;
  author_id: string;
  body: string;
  created_at: number | string;
  author__id: string;
  author__username: string;
  author__display_name: string | null;
  author__bio: string | null;
  author__created_at: number | string;
}

function rowToPostWithAuthor(row: FeedRow): PostWithAuthor {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    createdAt: Number(row.created_at),
    author: {
      id: row.author__id,
      username: row.author__username,
      displayName: row.author__display_name,
      bio: row.author__bio,
      createdAt: Number(row.author__created_at),
    },
  };
}

const SELECT = `
  SELECT p.seq AS seq, p.id AS id, p.author_id AS author_id,
         p.body AS body, p.created_at AS created_at,
         u.id AS author__id, u.username AS author__username,
         u.display_name AS author__display_name, u.bio AS author__bio,
         u.created_at AS author__created_at
  FROM posts p
  JOIN follows f ON f.followee_id = p.author_id AND f.follower_id = $1
  JOIN users u ON u.id = p.author_id`;

/**
 * The home feed: posts authored by the people `userId` follows (excluding
 * their own), newest-first, keyset-paginated on seq.
 */
export async function listFeed(
  db: Db,
  userId: string,
  { limit, before }: { limit: number; before?: string | undefined },
): Promise<Paginated<PostWithAuthor>> {
  const cursor = before ? decodeCursor(before) : null;
  const { rows } =
    cursor !== null
      ? await db.query(
          `${SELECT} WHERE p.seq < $2 ORDER BY p.seq DESC LIMIT $3`,
          [userId, cursor, limit + 1],
        )
      : await db.query(`${SELECT} ORDER BY p.seq DESC LIMIT $2`, [
          userId,
          limit + 1,
        ]);
  return buildPage(rows as FeedRow[], limit, rowToPostWithAuthor);
}
