import type { z } from "zod";
import type {
  authResultSchema,
  createPostRequestSchema,
  followRequestSchema,
  paginationQuerySchema,
  postSchema,
  postWithAuthorSchema,
  publicUserSchema,
  registerRequestSchema,
  updateProfileSchema,
} from "./schemas.js";

export type PublicUser = z.infer<typeof publicUserSchema>;
export type Post = z.infer<typeof postSchema>;
export type PostWithAuthor = z.infer<typeof postWithAuthorSchema>;
export type AuthResult = z.infer<typeof authResultSchema>;

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type CreatePostRequest = z.infer<typeof createPostRequestSchema>;
export type FollowRequest = z.infer<typeof followRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** The standard list envelope returned by paginated endpoints. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
