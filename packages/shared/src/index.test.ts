import { describe, expect, it } from "vitest";
import { MAX_FOLLOWING, PRODUCT_NAME } from "./index.js";

describe("shared package", () => {
  it("exposes the product name", () => {
    expect(PRODUCT_NAME).toBe("dunbar");
  });

  it("caps following at Dunbar's number", () => {
    expect(MAX_FOLLOWING).toBe(150);
  });
});
