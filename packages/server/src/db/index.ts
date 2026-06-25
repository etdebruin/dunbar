import { DatabaseSync } from "node:sqlite";
import { SCHEMA_SQL } from "./schema.js";

/** A thin alias so callers don't import from `node:sqlite` everywhere. */
export type Db = DatabaseSync;

/** Apply the schema. Idempotent — safe to call on every boot. */
export function migrate(db: Db): void {
  db.exec(SCHEMA_SQL);
}

/**
 * Open a database, configure pragmas, and run migrations.
 * @param location a file path, or ":memory:" (the default) for tests.
 */
export function createDb(location = ":memory:"): Db {
  const db = new DatabaseSync(location);
  // WAL improves concurrency for the file-backed case; ignored for :memory:.
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}
