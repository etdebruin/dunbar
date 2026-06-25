import {
  MAX_FOLLOWING,
  PRODUCT_NAME,
  type Post,
  type PostWithAuthor,
  type PublicUser,
} from "@dunbar/shared";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLE = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, sans-serif;
    max-width: 38rem; margin: 0 auto; padding: 2.5rem 1.25rem 5rem;
    color: #1a1a1a; background: #fafaf8;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e6e6e6; background: #16161a; }
    a { color: #9db4ff; }
    .post, .profile { border-color: #2a2a30; }
    .meta, .muted { color: #8a8a92; }
  }
  a { color: #2b50d8; text-decoration: none; }
  a:hover { text-decoration: underline; }
  header.site { margin-bottom: 2rem; }
  header.site a { font-weight: 700; font-size: 1.25rem; color: inherit; }
  .tagline { color: #8a8a92; font-size: .85rem; margin-top: .15rem; }
  .profile { border: 1px solid #e2e2dc; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem; }
  .profile h1 { margin: 0; font-size: 1.4rem; }
  .handle { color: #8a8a92; font-weight: 400; }
  .bio { margin: .5rem 0 0; }
  .post { border: 1px solid #e2e2dc; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
  .post .body { white-space: pre-wrap; margin: .35rem 0 0; }
  .meta, .muted { color: #8a8a92; font-size: .85rem; }
  footer { margin-top: 3rem; color: #8a8a92; font-size: .8rem; }
`;

export function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<header class="site">
  <a href="/">${PRODUCT_NAME}</a>
  <div class="tagline">a smaller social network · follow at most ${MAX_FOLLOWING} people</div>
</header>
${body}
<footer>${PRODUCT_NAME} — most of this happens in the terminal.</footer>
</body>
</html>`;
}

function day(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function postCard(p: Post, opts: { handle?: string } = {}): string {
  const head = opts.handle
    ? `<a href="/u/${encodeURIComponent(opts.handle)}">@${escapeHtml(opts.handle)}</a> · `
    : "";
  return `<article class="post">
  <div class="meta">${head}<a href="/p/${encodeURIComponent(p.id)}">${day(p.createdAt)}</a></div>
  <p class="body">${escapeHtml(p.body)}</p>
</article>`;
}

export function renderHome(): string {
  return layout(
    PRODUCT_NAME,
    `<p>${PRODUCT_NAME} is a command-line-first social network. People post, follow,
and read their feed from the terminal. This site is just a quiet, read-only
window onto public profiles and posts.</p>
<p class="muted">Visit a profile at <code>/u/&lt;username&gt;</code> or a post at <code>/p/&lt;id&gt;</code>.</p>`,
  );
}

export function renderProfile(user: PublicUser, posts: Post[]): string {
  const body = `<section class="profile">
  <h1>${escapeHtml(user.displayName ?? user.username)} <span class="handle">@${escapeHtml(user.username)}</span></h1>
  ${user.bio ? `<p class="bio">${escapeHtml(user.bio)}</p>` : ""}
  <p class="muted">joined ${day(user.createdAt)}</p>
</section>
<h2>Posts</h2>
${
  posts.length === 0
    ? `<p class="muted">No posts yet.</p>`
    : posts.map((p) => postCard(p)).join("\n")
}`;
  return layout(`@${user.username} · ${PRODUCT_NAME}`, body);
}

export function renderPost(post: PostWithAuthor): string {
  return layout(
    `@${post.author.username} · ${PRODUCT_NAME}`,
    postCard(post, { handle: post.author.username }),
  );
}

export function renderNotFound(): string {
  return layout(
    `not found · ${PRODUCT_NAME}`,
    `<p>Nothing here.</p><p class="muted"><a href="/">← back</a></p>`,
  );
}
