import {
  routes,
  type AuthResult,
  type Paginated,
  type Post,
  type PostWithAuthor,
  type PublicUser,
  type UpdateProfileRequest,
} from "@dunbar/shared";

/** Thrown for any non-2xx API response, carrying the status and server message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ClientOptions {
  apiUrl: string;
  token?: string | undefined;
}

export interface PageOpts {
  limit?: number;
  before?: string;
}

function qs(opts?: PageOpts): string {
  if (!opts) return "";
  const params = new URLSearchParams();
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts.before) params.set("before", opts.before);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export type DunbarClient = ReturnType<typeof createClient>;

export function createClient({ apiUrl, token }: ClientOptions) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;

    const res = await fetch(apiUrl + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const message =
        (data && typeof data.error === "string" && data.error) ||
        res.statusText ||
        `request failed (${res.status})`;
      throw new ApiError(res.status, message);
    }
    return data as T;
  }

  return {
    register: (username: string, displayName?: string) =>
      request<AuthResult>("POST", routes.register, { username, displayName }),
    whoami: () => request<PublicUser>("GET", routes.whoami),
    logout: () => request<{ ok: true }>("POST", routes.logout),

    getUser: (username: string) =>
      request<PublicUser>("GET", routes.user(username)),
    updateProfile: (patch: UpdateProfileRequest) =>
      request<PublicUser>("PATCH", routes.me, patch),

    createPost: (body: string) => request<Post>("POST", routes.posts, { body }),
    deletePost: (id: string) =>
      request<{ ok: true }>("DELETE", routes.post(id)),
    userPosts: (username: string, opts?: PageOpts) =>
      request<Paginated<Post>>("GET", routes.userPosts(username) + qs(opts)),

    follow: (username: string) =>
      request<{ following: boolean }>("POST", routes.follows, { username }),
    unfollow: (username: string) =>
      request<{ following: boolean }>("DELETE", routes.unfollow(username)),
    following: (username: string) =>
      request<PublicUser[]>("GET", routes.userFollowing(username)),
    followers: (username: string) =>
      request<PublicUser[]>("GET", routes.userFollowers(username)),

    feed: (opts?: PageOpts) =>
      request<Paginated<PostWithAuthor>>("GET", routes.feed + qs(opts)),
  };
}
