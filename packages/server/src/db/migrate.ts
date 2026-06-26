import { createPool, migrate } from "./index.js";

/** Standalone migration entrypoint: `pnpm db:migrate` (uses DATABASE_URL). */
const db = createPool();
await migrate(db);
console.log("dunbar: database migrated");
await db.end();
