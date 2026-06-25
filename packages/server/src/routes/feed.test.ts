import { routes } from "@dunbar/shared";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createDb } from "../db/index.js";

async function setup() {
  const app = buildApp({ db: createDb(":memory:") });
  const reg = async (username: string) =>
    (
      await app.inject({
        method: "POST",
        url: routes.register,
        payload: { username },
      })
    ).json().token as string;
  const post = (token: string, body: string) =>
    app.inject({
      method: "POST",
      url: routes.posts,
      headers: { authorization: `Bearer ${token}` },
      payload: { body },
    });
  const follow = (token: string, username: string) =>
    app.inject({
      method: "POST",
      url: routes.follows,
      headers: { authorization: `Bearer ${token}` },
      payload: { username },
    });
  const feed = (token: string, qs = "") =>
    app.inject({
      method: "GET",
      url: `${routes.feed}${qs}`,
      headers: { authorization: `Bearer ${token}` },
    });
  return { app, reg, post, follow, feed };
}

describe("GET /v1/feed", () => {
  it("shows posts from followed users, newest-first, excluding own", async () => {
    const { reg, post, follow, feed } = await setup();
    const alice = await reg("alice");
    const bob = await reg("bob");
    const carol = await reg("carol");

    await post(bob, "from bob");
    await post(carol, "from carol");
    await post(alice, "from alice (own)");

    await follow(alice, "bob");
    await follow(alice, "carol");

    const res = await feed(alice);
    expect(res.statusCode).toBe(200);
    const bodies = res.json().items.map((p: any) => p.body);
    expect(bodies).toEqual(["from carol", "from bob"]);
    // each item carries its author
    expect(res.json().items[0].author.username).toBe("carol");
  });

  it("is empty when you follow no one", async () => {
    const { reg, post, feed } = await setup();
    const alice = await reg("alice");
    const bob = await reg("bob");
    await post(bob, "lonely");
    const res = await feed(alice);
    expect(res.json().items).toEqual([]);
    expect(res.json().nextCursor).toBe(null);
  });

  it("paginates with a cursor", async () => {
    const { reg, post, follow, feed } = await setup();
    const alice = await reg("alice");
    const bob = await reg("bob");
    await follow(alice, "bob");
    for (const b of ["1", "2", "3"]) await post(bob, b);

    const p1 = await feed(alice, "?limit=2");
    expect(p1.json().items.map((p: any) => p.body)).toEqual(["3", "2"]);
    expect(p1.json().nextCursor).toBeTruthy();

    const p2 = await feed(alice, `?limit=2&before=${p1.json().nextCursor}`);
    expect(p2.json().items.map((p: any) => p.body)).toEqual(["1"]);
    expect(p2.json().nextCursor).toBe(null);
  });

  it("401s without auth", async () => {
    const { app } = await setup();
    const res = await app.inject({ method: "GET", url: routes.feed });
    expect(res.statusCode).toBe(401);
  });
});
