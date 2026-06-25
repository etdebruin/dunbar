import { createDb } from "./index.js";

/** Standalone migration entrypoint: `pnpm db:migrate` (DUNBAR_DB overrides path). */
const location = process.env.DUNBAR_DB ?? "data/dunbar.db";
createDb(location);
console.log(`dunbar: migrated database at ${location}`);
