import { routes } from "@dunbar/shared";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createDb } from "../db/index.js";

function app() {
  return buildApp({ db: createDb(":memory:") });
}

async function register(a: ReturnType<typeof app>, username: string) {
  return a.inject({
    method: "POST",
    url: routes.register,
    payload: { username },
  });
}

describe("POST /v1/auth/register", () => {
  it("creates a user and returns a token", async () => {
    const a = app();
    const res = await register(a, "alice");
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(typeof body.token).toBe("string");
    expect(body.user.username).toBe("alice");
    expect(body.user.id).toBeTruthy();
  });

  it("409s on a taken username", async () => {
    const a = app();
    await register(a, "alice");
    const res = await register(a, "alice");
    expect(res.statusCode).toBe(409);
  });

  it("normalizes case so ALICE collides with alice", async () => {
    const a = app();
    await register(a, "alice");
    const res = await a.inject({
      method: "POST",
      url: routes.register,
      payload: { username: "ALICE" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("400s on an invalid username", async () => {
    const a = app();
    const res = await a.inject({
      method: "POST",
      url: routes.register,
      payload: { username: "a" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /v1/auth/whoami", () => {
  it("returns the current user with a valid token", async () => {
    const a = app();
    const token = (await register(a, "alice")).json().token;
    const res = await a.inject({
      method: "GET",
      url: routes.whoami,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().username).toBe("alice");
  });

  it("401s without a token", async () => {
    const res = await app().inject({ method: "GET", url: routes.whoami });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /v1/auth/logout", () => {
  it("revokes the current token", async () => {
    const a = app();
    const token = (await register(a, "alice")).json().token;
    const auth = { authorization: `Bearer ${token}` };

    const out = await a.inject({
      method: "POST",
      url: routes.logout,
      headers: auth,
    });
    expect(out.statusCode).toBe(200);

    // token no longer works
    const after = await a.inject({
      method: "GET",
      url: routes.whoami,
      headers: auth,
    });
    expect(after.statusCode).toBe(401);
  });
});
