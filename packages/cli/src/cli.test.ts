import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Readable } from "node:stream";
import { buildApp } from "@dunbar/server/app";
import { createMemoryDb } from "@dunbar/server/db/memory";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildCli } from "./cli.js";

let app: ReturnType<typeof buildApp>;
let apiUrl: string;
const savedEnv = { ...process.env };

beforeEach(async () => {
  app = buildApp({ db: await createMemoryDb() });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  apiUrl = `http://127.0.0.1:${port}`;
  // isolate the config file per test
  process.env.DUNBAR_HOME = mkdtempSync(join(tmpdir(), "dunbar-cli-"));
  process.env.NO_COLOR = "1";
});

afterEach(async () => {
  await app.close();
  process.env = { ...savedEnv };
});

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

async function run(args: string[], stdin = ""): Promise<RunResult> {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let out = "";
  let err = "";
  stdout.on("data", (c) => (out += c.toString()));
  stderr.on("data", (c) => (err += c.toString()));
  const stdinStream = Object.assign(Readable.from([stdin]), { isTTY: false });

  const code = await buildCli().run(args, {
    stdout,
    stderr,
    stdin: stdinStream as unknown as NodeJS.ReadStream,
  });
  return { code, stdout: out, stderr: err };
}

/** Register and persist a token in the isolated config. */
async function register(username: string): Promise<void> {
  const res = await run([
    "auth",
    "register",
    "--username",
    username,
    "--api",
    apiUrl,
  ]);
  expect(res.code).toBe(0);
}

describe("auth + whoami", () => {
  it("registers then reports the current user", async () => {
    await register("alice");
    const who = await run(["whoami"]);
    expect(who.code).toBe(0);
    expect(who.stdout).toContain("@alice");
  });

  it("whoami fails cleanly when not logged in", async () => {
    const who = await run(["whoami", "--api", apiUrl]);
    expect(who.code).toBe(1);
    expect(who.stderr).toContain("not logged in");
  });

  it("supports --json output", async () => {
    await register("alice");
    const who = await run(["whoami", "--json"]);
    expect(JSON.parse(who.stdout).username).toBe("alice");
  });
});

describe("post + feed", () => {
  it("posts (via stdin) and surfaces it in a follower's feed", async () => {
    await register("bob");
    const posted = await run(["post"], "hello from bob\n");
    expect(posted.code).toBe(0);

    // alice follows bob, then sees the post
    process.env.DUNBAR_HOME = mkdtempSync(join(tmpdir(), "dunbar-cli-"));
    await register("alice");
    await run(["follow", "bob"]);
    const feed = await run(["feed"]);
    expect(feed.stdout).toContain("hello from bob");
    expect(feed.stdout).toContain("@bob");
  });

  it("rejects an empty post", async () => {
    await register("bob");
    const posted = await run(["post", "   "]);
    expect(posted.code).toBe(1);
  });
});

describe("profile", () => {
  it("shows a profile after editing the bio", async () => {
    await register("alice");
    await run(["profile", "edit", "--bio", "building dunbar"]);
    const prof = await run(["profile", "alice"]);
    expect(prof.stdout).toContain("@alice");
    expect(prof.stdout).toContain("building dunbar");
  });
});

describe("following list", () => {
  it("lists who you follow", async () => {
    await register("carol");
    process.env.DUNBAR_HOME = mkdtempSync(join(tmpdir(), "dunbar-cli-"));
    await register("alice");
    await run(["follow", "carol"]);
    const list = await run(["following"]);
    expect(list.stdout).toContain("@carol");
  });
});
