import { buildApp } from "./app.js";
import { createPool, migrate } from "./db/index.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const db = createPool();
await migrate(db);

// `node server.js migrate` — run migrations and exit (Fly release command).
if (process.argv.includes("migrate")) {
  console.log("dunbar: migrations applied");
  await db.end();
  process.exit(0);
}

const app = buildApp({ db, logger: true });

try {
  const address = await app.listen({ port, host });
  app.log.info(`dunbar API listening on ${address}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
