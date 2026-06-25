import type { Post, PostWithAuthor, PublicUser } from "@dunbar/shared";
import pc from "picocolors";

export type Colors = ReturnType<typeof pc.createColors>;

export function makeColors(enabled: boolean): Colors {
  return pc.createColors(enabled);
}

/** Compact human-friendly age, e.g. "3m", "5h", "2d", "just now". */
export function timeAgo(ms: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(ms).toISOString().slice(0, 10);
}

export function formatUser(u: PublicUser, c: Colors): string {
  const lines = [`${c.bold(`@${u.username}`)}${u.displayName ? `  ${u.displayName}` : ""}`];
  if (u.bio) lines.push(u.bio);
  lines.push(c.dim(`joined ${new Date(u.createdAt).toISOString().slice(0, 10)}`));
  return lines.join("\n");
}

function isWithAuthor(p: Post | PostWithAuthor): p is PostWithAuthor {
  return "author" in p;
}

export function formatPost(
  p: Post | PostWithAuthor,
  c: Colors,
  now = Date.now(),
): string {
  const who = isWithAuthor(p) ? c.bold(`@${p.author.username}`) : "";
  const meta = c.dim(`${who ? "  " : ""}${timeAgo(p.createdAt, now)} · ${p.id.slice(0, 8)}`);
  return `${who}${meta}\n${p.body}`;
}

export function formatPosts(
  posts: (Post | PostWithAuthor)[],
  c: Colors,
  emptyMessage: string,
  now = Date.now(),
): string {
  if (posts.length === 0) return c.dim(emptyMessage);
  return posts.map((p) => formatPost(p, c, now)).join("\n\n");
}

export function formatUserList(users: PublicUser[], c: Colors, empty: string): string {
  if (users.length === 0) return c.dim(empty);
  return users
    .map((u) => `${c.bold(`@${u.username}`)}${u.displayName ? `  ${u.displayName}` : ""}`)
    .join("\n");
}
