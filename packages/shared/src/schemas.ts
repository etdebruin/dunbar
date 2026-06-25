import { z } from "zod";

// ── Primitives ──────────────────────────────────────────────────────────────

/** A handle: 3–20 chars of lowercase letters, digits, underscore. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/** Validates and normalizes a username (trims + lowercases, then checks shape). */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().regex(USERNAME_RE, "invalid username"));

/** Free text of a post: 1–1000 chars after trimming. */
export const postBodySchema = z
  .string()
  .trim()
  .min(1, "post cannot be empty")
  .max(1000, "post is too long (max 1000 chars)");

export const displayNameSchema = z.string().trim().max(80);

export const bioSchema = z.string().trim().max(280);

const timestampSchema = z.number().int().nonnegative();

// ── Entities (API representations) ───────────────────────────────────────────

export const publicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: timestampSchema,
});

export const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: timestampSchema,
});

/** A post enriched with its author, used by feeds and profile listings. */
export const postWithAuthorSchema = postSchema.extend({
  author: publicUserSchema,
});

// ── Request payloads ─────────────────────────────────────────────────────────

export const registerRequestSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema.optional(),
});

export const createPostRequestSchema = z.object({
  body: postBodySchema,
});

export const followRequestSchema = z.object({
  username: usernameSchema,
});

/** PATCH /me — at least one field must be present. */
export const updateProfileSchema = z
  .object({
    displayName: displayNameSchema.nullable().optional(),
    bio: bioSchema.nullable().optional(),
  })
  .refine((v) => v.displayName !== undefined || v.bio !== undefined, {
    message: "provide at least one field to update",
  });

// ── Pagination ───────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.string().optional(),
});

/** Wraps an item schema in the standard `{ items, nextCursor }` envelope. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

// ── Auth responses ───────────────────────────────────────────────────────────

export const authResultSchema = z.object({
  token: z.string(),
  user: publicUserSchema,
});
