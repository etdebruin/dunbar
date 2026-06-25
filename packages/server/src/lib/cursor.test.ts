import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor.js";

describe("cursor", () => {
  it("round-trips a rowid", () => {
    expect(decodeCursor(encodeCursor(42))).toBe(42);
  });

  it("returns null for garbage", () => {
    expect(decodeCursor("not-a-cursor!!")).toBe(null);
    expect(decodeCursor("")).toBe(null);
  });
});
