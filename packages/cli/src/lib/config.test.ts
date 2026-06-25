import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readConfig, resolveApiUrl, writeConfig } from "./config.js";

let dir: string;
let path: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "dunbar-test-"));
  path = join(dir, ".dunbar", "config");
});

const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
});

describe("config read/write", () => {
  it("round-trips a config", () => {
    writeConfig({ token: "abc", username: "alice" }, path);
    expect(readConfig(path)).toEqual({ token: "abc", username: "alice" });
  });

  it("returns an empty object when the file is missing", () => {
    expect(readConfig(path)).toEqual({});
  });

  it("writes the file with 0600 permissions", () => {
    writeConfig({ token: "secret" }, path);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
});

describe("resolveApiUrl precedence", () => {
  it("prefers the flag, then config, then env, then default", () => {
    delete process.env.DUNBAR_API;
    expect(
      resolveApiUrl({ flag: "http://flag", config: { apiUrl: "http://cfg" } }),
    ).toBe("http://flag");
    expect(resolveApiUrl({ config: { apiUrl: "http://cfg" } })).toBe(
      "http://cfg",
    );
    process.env.DUNBAR_API = "http://env";
    expect(resolveApiUrl({})).toBe("http://env");
    delete process.env.DUNBAR_API;
    expect(resolveApiUrl({})).toBe("http://127.0.0.1:3000");
  });
});
