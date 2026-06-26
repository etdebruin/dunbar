import pg from "pg";
import { SCHEMA_SQL } from "./schema.js";

// BIGINT (oid 20) comes back as a string by default to avoid precision loss.
// Our bigints (epoch ms, sequence ids) are well within Number's safe range,
// so parse them to numbers globally.
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

/** A connection pool — everything the app queries through. */
export type Db = pg.Pool;

export interface PoolOptions {
  connectionString?: string | undefined;
}

export function createPool(opts: PoolOptions = {}): Db {
  const connectionString = opts.connectionString ?? process.env.DATABASE_URL;
  const ssl =
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined;
  return new pg.Pool({
    connectionString,
    ssl,
    max: Number(process.env.DB_POOL_MAX ?? 10),
  });
}

/** Apply the schema. Idempotent — safe to call on every boot. */
export async function migrate(db: Db): Promise<void> {
  await db.query(SCHEMA_SQL);
}
