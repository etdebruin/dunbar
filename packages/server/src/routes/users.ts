import { patterns, routes, updateProfileSchema } from "@dunbar/shared";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { findUserByUsername, updateUserProfile } from "../repos/users.js";

const usernameParam = z.object({
  username: z.string().trim().toLowerCase(),
});

export function userRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(patterns.user, { schema: { params: usernameParam } }, (req, reply) => {
    const user = findUserByUsername(app.db, req.params.username);
    if (!user) return reply.code(404).send({ error: "user not found" });
    return user;
  });

  r.get(routes.me, { preHandler: app.requireAuth }, (req) => req.user);

  r.patch(
    routes.me,
    { preHandler: app.requireAuth, schema: { body: updateProfileSchema } },
    (req) => updateUserProfile(app.db, req.user!.id, req.body),
  );
}
