import { routes } from "@dunbar/shared";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createMemoryDb } from "../db/memory.js";

async function setup() {
  const app = buildApp({ db: await createMemoryDb() });
  const token = (
    await app.inject({
      method: "POST",
      url: routes.register,
      payload: { username: "alice", displayName: "Alice" },
    })
  ).json().token as string;
  return { app, token, auth: { authorization: `Bearer ${token}` } };
}

describe("GET /v1/users/:username", () => {
  it("returns a public profile", async () => {
    const { app } = await setup();
    const res = await app.inject({ method: "GET", url: routes.user("alice") });
    expect(res.statusCode).toBe(200);
    expect(res.json().username).toBe("alice");
    expect(res.json().displayName).toBe("Alice");
  });

  it("is case-insensitive", async () => {
    const { app } = await setup();
    const res = await app.inject({ method: "GET", url: routes.user("ALICE") });
    expect(res.statusCode).toBe(200);
  });

  it("404s for an unknown user", async () => {
    const { app } = await setup();
    const res = await app.inject({ method: "GET", url: routes.user("nobody") });
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /v1/me", () => {
  it("returns the authed user", async () => {
    const { app, auth } = await setup();
    const res = await app.inject({
      method: "GET",
      url: routes.me,
      headers: auth,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().username).toBe("alice");
  });

  it("401s without auth", async () => {
    const { app } = await setup();
    const res = await app.inject({ method: "GET", url: routes.me });
    expect(res.statusCode).toBe(401);
  });
});

describe("PATCH /v1/me", () => {
  it("updates the bio and reflects it on the public profile", async () => {
    const { app, auth } = await setup();
    const res = await app.inject({
      method: "PATCH",
      url: routes.me,
      headers: auth,
      payload: { bio: "building dunbar" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().bio).toBe("building dunbar");

    const pub = await app.inject({ method: "GET", url: routes.user("alice") });
    expect(pub.json().bio).toBe("building dunbar");
  });

  it("400s on an empty patch", async () => {
    const { app, auth } = await setup();
    const res = await app.inject({
      method: "PATCH",
      url: routes.me,
      headers: auth,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("400s on an over-long bio", async () => {
    const { app, auth } = await setup();
    const res = await app.inject({
      method: "PATCH",
      url: routes.me,
      headers: auth,
      payload: { bio: "x".repeat(281) },
    });
    expect(res.statusCode).toBe(400);
  });

  it("401s without auth", async () => {
    const { app } = await setup();
    const res = await app.inject({
      method: "PATCH",
      url: routes.me,
      payload: { bio: "hi" },
    });
    expect(res.statusCode).toBe(401);
  });
});
