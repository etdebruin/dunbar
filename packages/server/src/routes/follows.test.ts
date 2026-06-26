import { MAX_FOLLOWING, routes } from "@dunbar/shared";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createMemoryDb } from "../db/memory.js";

async function setup() {
  const db = await createMemoryDb();
  const app = buildApp({ db });
  const reg = async (username: string) =>
    (
      await app.inject({
        method: "POST",
        url: routes.register,
        payload: { username },
      })
    ).json() as { token: string; user: { id: string } };
  return { app, db, reg };
}

const follow = (app: any, token: string, username: string) =>
  app.inject({
    method: "POST",
    url: routes.follows,
    headers: { authorization: `Bearer ${token}` },
    payload: { username },
  });

describe("POST /v1/follows", () => {
  it("follows a user and updates both sides", async () => {
    const { app, reg } = await setup();
    const alice = (await reg("alice")).token;
    await reg("bob");

    expect((await follow(app, alice, "bob")).statusCode).toBe(200);

    const following = await app.inject({
      method: "GET",
      url: routes.userFollowing("alice"),
    });
    expect(following.json().map((u: any) => u.username)).toEqual(["bob"]);

    const followers = await app.inject({
      method: "GET",
      url: routes.userFollowers("bob"),
    });
    expect(followers.json().map((u: any) => u.username)).toEqual(["alice"]);
  });

  it("400s when following yourself", async () => {
    const { app, reg } = await setup();
    const alice = (await reg("alice")).token;
    expect((await follow(app, alice, "alice")).statusCode).toBe(400);
  });

  it("404s for an unknown target", async () => {
    const { app, reg } = await setup();
    const alice = (await reg("alice")).token;
    expect((await follow(app, alice, "ghost")).statusCode).toBe(404);
  });

  it("is idempotent on a repeat follow", async () => {
    const { app, reg } = await setup();
    const alice = (await reg("alice")).token;
    await reg("bob");
    await follow(app, alice, "bob");
    expect((await follow(app, alice, "bob")).statusCode).toBe(200);

    const following = await app.inject({
      method: "GET",
      url: routes.userFollowing("alice"),
    });
    expect(following.json()).toHaveLength(1);
  });

  it("422s when exceeding the Dunbar cap", async () => {
    const { app, db, reg } = await setup();
    const alice = await reg("alice");
    // Seed MAX_FOLLOWING follow edges directly.
    for (let i = 0; i < MAX_FOLLOWING; i++) {
      await db.query(
        "INSERT INTO users (id, username, created_at) VALUES ($1, $2, $3)",
        [`t${i}`, `target_${i}`, 1],
      );
      await db.query(
        "INSERT INTO follows (follower_id, followee_id, created_at) VALUES ($1, $2, $3)",
        [alice.user.id, `t${i}`, 1],
      );
    }
    await reg("onemore");
    expect((await follow(app, alice.token, "onemore")).statusCode).toBe(422);
  });
});

describe("DELETE /v1/follows/:username", () => {
  it("unfollows and is idempotent", async () => {
    const { app, reg } = await setup();
    const alice = (await reg("alice")).token;
    await reg("bob");
    await follow(app, alice, "bob");

    const del = () =>
      app.inject({
        method: "DELETE",
        url: routes.unfollow("bob"),
        headers: { authorization: `Bearer ${alice}` },
      });
    expect((await del()).statusCode).toBe(200);
    expect((await del()).statusCode).toBe(200); // idempotent

    const following = await app.inject({
      method: "GET",
      url: routes.userFollowing("alice"),
    });
    expect(following.json()).toHaveLength(0);
  });

  it("401s without auth", async () => {
    const { app } = await setup();
    const res = await app.inject({
      method: "POST",
      url: routes.follows,
      payload: { username: "bob" },
    });
    expect(res.statusCode).toBe(401);
  });
});
