import { paginationQuerySchema, routes } from "@dunbar/shared";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { listFeed } from "../repos/feed.js";

export function feedRoutes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    routes.feed,
    { preHandler: app.requireAuth, schema: { querystring: paginationQuerySchema } },
    (req) =>
      listFeed(app.db, req.user!.id, {
        limit: req.query.limit,
        before: req.query.before,
      }),
  );
}
