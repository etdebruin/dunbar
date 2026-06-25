import type { PublicUser } from "@dunbar/shared";
import type { FastifyReply } from "fastify";
import type { Db } from "./db/index.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
    /** preHandler that 401s unless a valid bearer token is present. */
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    /** Set by {@link FastifyInstance.requireAuth}. */
    user: PublicUser | null;
    tokenId: string | null;
  }
}
