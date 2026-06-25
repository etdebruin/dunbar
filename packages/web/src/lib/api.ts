import {
  routes,
  type Paginated,
  type Post,
  type PostWithAuthor,
  type PublicUser,
} from "@dunbar/shared";

/** Minimal read-only client for the website. Returns null on 404. */
export function createWebApi(apiUrl: string) {
  async function get<T>(path: string): Promise<T | null> {
    const res = await fetch(apiUrl + path);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`upstream responded ${res.status}`);
    return (await res.json()) as T;
  }

  return {
    getUser: (username: string) => get<PublicUser>(routes.user(username)),
    getUserPosts: (username: string) =>
      get<Paginated<Post>>(`${routes.userPosts(username)}?limit=20`),
    getPost: (id: string) => get<PostWithAuthor>(routes.post(id)),
  };
}

export type WebApi = ReturnType<typeof createWebApi>;
