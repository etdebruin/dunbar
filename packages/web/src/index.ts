import { createWebServer } from "./server.js";

const port = Number(process.env.WEB_PORT ?? 4321);
const host = process.env.WEB_HOST ?? "127.0.0.1";
const apiUrl = process.env.DUNBAR_API ?? "http://127.0.0.1:3000";

createWebServer({ apiUrl }).listen(port, host, () => {
  console.log(`dunbar web on http://${host}:${port} (API: ${apiUrl})`);
});
