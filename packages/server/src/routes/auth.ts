import { randomUUID } from "node:crypto";
import { registerRequestSchema, routes } from "@dunbar/shared";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { findUserByUsername, insertUser } from "../repos/users.js";
import { issueToken, revokeTokenById } from "../services/auth.js";

export function authRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    routes.register,
    { schema: { body: registerRequestSchema } },
    async (req, reply) => {
      const { username, displayName } = req.body;

      if (await findUserByUsername(app.db, username)) {
        return reply.code(409).send({ error: "username taken" });
      }

      const user = await insertUser(app.db, {
        id: randomUUID(),
        username,
        displayName: displayName ?? null,
        createdAt: Date.now(),
      });
      const { token } = await issueToken(app.db, user.id, "cli");
      return reply.code(201).send({ token, user });
    },
  );

  r.get(routes.whoami, { preHandler: app.requireAuth }, (req) => req.user);

  r.post(routes.logout, { preHandler: app.requireAuth }, async (req, reply) => {
    if (req.tokenId) await revokeTokenById(app.db, req.tokenId);
    return reply.code(200).send({ ok: true });
  });
}
