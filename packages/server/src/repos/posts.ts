import type { Paginated, Post } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { decodeCursor, encodeCursor } from "../lib/cursor.js";

interface PostRow {
  rowid: number;
  id: string;
  author_id: string;
  body: string;
  created_at: number;
}

export function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function insertPost(
  db: Db,
  post: { id: string; authorId: string; body: string; createdAt: number },
): Post {
  db.prepare(
    "INSERT INTO posts (id, author_id, body, created_at) VALUES (?, ?, ?, ?)",
  ).run(post.id, post.authorId, post.body, post.createdAt);
  return findPostById(db, post.id)!;
}

export function findPostById(db: Db, id: string): Post | null {
  const row = db
    .prepare("SELECT rowid, * FROM posts WHERE id = ?")
    .get(id) as PostRow | undefined;
  return row ? rowToPost(row) : null;
}

/** Delete a post. Returns true if a row was removed. */
export function deletePost(db: Db, id: string): boolean {
  const info = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  return info.changes > 0;
}

interface PageOpts {
  limit: number;
  before?: string | undefined;
}

/** Reverse-chronological posts by a single author, keyset-paginated on rowid. */
export function listPostsByAuthor(
  db: Db,
  authorId: string,
  { limit, before }: PageOpts,
): Paginated<Post> {
  const cursor = before ? decodeCursor(before) : null;
  const rows = (
    cursor !== null
      ? db
          .prepare(
            "SELECT rowid, * FROM posts WHERE author_id = ? AND rowid < ? ORDER BY rowid DESC LIMIT ?",
          )
          .all(authorId, cursor, limit + 1)
      : db
          .prepare(
            "SELECT rowid, * FROM posts WHERE author_id = ? ORDER BY rowid DESC LIMIT ?",
          )
          .all(authorId, limit + 1)
  ) as unknown as PostRow[];

  return buildPage(rows, limit, rowToPost);
}

/**
 * Slice over-fetched rows (limit + 1) into a page and derive the next cursor
 * from the last kept row's rowid. Generic so feeds can reuse it.
 */
export function buildPage<R extends { rowid: number }, T>(
  rows: R[],
  limit: number,
  map: (row: R) => T,
): Paginated<T> {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  return {
    items: page.map(map),
    nextCursor: hasMore && last ? encodeCursor(last.rowid) : null,
  };
}
