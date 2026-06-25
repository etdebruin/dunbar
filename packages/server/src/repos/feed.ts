import type { Paginated, PostWithAuthor } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { decodeCursor } from "../lib/cursor.js";
import { buildPage } from "./posts.js";

interface FeedRow {
  rowid: number;
  id: string;
  author_id: string;
  body: string;
  created_at: number;
  author__id: string;
  author__username: string;
  author__display_name: string | null;
  author__bio: string | null;
  author__created_at: number;
}

function rowToPostWithAuthor(row: FeedRow): PostWithAuthor {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    author: {
      id: row.author__id,
      username: row.author__username,
      displayName: row.author__display_name,
      bio: row.author__bio,
      createdAt: row.author__created_at,
    },
  };
}

const SELECT = `
  SELECT p.rowid AS rowid, p.id AS id, p.author_id AS author_id,
         p.body AS body, p.created_at AS created_at,
         u.id AS author__id, u.username AS author__username,
         u.display_name AS author__display_name, u.bio AS author__bio,
         u.created_at AS author__created_at
  FROM posts p
  JOIN follows f ON f.followee_id = p.author_id AND f.follower_id = ?
  JOIN users u ON u.id = p.author_id`;

/**
 * The home feed: posts authored by the people `userId` follows (excluding
 * their own), newest-first, keyset-paginated on rowid.
 */
export function listFeed(
  db: Db,
  userId: string,
  { limit, before }: { limit: number; before?: string | undefined },
): Paginated<PostWithAuthor> {
  const cursor = before ? decodeCursor(before) : null;
  const rows = (
    cursor !== null
      ? db
          .prepare(`${SELECT} WHERE p.rowid < ? ORDER BY p.rowid DESC LIMIT ?`)
          .all(userId, cursor, limit + 1)
      : db
          .prepare(`${SELECT} ORDER BY p.rowid DESC LIMIT ?`)
          .all(userId, limit + 1)
  ) as unknown as FeedRow[];

  return buildPage(rows, limit, rowToPostWithAuthor);
}
