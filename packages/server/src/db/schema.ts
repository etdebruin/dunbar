/**
 * The full database schema as idempotent DDL (PostgreSQL). Applied on every
 * boot via {@link migrate}; `IF NOT EXISTS` keeps it safe to re-run. For the
 * MVP a single schema document is simpler than versioned migrations.
 *
 * Timestamps are epoch milliseconds stored as BIGINT (they exceed int4 range).
 * `seq` (BIGSERIAL) gives an insertion-stable total order for keyset
 * pagination — Postgres has no implicit rowid like SQLite.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio          TEXT,
  created_at   BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  name         TEXT,
  created_at   BIGINT NOT NULL,
  last_used_at BIGINT,
  revoked_at   BIGINT
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);

CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  seq        BIGSERIAL,
  author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_author_seq ON posts(author_id, seq DESC);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seq         BIGSERIAL,
  created_at  BIGINT NOT NULL,
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee_seq ON follows(followee_id, seq DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower_seq ON follows(follower_id, seq DESC);
`;
