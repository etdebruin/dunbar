import Fastify, { type FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { createPool, type Db } from "./db/index.js";
import { registerAuth } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { feedRoutes } from "./routes/feed.js";
import { followRoutes } from "./routes/follows.js";
import { postRoutes } from "./routes/posts.js";
import { userRoutes } from "./routes/users.js";
import "./types.js";

export interface BuildAppOptions {
  db?: Db;
  logger?: boolean;
}

/**
 * Construct a fully-wired Fastify app. Accepts an injected (already-migrated)
 * connection pool so tests can pass an in-memory pg-mem db and use
 * `app.inject()` without binding a port.
 */
export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const db = opts.db ?? createPool();

  const app = Fastify({
    logger: opts.logger ?? false,
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.decorate("db", db);
  registerAuth(app);

  app.get("/health", () => ({ ok: true }));
  authRoutes(app);
  userRoutes(app);
  postRoutes(app);
  followRoutes(app);
  feedRoutes(app);

  return app;
}
