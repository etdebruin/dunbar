import { describe, expect, it } from "vitest";
import {
  bioSchema,
  displayNameSchema,
  paginatedSchema,
  paginationQuerySchema,
  postBodySchema,
  postSchema,
  publicUserSchema,
  registerRequestSchema,
  updateProfileSchema,
  usernameSchema,
} from "./index.js";

describe("usernameSchema", () => {
  it("lowercases and trims input", () => {
    expect(usernameSchema.parse("  Etienne_99  ")).toBe("etienne_99");
  });

  it.each(["ab", "a".repeat(21), "has space", "no-dash", "café", ""])(
    "rejects %j",
    (bad) => {
      expect(usernameSchema.safeParse(bad).success).toBe(false);
    },
  );

  it.each(["abc", "a_b_c", "user123", "a".repeat(20)])("accepts %j", (ok) => {
    expect(usernameSchema.safeParse(ok).success).toBe(true);
  });
});

describe("postBodySchema", () => {
  it("accepts normal text and trims", () => {
    expect(postBodySchema.parse("  hello world  ")).toBe("hello world");
  });

  it("rejects empty / whitespace-only", () => {
    expect(postBodySchema.safeParse("").success).toBe(false);
    expect(postBodySchema.safeParse("   ").success).toBe(false);
  });

  it("rejects over 1000 chars", () => {
    expect(postBodySchema.safeParse("x".repeat(1001)).success).toBe(false);
    expect(postBodySchema.safeParse("x".repeat(1000)).success).toBe(true);
  });
});

describe("profile field schemas", () => {
  it("displayName allows up to 80 chars, rejects longer", () => {
    expect(displayNameSchema.safeParse("Jane Doe").success).toBe(true);
    expect(displayNameSchema.safeParse("n".repeat(81)).success).toBe(false);
  });

  it("bio allows up to 280 chars and may be empty", () => {
    expect(bioSchema.safeParse("").success).toBe(true);
    expect(bioSchema.safeParse("b".repeat(280)).success).toBe(true);
    expect(bioSchema.safeParse("b".repeat(281)).success).toBe(false);
  });

  it("updateProfile rejects an empty object", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("updateProfile accepts a partial update", () => {
    expect(updateProfileSchema.safeParse({ bio: "hi" }).success).toBe(true);
  });
});

describe("registerRequestSchema", () => {
  it("requires a username, displayName optional", () => {
    expect(registerRequestSchema.safeParse({ username: "eti" }).success).toBe(
      true,
    );
    expect(registerRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("publicUserSchema / postSchema", () => {
  const user = {
    id: "u1",
    username: "et",
    displayName: "Et",
    bio: null,
    createdAt: 1_700_000_000_000,
  };

  it("validates a public user", () => {
    expect(publicUserSchema.safeParse(user).success).toBe(true);
  });

  it("validates a post", () => {
    const post = {
      id: "p1",
      authorId: "u1",
      body: "hello",
      createdAt: 1_700_000_000_000,
    };
    expect(postSchema.safeParse(post).success).toBe(true);
  });
});

describe("pagination", () => {
  it("defaults limit to 20 and clamps range", () => {
    expect(paginationQuerySchema.parse({}).limit).toBe(20);
    expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("coerces a numeric string limit (query params are strings)", () => {
    expect(paginationQuerySchema.parse({ limit: "5" }).limit).toBe(5);
  });

  it("builds a paginated response schema around an item", () => {
    const schema = paginatedSchema(postSchema);
    const ok = schema.safeParse({ items: [], nextCursor: null });
    expect(ok.success).toBe(true);
  });
});
