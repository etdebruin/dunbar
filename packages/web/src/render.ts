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
  nav.nav { margin-top: .5rem; font-size: .9rem; }
  nav.nav a { color: #8a8a92; }
  nav.nav a:hover { color: inherit; }
  .profile { border: 1px solid #e2e2dc; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem; }
  .profile h1 { margin: 0; font-size: 1.4rem; }
  .handle { color: #8a8a92; font-weight: 400; }
  .bio { margin: .5rem 0 0; }
  .post { border: 1px solid #e2e2dc; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
  .post .body { white-space: pre-wrap; margin: .35rem 0 0; }
  .meta, .muted { color: #8a8a92; font-size: .85rem; }
  h2 { font-size: 1.05rem; margin: 2.25rem 0 .6rem; }
  ol.steps { padding-left: 1.2rem; margin: .5rem 0; }
  ol.steps li { margin: .85rem 0; }
  pre.cmd {
    background: #11131a; color: #e8e8ea; border-radius: 8px;
    padding: .7rem .9rem; margin: .4rem 0 0; overflow-x: auto;
    font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  pre.cmd .c { color: #7c8190; }
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
  <nav class="nav"><a href="/">home</a> · <a href="/join">join</a> · <a href="/about">about</a></nav>
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
<p>There's no signup form — you join from your terminal.
<a href="/join">How to join &rarr;</a></p>
<p class="muted">Or read <a href="/about">why ${PRODUCT_NAME} works this way</a>.
Browse public profiles at <code>/u/&lt;username&gt;</code> or a post at
<code>/p/&lt;id&gt;</code>.</p>`,
  );
}

export function renderJoin(apiBase: string): string {
  const api = escapeHtml(apiBase);
  return layout(
    `join · ${PRODUCT_NAME}`,
    `<h1>How to join</h1>
<p>There's no signup form — you join from your terminal with the
<code>dunbar</code> CLI.</p>
<ol class="steps">
  <li>Install the CLI from source (puts <code>dunbar</code> on your PATH):
    <pre class="cmd">git clone https://github.com/etdebruin/dunbar
cd dunbar && pnpm install && pnpm --filter dunbar build
cd packages/cli && npm link</pre></li>
  <li>Point it at this server:
    <pre class="cmd">export DUNBAR_API=${api}</pre></li>
  <li>Claim your handle (2–20 chars, lowercase):
    <pre class="cmd">dunbar auth register --username <span class="c">you</span> --name <span class="c">"Your Name"</span></pre></li>
  <li>Start posting and following:
    <pre class="cmd">dunbar post <span class="c">"hello, dunbar"</span>
dunbar follow <span class="c">someone</span>
dunbar feed</pre></li>
</ol>
<p class="muted">You can follow at most ${MAX_FOLLOWING} people — that's the
whole idea. The code is open source at
<a href="https://github.com/etdebruin/dunbar">github.com/etdebruin/dunbar</a>.</p>`,
  );
}

export function renderAbout(): string {
  return layout(
    `about · ${PRODUCT_NAME}`,
    `<h1>About ${PRODUCT_NAME}</h1>
<p>${PRODUCT_NAME} is a small, command-line-first social network, created by
<strong>Etienne de Bruin</strong>.</p>

<h2>Why this approach</h2>
<p>Most social networks are engineered to grow without limit: infinite feeds,
algorithmic ranking, notifications tuned to pull you back. The product goal is
your attention, and the design follows from it.</p>
<p>${PRODUCT_NAME} starts from the opposite premise. It's named after
<a href="https://en.wikipedia.org/wiki/Dunbar%27s_number">Dunbar's number</a>
— the rough cognitive limit (~150) on the number of stable relationships a
person can maintain. So that's the cap: you can follow at most
${MAX_FOLLOWING} people. Not a growth metric to maximize, but a ceiling on
purpose. It keeps your feed to people you actually chose, and keeps the network
human-scale.</p>
<p>It's <strong>command-line-first</strong> because the terminal is calm and
intentional. You post a thought and leave — there's no endless scroll, no ads,
no ranking deciding what you see. The order is simply newest-first, from the
people you follow.</p>
<p>This website is deliberately tiny and read-only: a quiet public window onto
profiles and posts, not an engagement engine. Everything that matters —
posting, following, reading your feed — happens in your terminal.</p>
<p class="muted">Want in? See <a href="/join">how to join</a>. The code is open
source at <a href="https://github.com/etdebruin/dunbar">github.com/etdebruin/dunbar</a>.</p>`,
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
