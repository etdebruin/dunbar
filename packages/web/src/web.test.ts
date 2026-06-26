import type { AddressInfo } from "node:net";
import { buildApp } from "@dunbar/server/app";
import { createMemoryDb } from "@dunbar/server/db/memory";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createWebServer } from "./server.js";

let api: ReturnType<typeof buildApp>;
let web: ReturnType<typeof createWebServer>;
let webUrl: string;
let aliceToken: string;
let postId: string;

beforeEach(async () => {
  api = buildApp({ db: await createMemoryDb() });
  await api.listen({ port: 0, host: "127.0.0.1" });
  const apiAddr = api.server.address() as AddressInfo;
  const apiUrl = `http://127.0.0.1:${apiAddr.port}`;

  // seed: alice with a post
  const reg = await api.inject({
    method: "POST",
    url: "/v1/auth/register",
    payload: { username: "alice", displayName: "Alice" },
  });
  aliceToken = reg.json().token;
  const p = await api.inject({
    method: "POST",
    url: "/v1/posts",
    headers: { authorization: `Bearer ${aliceToken}` },
    payload: { body: "hello from the web test" },
  });
  postId = p.json().id;

  web = createWebServer({ apiUrl });
  await new Promise<void>((r) => web.listen(0, "127.0.0.1", r));
  webUrl = `http://127.0.0.1:${(web.address() as AddressInfo).port}`;
});

afterEach(async () => {
  web.close();
  await api.close();
});

describe("website", () => {
  it("serves the landing page", async () => {
    const res = await fetch(`${webUrl}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("command-line-first");
  });

  it("serves a join page with the CLI flow and API URL", async () => {
    const res = await fetch(`${webUrl}/join`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("How to join");
    expect(html).toContain("DUNBAR_API");
    expect(html).toContain("auth register");
  });

  it("serves an about page crediting the creator", async () => {
    const res = await fetch(`${webUrl}/about`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Etienne de Bruin");
    expect(html).toContain("Why this approach");
  });

  it("renders a profile with posts", async () => {
    const res = await fetch(`${webUrl}/u/alice`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("@alice");
    expect(html).toContain("hello from the web test");
  });

  it("renders a post permalink with author", async () => {
    const res = await fetch(`${webUrl}/p/${postId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("hello from the web test");
    expect(html).toContain("@alice");
  });

  it("404s for an unknown profile", async () => {
    const res = await fetch(`${webUrl}/u/ghost`);
    expect(res.status).toBe(404);
  });

  it("escapes HTML in post bodies", async () => {
    await api.inject({
      method: "POST",
      url: "/v1/posts",
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: { body: "<script>alert(1)</script>" },
    });
    const res = await fetch(`${webUrl}/u/alice`);
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
