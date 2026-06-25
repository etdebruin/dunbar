import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../services/auth.js";

function bearer(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const raw = header.slice("Bearer ".length).trim();
  return raw.length > 0 ? raw : null;
}

/**
 * Decorate the app with `requireAuth` (a preHandler) and request fields.
 * Mutates the root instance directly so the decorators are visible to all
 * route plugins registered later (children inherit parent decorators).
 */
export function registerAuth(app: FastifyInstance): void {
  app.decorateRequest("user", null);
  app.decorateRequest("tokenId", null);

  app.decorate(
    "requireAuth",
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const raw = bearer(req);
      const result = raw ? verifyToken(app.db, raw) : null;
      if (!result) {
        await reply.code(401).send({ error: "unauthorized" });
        return;
      }
      req.user = result.user;
      req.tokenId = result.tokenId;
    },
  );
}
