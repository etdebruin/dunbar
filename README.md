# dunbar

A command-line-first social network. Small by design.

People do almost everything from the terminal — register, post, follow, read
their feed — and there's a quiet, read-only website for viewing public profiles
and posts. The name is [Dunbar's number](https://en.wikipedia.org/wiki/Dunbar%27s_number):
you can follow at most **150** people. That's the point.

## Layout

A pnpm + TypeScript monorepo (ESM throughout):

| Package          | What it is                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `@dunbar/shared` | zod schemas, inferred types, and the API route contract — shared by everything so nothing drifts |
| `@dunbar/server` | Fastify HTTP API backed by SQLite (Node's built-in `node:sqlite`)                                |
| `@dunbar/cli`    | the `dunbar` CLI (Clipanion)                                                                     |
| `@dunbar/web`    | a tiny read-only website (`node:http`, no framework)                                             |

## Requirements

- Node ≥ 22 (uses the built-in `node:sqlite`; developed on Node 26)
- pnpm

## Setup

```sh
pnpm install
```

## Run it

Start the API (file-backed SQLite at `data/dunbar.db` by default):

```sh
pnpm --filter @dunbar/server dev          # http://127.0.0.1:3000
```

Use the CLI (in another shell). Point it at the API with `--api` or `$DUNBAR_API`;
the URL and token are saved to `~/.dunbar/config` after you register.

```sh
export DUNBAR_API=http://127.0.0.1:3000
pnpm --filter @dunbar/cli dev auth register --username alice --name "Alice"
pnpm --filter @dunbar/cli dev post "hello from the terminal"
pnpm --filter @dunbar/cli dev follow bob
pnpm --filter @dunbar/cli dev feed
pnpm --filter @dunbar/cli dev profile alice
```

Every command supports `--json` for scripting and `--no-color`.

Run the website:

```sh
DUNBAR_API=http://127.0.0.1:3000 pnpm --filter @dunbar/web dev   # http://127.0.0.1:4321
```

Then open `/u/alice` or `/p/<id>`.

## CLI commands

```
dunbar auth register --username <u> [--name <display>]
dunbar auth logout
dunbar whoami
dunbar post "<text>"        # or: dunbar post --file <path>, or pipe via stdin
dunbar follow <username>
dunbar unfollow <username>
dunbar following [username]
dunbar followers [username]
dunbar feed [--limit N] [--before <cursor>]
dunbar profile [username]
dunbar profile edit [--name "<name>"] [--bio "<bio>"]
```

## Develop

```sh
pnpm test          # vitest across all packages
pnpm typecheck     # tsc --noEmit per package
pnpm lint          # eslint
pnpm format        # prettier --write
```

### Notes

- **Storage:** Node's built-in `node:sqlite` — no native module to compile.
- **Auth:** opaque bearer tokens; only the SHA-256 hash is stored. The config
  file is written `0600`.
- **Pagination:** opaque keyset cursors over SQLite `rowid` (insertion-stable).
- Browser device-flow login is intentionally **not** in the MVP; the CLI is the
  primary way in.
