import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { buildApp } from "./app.js";
import { createDb } from "./db/index.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
const dbLocation = process.env.DUNBAR_DB ?? "data/dunbar.db";

if (dbLocation !== ":memory:") {
  mkdirSync(dirname(dbLocation), { recursive: true });
}

const app = buildApp({ db: createDb(dbLocation), logger: true });

app
  .listen({ port, host })
  .then((address) => app.log.info(`dunbar API listening on ${address}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
