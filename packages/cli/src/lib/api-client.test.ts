import { buildApp } from "@dunbar/server/app";
import { createDb } from "@dunbar/server/db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError, createClient } from "./api-client.js";

let app: ReturnType<typeof buildApp>;
let apiUrl: string;

beforeEach(async () => {
  app = buildApp({ db: createDb(":memory:") });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  apiUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await app.close();
});

describe("createClient", () => {
  it("registers and returns a usable token", async () => {
    const anon = createClient({ apiUrl });
    const { token, user } = await anon.register("alice", "Alice");
    expect(user.username).toBe("alice");

    const authed = createClient({ apiUrl, token });
    expect((await authed.whoami()).username).toBe("alice");
  });

  it("throws ApiError with status on failure", async () => {
    const anon = createClient({ apiUrl });
    await expect(anon.whoami()).rejects.toBeInstanceOf(ApiError);
    await expect(anon.whoami()).rejects.toMatchObject({ status: 401 });
  });

  it("drives the full social loop", async () => {
    const alice = createClient({
      apiUrl,
      token: (await createClient({ apiUrl }).register("alice")).token,
    });
    const bob = createClient({
      apiUrl,
      token: (await createClient({ apiUrl }).register("bob")).token,
    });

    await bob.createPost("hello from bob");
    await alice.follow("bob");

    const feed = await alice.feed();
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.body).toBe("hello from bob");
    expect(feed.items[0]?.author.username).toBe("bob");
  });
});
