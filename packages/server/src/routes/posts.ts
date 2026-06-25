import { randomUUID } from "node:crypto";
import {
  createPostRequestSchema,
  paginationQuerySchema,
  patterns,
  routes,
} from "@dunbar/shared";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { findUserByUsername } from "../repos/users.js";
import {
  deletePost,
  findPostById,
  insertPost,
  listPostsByAuthor,
} from "../repos/posts.js";

const idParam = z.object({ id: z.string() });
const usernameParam = z.object({ username: z.string().trim().toLowerCase() });

export function postRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    routes.posts,
    { preHandler: app.requireAuth, schema: { body: createPostRequestSchema } },
    (req, reply) => {
      const post = insertPost(app.db, {
        id: randomUUID(),
        authorId: req.user!.id,
        body: req.body.body,
        createdAt: Date.now(),
      });
      return reply.code(201).send(post);
    },
  );

  r.get(patterns.post, { schema: { params: idParam } }, (req, reply) => {
    const post = findPostById(app.db, req.params.id);
    if (!post) return reply.code(404).send({ error: "post not found" });
    return post;
  });

  r.get(
    patterns.userPosts,
    { schema: { params: usernameParam, querystring: paginationQuerySchema } },
    (req, reply) => {
      const user = findUserByUsername(app.db, req.params.username);
      if (!user) return reply.code(404).send({ error: "user not found" });
      return listPostsByAuthor(app.db, user.id, {
        limit: req.query.limit,
        before: req.query.before,
      });
    },
  );

  r.delete(
    patterns.post,
    { preHandler: app.requireAuth, schema: { params: idParam } },
    (req, reply) => {
      const post = findPostById(app.db, req.params.id);
      if (!post) return reply.code(404).send({ error: "post not found" });
      if (post.authorId !== req.user!.id) {
        return reply.code(403).send({ error: "not your post" });
      }
      deletePost(app.db, post.id);
      return reply.code(200).send({ ok: true });
    },
  );
}
