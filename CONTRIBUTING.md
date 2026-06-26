# Contributing to dunbar

Thanks for wanting to help. dunbar is a small, command-line-first social
network (see the [README](./README.md) for the what and the
[about page](https://dunbar-web.fly.dev/about) for the why).

- **Live API:** https://dunbar-api.fly.dev
- **Live website:** https://dunbar-web.fly.dev
- **Maintainer:** Etienne de Bruin

## How a change reaches production

This is the part that isn't obvious, so here it is plainly:

1. **Branch or fork** and make your change.
2. **Open a pull request** against `main`. GitHub Actions runs
   **lint + typecheck + tests** on every PR (`.github/workflows/ci-cd.yml`).
3. A maintainer reviews and merges. **Merging to `main` auto-deploys** both
   apps to Fly.io — the API (`dunbar-api`) and the website (`dunbar-web`) — via
   the same workflow. There is no separate "deploy" step you run by hand.

You don't need any Fly.io credentials to contribute: the deploy step uses the
maintainer's deploy token and only runs on pushes to `main`, not on PRs. So
"contributing to the production site" just means **getting your PR merged** —
the deploy is automatic from there. (A merge typically takes a couple of
minutes to roll out; watch the Actions tab.)

## Local setup

Prerequisites: **Node ≥ 22**, **pnpm**, and **PostgreSQL** (only needed to run
the server — the test suite uses an in-process Postgres and needs nothing
installed).

```sh
git clone https://github.com/etdebruin/dunbar
cd dunbar
pnpm install
```

Run the stack locally:

```sh
createdb dunbar
# API (migrates on boot) → http://127.0.0.1:3000
DATABASE_URL=postgres://localhost:5432/dunbar pnpm --filter @dunbar/server dev
# Website → http://127.0.0.1:4321
DUNBAR_API=http://127.0.0.1:3000 pnpm --filter @dunbar/web dev
# CLI against your local API
DUNBAR_API=http://127.0.0.1:3000 pnpm --filter dunbar dev auth register --username you
```

## Checks (run these before pushing)

```sh
pnpm test        # vitest across all packages (uses pg-mem; no DB required)
pnpm typecheck   # tsc --noEmit per package
pnpm lint        # eslint
pnpm format      # prettier --write
```

CI runs the first three and will block a PR if any fail, so run them locally
first. We work **test-first**: add or update tests with your change.

## Project layout

| Package                   | What it is                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@dunbar/shared`          | zod schemas, types, and the API route contract — the single source of truth shared by everything else |
| `@dunbar/server`          | the Fastify API + Postgres                                                                            |
| `dunbar` (`packages/cli`) | the CLI                                                                                               |
| `@dunbar/web`             | the read-only website                                                                                 |

## Conventions

- **Keep the contract in `@dunbar/shared`.** Endpoints, request/response shapes,
  and pagination live there so the server, CLI, and website never drift. Change
  the schema there first, then the server and clients follow.
- **Schema/DB changes:** the server applies an idempotent schema on boot
  (`packages/server/src/db/schema.ts`). Keep changes additive and idempotent
  (`CREATE TABLE/INDEX IF NOT EXISTS`); if you need ordered or destructive
  migrations, raise it in your PR so we add a proper migration step.
- **Small, focused PRs** with a clear description. Match the surrounding code
  style; `pnpm format` handles formatting.

## Reporting bugs / ideas

Open an issue at https://github.com/etdebruin/dunbar/issues with steps to
reproduce (for bugs) or the problem you're trying to solve (for features).
Remember the ethos: dunbar is deliberately small — features that push toward
endless scroll, growth-hacking, or breaking the 150-follow cap are unlikely to
land.
