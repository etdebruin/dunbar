import { MAX_FOLLOWING } from "@dunbar/shared";
import type { Db } from "../db/index.js";
import { findUserByUsername } from "../repos/users.js";
import {
  countFollowing,
  deleteFollow,
  insertFollow,
  isFollowing,
} from "../repos/follows.js";

/** Whether a user is below the Dunbar following cap. */
export function canFollowMore(db: Db, followerId: string): boolean {
  return countFollowing(db, followerId) < MAX_FOLLOWING;
}

export type FollowOutcome =
  | "followed"
  | "already"
  | "self"
  | "not_found"
  | "limit";

/** Follow a user by handle, enforcing self/duplicate/limit rules in one place. */
export function followUser(
  db: Db,
  followerId: string,
  targetUsername: string,
): FollowOutcome {
  const target = findUserByUsername(db, targetUsername);
  if (!target) return "not_found";
  if (target.id === followerId) return "self";
  if (isFollowing(db, followerId, target.id)) return "already";
  if (!canFollowMore(db, followerId)) return "limit";
  insertFollow(db, followerId, target.id, Date.now());
  return "followed";
}

export type UnfollowOutcome = "unfollowed" | "not_following" | "not_found";

export function unfollowUser(
  db: Db,
  followerId: string,
  targetUsername: string,
): UnfollowOutcome {
  const target = findUserByUsername(db, targetUsername);
  if (!target) return "not_found";
  return deleteFollow(db, followerId, target.id)
    ? "unfollowed"
    : "not_following";
}
