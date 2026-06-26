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
| `@dunbar/server` | Fastify HTTP API backed by PostgreSQL (`pg`)                                                     |
| `@dunbar/cli`    | the `dunbar` CLI (Clipanion)                                                                     |
| `@dunbar/web`    | a tiny read-only website (`node:http`, no framework)                                             |

## Requirements

- Node ≥ 22
- pnpm
- PostgreSQL (for running the server; tests use an in-process emulator)

## Setup

```sh
pnpm install
```

## Run it

Create a database and start the API (it migrates on boot):

```sh
createdb dunbar
DATABASE_URL=postgres://localhost:5432/dunbar pnpm --filter @dunbar/server dev   # :3000
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

- **Storage:** PostgreSQL via `pg`. Tests run against an in-process Postgres
  emulator ([pg-mem](https://github.com/oguimbal/pg-mem)) — fast and hermetic,
  no Docker required.
- **Auth:** opaque bearer tokens; only the SHA-256 hash is stored. The config
  file is written `0600`.
- **Pagination:** opaque keyset cursors over a `BIGSERIAL seq` column
  (insertion-stable).
- Browser device-flow login is intentionally **not** in the MVP; the CLI is the
  primary way in.

## Deploy (Fly.io)

Two Fly apps share one image (`Dockerfile`): `dunbar-api` (`fly.toml`) and
`dunbar-web` (`fly.web.toml`). The build bundles each app into one
self-contained file with esbuild; the API migrates on boot and via Fly's
release command.

First-time setup (you run these — they need your Fly account):

```sh
fly auth login

# API + database
fly apps create dunbar-api
fly postgres create --name dunbar-db          # or attach Managed Postgres
fly postgres attach dunbar-db -a dunbar-api   # sets DATABASE_URL secret
# If your Postgres requires TLS (e.g. Managed Postgres / Neon):
#   fly secrets set DATABASE_SSL=true -a dunbar-api
fly deploy --config fly.toml

# Website (point it at the API app's public URL)
fly apps create dunbar-web
fly deploy --config fly.web.toml
```

Then CLI users point at `https://dunbar-api.fly.dev` and the site lives at
`https://dunbar-web.fly.dev`.

### CI/CD

`.github/workflows/ci-cd.yml` runs lint + typecheck + tests on every push/PR,
and deploys both apps to Fly on pushes to `main`. Give it a deploy token once:

```sh
fly tokens create deploy -x 999999h | gh secret set FLY_API_TOKEN
```
