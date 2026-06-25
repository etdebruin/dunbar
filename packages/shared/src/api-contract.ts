/**
 * Single source of truth for API routes, shared by server, CLI, and website.
 * Server registers these paths; clients build URLs from them — so the two
 * cannot drift.
 */

export const API_PREFIX = "/v1";

const enc = encodeURIComponent;

export const routes = {
  // auth
  register: `${API_PREFIX}/auth/register`,
  logout: `${API_PREFIX}/auth/logout`,
  whoami: `${API_PREFIX}/auth/whoami`,

  // profile
  me: `${API_PREFIX}/me`,
  user: (username: string) => `${API_PREFIX}/users/${enc(username)}`,
  userPosts: (username: string) => `${API_PREFIX}/users/${enc(username)}/posts`,
  userFollowing: (username: string) =>
    `${API_PREFIX}/users/${enc(username)}/following`,
  userFollowers: (username: string) =>
    `${API_PREFIX}/users/${enc(username)}/followers`,

  // posts
  posts: `${API_PREFIX}/posts`,
  post: (id: string) => `${API_PREFIX}/posts/${enc(id)}`,

  // follows
  follows: `${API_PREFIX}/follows`,
  unfollow: (username: string) => `${API_PREFIX}/follows/${enc(username)}`,

  // feed
  feed: `${API_PREFIX}/feed`,
} as const;

/**
 * Route patterns with `:param` placeholders, for server-side registration.
 * (The {@link routes} builders URL-encode their arguments, so they can't be
 * used to register parameterized routes.)
 */
export const patterns = {
  user: `${API_PREFIX}/users/:username`,
  userPosts: `${API_PREFIX}/users/:username/posts`,
  userFollowing: `${API_PREFIX}/users/:username/following`,
  userFollowers: `${API_PREFIX}/users/:username/followers`,
  post: `${API_PREFIX}/posts/:id`,
  unfollow: `${API_PREFIX}/follows/:username`,
} as const;
