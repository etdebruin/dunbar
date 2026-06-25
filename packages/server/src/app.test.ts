import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { createDb } from "./db/index.js";
import { issueToken } from "./services/auth.js";

function appWithUser() {
  const db = createDb(":memory:");
  db.prepare(
    "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
  ).run("u1", "et", 1700000000000);
  const { token } = issueToken(db, "u1");
  const app = buildApp({ db });
  // a throwaway protected route to exercise the auth guard
  app.get("/_protected", { preHandler: app.requireAuth }, (req) => ({
    username: req.user?.username,
  }));
  return { app, token };
}

describe("health", () => {
  it("responds ok", async () => {
    const app = buildApp({ db: createDb(":memory:") });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});

describe("requireAuth guard", () => {
  it("401s without a bearer token", async () => {
    const { app } = appWithUser();
    const res = await app.inject({ method: "GET", url: "/_protected" });
    expect(res.statusCode).toBe(401);
  });

  it("401s with an invalid token", async () => {
    const { app } = appWithUser();
    const res = await app.inject({
      method: "GET",
      url: "/_protected",
      headers: { authorization: "Bearer dunbar_pat_bogus" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("passes through with a valid token and exposes req.user", async () => {
    const { app, token } = appWithUser();
    const res = await app.inject({
      method: "GET",
      url: "/_protected",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ username: "et" });
  });
});
