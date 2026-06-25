import {
  followRequestSchema,
  MAX_FOLLOWING,
  patterns,
  routes,
} from "@dunbar/shared";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { findUserByUsername } from "../repos/users.js";
import { listFollowers, listFollowing } from "../repos/follows.js";
import { followUser, unfollowUser } from "../services/follows.js";

const usernameParam = z.object({ username: z.string().trim().toLowerCase() });

export function followRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    routes.follows,
    { preHandler: app.requireAuth, schema: { body: followRequestSchema } },
    (req, reply) => {
      const outcome = followUser(app.db, req.user!.id, req.body.username);
      switch (outcome) {
        case "self":
          return reply.code(400).send({ error: "cannot follow yourself" });
        case "not_found":
          return reply.code(404).send({ error: "user not found" });
        case "limit":
          return reply.code(422).send({
            error: `you can follow at most ${MAX_FOLLOWING} people — that's the point`,
          });
        default:
          return reply.code(200).send({ following: true });
      }
    },
  );

  r.delete(
    patterns.unfollow,
    { preHandler: app.requireAuth, schema: { params: usernameParam } },
    (req, reply) => {
      const outcome = unfollowUser(app.db, req.user!.id, req.params.username);
      if (outcome === "not_found") {
        return reply.code(404).send({ error: "user not found" });
      }
      return reply.code(200).send({ following: false });
    },
  );

  r.get(
    patterns.userFollowing,
    { schema: { params: usernameParam } },
    (req, reply) => {
      const user = findUserByUsername(app.db, req.params.username);
      if (!user) return reply.code(404).send({ error: "user not found" });
      return listFollowing(app.db, user.id);
    },
  );

  r.get(
    patterns.userFollowers,
    { schema: { params: usernameParam } },
    (req, reply) => {
      const user = findUserByUsername(app.db, req.params.username);
      if (!user) return reply.code(404).send({ error: "user not found" });
      return listFollowers(app.db, user.id);
    },
  );
}
