import { newDb } from "pg-mem";
import { migrate, type Db } from "./index.js";

/**
 * An in-process Postgres (pg-mem) with the schema applied — for tests only.
 * Not imported by the app, so it never reaches the production bundle.
 */
export async function createMemoryDb(): Promise<Db> {
  const mem = newDb();
  const { Pool } = mem.adapters.createPg();
  const pool = new Pool() as unknown as Db;
  await migrate(pool);
  return pool;
}
