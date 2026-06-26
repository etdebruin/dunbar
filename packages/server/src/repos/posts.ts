import type { Paginated, Post, PostWithAuthor } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { decodeCursor, encodeCursor } from "../lib/cursor.js";

interface PostRow {
  seq: number | string;
  id: string;
  author_id: string;
  body: string;
  created_at: number | string;
}

export function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    createdAt: Number(row.created_at),
  };
}

export async function insertPost(
  db: Db,
  post: { id: string; authorId: string; body: string; createdAt: number },
): Promise<Post> {
  const { rows } = await db.query(
    `INSERT INTO posts (id, author_id, body, created_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [post.id, post.authorId, post.body, post.createdAt],
  );
  return rowToPost(rows[0] as PostRow);
}

export async function findPostById(db: Db, id: string): Promise<Post | null> {
  const { rows } = await db.query("SELECT * FROM posts WHERE id = $1", [id]);
  return rows[0] ? rowToPost(rows[0] as PostRow) : null;
}

interface PostWithAuthorRow extends PostRow {
  author__id: string;
  author__username: string;
  author__display_name: string | null;
  author__bio: string | null;
  author__created_at: number | string;
}

function rowToPostWithAuthor(row: PostWithAuthorRow): PostWithAuthor {
  return {
    ...rowToPost(row),
    author: {
      id: row.author__id,
      username: row.author__username,
      displayName: row.author__display_name,
      bio: row.author__bio,
      createdAt: Number(row.author__created_at),
    },
  };
}

/** A single post enriched with its author, for permalinks. */
export async function findPostWithAuthorById(
  db: Db,
  id: string,
): Promise<PostWithAuthor | null> {
  const { rows } = await db.query(
    `SELECT p.seq AS seq, p.id AS id, p.author_id AS author_id,
            p.body AS body, p.created_at AS created_at,
            u.id AS author__id, u.username AS author__username,
            u.display_name AS author__display_name, u.bio AS author__bio,
            u.created_at AS author__created_at
     FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = $1`,
    [id],
  );
  return rows[0] ? rowToPostWithAuthor(rows[0] as PostWithAuthorRow) : null;
}

/** Newest posts across the whole network (public timeline), keyset on seq. */
export async function listRecentPosts(
  db: Db,
  { limit, before }: { limit: number; before?: string | undefined },
): Promise<Paginated<PostWithAuthor>> {
  const sel = `SELECT p.seq AS seq, p.id AS id, p.author_id AS author_id,
       p.body AS body, p.created_at AS created_at,
       u.id AS author__id, u.username AS author__username,
       u.display_name AS author__display_name, u.bio AS author__bio,
       u.created_at AS author__created_at
     FROM posts p JOIN users u ON u.id = p.author_id`;
  const cursor = before ? decodeCursor(before) : null;
  const { rows } =
    cursor !== null
      ? await db.query(`${sel} WHERE p.seq < $1 ORDER BY p.seq DESC LIMIT $2`, [
          cursor,
          limit + 1,
        ])
      : await db.query(`${sel} ORDER BY p.seq DESC LIMIT $1`, [limit + 1]);
  return buildPage(rows as PostWithAuthorRow[], limit, rowToPostWithAuthor);
}

/** Delete a post. Returns true if a row was removed. */
export async function deletePost(db: Db, id: string): Promise<boolean> {
  const { rowCount } = await db.query("DELETE FROM posts WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

interface PageOpts {
  limit: number;
  before?: string | undefined;
}

/** Reverse-chronological posts by a single author, keyset-paginated on seq. */
export async function listPostsByAuthor(
  db: Db,
  authorId: string,
  { limit, before }: PageOpts,
): Promise<Paginated<Post>> {
  const cursor = before ? decodeCursor(before) : null;
  const { rows } =
    cursor !== null
      ? await db.query(
          `SELECT * FROM posts WHERE author_id = $1 AND seq < $2
           ORDER BY seq DESC LIMIT $3`,
          [authorId, cursor, limit + 1],
        )
      : await db.query(
          `SELECT * FROM posts WHERE author_id = $1
           ORDER BY seq DESC LIMIT $2`,
          [authorId, limit + 1],
        );
  return buildPage(rows as PostRow[], limit, rowToPost);
}

/**
 * Slice over-fetched rows (limit + 1) into a page and derive the next cursor
 * from the last kept row's seq. Generic so feeds can reuse it.
 */
export function buildPage<R extends { seq: number | string }, T>(
  rows: R[],
  limit: number,
  map: (row: R) => T,
): Paginated<T> {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  return {
    items: page.map(map),
    nextCursor: hasMore && last ? encodeCursor(Number(last.seq)) : null,
  };
}
