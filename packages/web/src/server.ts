import { createServer, type Server, type ServerResponse } from "node:http";
import { createWebApi } from "./lib/api.js";
import {
  renderHome,
  renderNotFound,
  renderPost,
  renderProfile,
} from "./render.js";

export interface WebOptions {
  apiUrl: string;
}

function send(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

/** A tiny read-only website over the dunbar API. Built on node:http — no deps. */
export function createWebServer({ apiUrl }: WebOptions): Server {
  const api = createWebApi(apiUrl);

  return createServer(async (req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    try {
      if (path === "/") return send(res, 200, renderHome(apiUrl));

      const profile = path.match(/^\/u\/([^/]+)\/?$/);
      if (profile?.[1]) {
        const username = decodeURIComponent(profile[1]);
        const user = await api.getUser(username);
        if (!user) return send(res, 404, renderNotFound());
        const posts = await api.getUserPosts(username);
        return send(res, 200, renderProfile(user, posts?.items ?? []));
      }

      const permalink = path.match(/^\/p\/([^/]+)\/?$/);
      if (permalink?.[1]) {
        const post = await api.getPost(decodeURIComponent(permalink[1]));
        if (!post) return send(res, 404, renderNotFound());
        return send(res, 200, renderPost(post));
      }

      return send(res, 404, renderNotFound());
    } catch {
      send(res, 502, renderNotFound());
    }
  });
}
