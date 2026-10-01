# Contributing

## Commit messages

Format:

```
type(area): what changed, in the present tense (max ~72 chars)

Why the change was needed and anything a reviewer would not guess from
the diff. Mention how you checked it (tsc, npm test, manual test).
```

**type** — what kind of change:

| type | use for |
|---|---|
| `feat` | a new feature users can see |
| `fix` | a bug fix |
| `refactor` | code moved or rewritten, same behaviour |
| `perf` | faster or cheaper (requests, storage, tokens) |
| `security` | auth, CSRF, CSP, secrets, rate limits |
| `db` | a new `prisma/sql/*.sql` change or schema.prisma update |
| `test` | tests only |
| `docs` | documentation only |
| `chore` | tooling, dependencies, config |

**area** — the folder or feature you touched, so `git log` can be filtered:
`ai`, `agent`, `auth`, `blockchain`, `db`, `mining`, `airdrop`, `payments`,
`mpesa`, `nursery`, `mrv`, `hubs`, `security`, `ui`, `<page name>`.

Examples from this repo:

```
fix(ai): default Groq model to openai/gpt-oss-120b
fix(chat): say plainly when the AI is unavailable instead of a generic menu
refactor(structure): group src/lib and src/components into folders by topic
```

Find every change to one area: `git log --oneline --grep='(ai)'`.

To get this template in your editor on every `git commit`:

```bash
git config commit.template avax-frontend/.gitmessage
```

## Before you push

`main` deploys straight to production on Vercel. Run:

```bash
npx tsc --noEmit && npm test && npx eslint <files you changed>
```

## Where to put new code

- A new page: `src/app/<url>/page.tsx`. A new API: `src/app/api/<url>/route.ts`.
- Logic used by an API route goes in `src/lib/<area>/`, not inside the route
  file, so it can be tested.
- A component used by one page goes in `src/components/<area>/`.
- Tests sit next to the code as `*.test.ts` and run with `node --test`;
  add the file to the `test` script in `package.json`.
- Database changes: see "Database rules" in `README.md`. Never `prisma db push`.
