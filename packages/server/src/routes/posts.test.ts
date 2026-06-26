import { routes } from "@dunbar/shared";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createMemoryDb } from "../db/memory.js";

async function setup() {
  const app = buildApp({ db: await createMemoryDb() });
  const reg = async (username: string) =>
    (
      await app.inject({
        method: "POST",
        url: routes.register,
        payload: { username },
      })
    ).json().token as string;
  return { app, reg };
}

async function post(app: any, token: string, body: string) {
  return app.inject({
    method: "POST",
    url: routes.posts,
    headers: { authorization: `Bearer ${token}` },
    payload: { body },
  });
}

describe("POST /v1/posts", () => {
  it("creates a post authored by the caller", async () => {
    const { app, reg } = await setup();
    const token = await reg("alice");
    const res = await post(app, token, "hello dunbar");
    expect(res.statusCode).toBe(201);
    expect(res.json().body).toBe("hello dunbar");
    expect(res.json().id).toBeTruthy();
  });

  it("401s without auth", async () => {
    const { app } = await setup();
    const res = await app.inject({
      method: "POST",
      url: routes.posts,
      payload: { body: "hi" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("400s on an empty body", async () => {
    const { app, reg } = await setup();
    const token = await reg("alice");
    const res = await post(app, token, "   ");
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /v1/posts/:id", () => {
  it("returns a post publicly", async () => {
    const { app, reg } = await setup();
    const token = await reg("alice");
    const id = (await post(app, token, "hi")).json().id;
    const res = await app.inject({ method: "GET", url: routes.post(id) });
    expect(res.statusCode).toBe(200);
    expect(res.json().body).toBe("hi");
    expect(res.json().author.username).toBe("alice");
  });

  it("404s for an unknown post", async () => {
    const { app } = await setup();
    const res = await app.inject({ method: "GET", url: routes.post("nope") });
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /v1/users/:username/posts", () => {
  it("returns posts newest-first", async () => {
    const { app, reg } = await setup();
    const token = await reg("alice");
    await post(app, token, "first");
    await post(app, token, "second");
    await post(app, token, "third");
    const res = await app.inject({
      method: "GET",
      url: routes.userPosts("alice"),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items.map((p: any) => p.body)).toEqual([
      "third",
      "second",
      "first",
    ]);
  });

  it("paginates with a cursor", async () => {
    const { app, reg } = await setup();
    const token = await reg("alice");
    for (const b of ["a", "b", "c"]) await post(app, token, b);

    const page1 = await app.inject({
      method: "GET",
      url: `${routes.userPosts("alice")}?limit=2`,
    });
    expect(page1.json().items).toHaveLength(2);
    expect(page1.json().items.map((p: any) => p.body)).toEqual(["c", "b"]);
    expect(page1.json().nextCursor).toBeTruthy();

    const page2 = await app.inject({
      method: "GET",
      url: `${routes.userPosts("alice")}?limit=2&before=${page1.json().nextCursor}`,
    });
    expect(page2.json().items.map((p: any) => p.body)).toEqual(["a"]);
    expect(page2.json().nextCursor).toBe(null);
  });
});

describe("DELETE /v1/posts/:id", () => {
  it("deletes the caller's own post", async () => {
    const { app, reg } = await setup();
    const token = await reg("alice");
    const id = (await post(app, token, "bye")).json().id;
    const del = await app.inject({
      method: "DELETE",
      url: routes.post(id),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(del.statusCode).toBe(200);
    const get = await app.inject({ method: "GET", url: routes.post(id) });
    expect(get.statusCode).toBe(404);
  });

  it("403s when deleting someone else's post", async () => {
    const { app, reg } = await setup();
    const alice = await reg("alice");
    const bob = await reg("bob");
    const id = (await post(app, alice, "mine")).json().id;
    const del = await app.inject({
      method: "DELETE",
      url: routes.post(id),
      headers: { authorization: `Bearer ${bob}` },
    });
    expect(del.statusCode).toBe(403);
  });

  it("404s when deleting a missing post", async () => {
    const { app, reg } = await setup();
    const token = await reg("alice");
    const del = await app.inject({
      method: "DELETE",
      url: routes.post("ghost"),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(del.statusCode).toBe(404);
  });
});
