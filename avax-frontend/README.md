# KAI Nuvari — web app (`avax-frontend`)

Next.js 16 app for the KAI Nuvari / Canuvari ecosystem: wallet + Privy login,
daily KAI drop, airdrop, swaps and vaults on Avalanche Fuji, M-Pesa / Paystack
payments, the Oloolua CFA tree nursery (MRV), the information hubs, and the
KAI AI assistant (chat + voice).

- Live: https://avax-frontend-seven.vercel.app (deploys from `main` on Vercel)
- Database: Neon Postgres through Prisma
- Read `AGENTS.md` first: this Next.js version differs from older docs
  (`proxy.ts` instead of middleware, `params` is a Promise, ...).

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
npm test                     # all unit tests (no DB or network needed)
npm run test:integration     # nursery/verification/evidence/anchoring against a throwaway Docker Postgres
npx tsc --noEmit             # type check
npx eslint src               # lint
```

## Folder map

```
src/
├── proxy.ts            Runs before every request: rate limits, CSRF, security headers
├── app/                Pages and API routes. The folder path IS the URL.
│   ├── <page>/page.tsx     e.g. app/nursery/page.tsx  ->  /nursery
│   └── api/<name>/route.ts e.g. app/api/mine/claim    ->  POST /api/mine/claim
├── components/         React pieces used by pages
│   ├── ai/             KAI chat window, approval cards
│   ├── cfa/            Nursery screen, CFA admin panel, evidence (photos), AI confirm card
│   ├── mrv/            Verification desk (/mrv), proof check, signed credentials
│   ├── workspace/      Kanuvari AI workspace (/workspace): sidebar, orb, input bar, record card
│   ├── conservation/   Conservation hub header and shell
│   ├── hub/            Information hub article widgets
│   ├── pools/          Pools page: bubbles canvas, drawer, stats
│   ├── providers/      Privy, wagmi, React Query wrappers (wrap the whole app)
│   ├── rewards/        Daily check-in, airdrop claim, claim celebration
│   ├── shared/         Top header, bottom nav, page layout
│   ├── wallet/         Wallet connect modal
│   ├── ui/             Small generic UI (QR code)
│   └── unused/         Not imported anywhere. Reuse or delete; see its README.
├── hooks/              React hooks (balances, NFTs, voice agent, animated numbers)
├── store/              Zustand client state (chat, approvals)
└── lib/                Server + shared logic. No React pages here.
    ├── ai/             KAI brain (LangChain, model fallback), Nursery Agent
    │                   (nursery-agent.ts), secret redaction, chat formatting
    ├── agent/          AI tools: prices, balances, swap/pay plans, escrow ABI
    ├── airdrop/        Airdrop engine (+ tests)
    ├── auth/           Who is calling: Privy token check, admin check, wallet signatures
    ├── blockchain/     Contract addresses, ABIs, token list, wagmi config.
    │                   *.json files here are WRITTEN by the deploy scripts.
    ├── db/             Prisma client; getPrisma() returns null when DATABASE_URL is missing
    ├── defi/           Portfolio Agent tools: live pool/vault/token reads (chain.ts),
    │                   swap/LP/vault/IL math matching the contracts (math.ts), plans,
    │                   Yield Optimizer (yield.ts), admin-created vaults (vaults.ts) (+ tests)
    ├── identity/       DIDs (did:web for the CFA, did:pkh for wallets) and verifiable
    │                   credentials signed with EIP-712 in the issuer's own wallet
    ├── hubs/           SIHU + Oloolua hub data, theme, AI review
    ├── mining/         Daily drop engine, config, math (+ tests)
    ├── mrv/            MRV records: canonical JSON + SHA-256 (records.ts), human
    │                   verification (verification.ts), Merkle tree (merkle.ts),
    │                   Avalanche anchoring (anchor.ts), Verification Agent tools (+ tests)
    ├── nursery/        Nursery DB helpers, validation, evidence storage, and the
    │                   agent TOOLS (tools.ts, cfa-tools.ts, quality.ts: reports,
    │                   data quality, audit; plain functions, PRD tool contract) (+ tests)
    ├── operations/     Nuvari operation schemas
    ├── payments/       M-Pesa, Paystack, server-side price catalogue
    ├── security/       Rate limit, CSRF, CSP headers, input limits (+ tests)
    └── ui/             SDG icons
prisma/
├── schema.prisma       Prisma models
└── sql/*.sql           Database changes. Apply with `prisma db execute`, see below.
scripts/                One-off scripts (token deploy, M-Pesa credentials)
docs/                   PRDs and design notes (SECURITY.md, db-integration.md, ...)
```

## Where does this error come from?

| You see... | Look in |
|---|---|
| A page looks wrong or crashes | `src/app/<page>/page.tsx`, then the components it imports |
| `500` from `/api/xyz` | `src/app/api/xyz/route.ts`; Vercel → Logs, filter by that path |
| `401 Unauthorized` | `src/lib/auth/` (Privy token or admin key) |
| `403 Forbidden` / CSRF / "origin" | `src/lib/security/csrf.ts`, and `CSRF_ALLOWED_ORIGINS` in Vercel env |
| `429 Too many requests` | `src/lib/security/rate-limit.ts` (`POLICIES`) |
| Page blocked by CSP in browser console | `src/lib/security/headers.ts` (`buildCsp`) |
| "database unavailable" / Prisma `P1001`, `P1017` | `DATABASE_URL` in Vercel; `src/lib/db/` |
| Prisma "column does not exist" | `prisma/schema.prisma` vs the SQL in `prisma/sql/` |
| Daily drop / mining claim fails | `src/app/api/mine/claim/route.ts`, `src/lib/mining/` |
| Airdrop, missions, referrals | `src/app/api/airdrop/`, `src/lib/airdrop/` |
| M-Pesa STK push or callback | `src/app/api/mpesa/`, `src/lib/payments/mpesa*.ts` |
| Wrong price charged | `src/lib/payments/catalog.ts` (the only price authority) |
| Wrong token / contract address | `src/lib/blockchain/` JSON files (re-run the deploy script) |
| AI says "no AI provider is reachable" | Vercel logs, search `[kai-brain]`; API keys in Vercel env; `src/lib/ai/brain.ts` |
| AI gives a wrong number (price, APY, balance) | The tool that fetched it: `src/lib/agent/tools.ts`, or `src/lib/defi/` for pools, vaults and portfolio |
| Portfolio / swap / vault numbers look off | `src/lib/defi/chain.ts` (live Fuji reads, 1-minute cache) and `src/lib/defi/math.ts` (same formulas as the contracts) |
| Reports, quality metrics, "inventory does not reconcile" | `src/lib/nursery/quality.ts`; rules in `src/lib/nursery/quality-rules.ts` |
| Audit download fails | `src/app/api/cfa/audit/export/route.ts` (admins, auditors, verifiers only) |
| Compliance score / anomalies look wrong | `src/lib/nursery/compliance.ts`; scoring in `compliance-rules.ts` |
| Credential "not valid" | `src/lib/identity/credentials.ts` `verifyCredential` names the failing check; CFA keys at `/cfa/<cfa id>/did.json` |
| "Only a DeFi admin wallet can create vaults" | `DEFI_ADMIN_WALLETS` in Vercel (comma-separated), default the deployer; `src/lib/defi/vaults.ts` |
| Members get "only site managers…" | Manage the CFA → CFA details: the site-manager switch (`cfa.metadata.inventory_requires_site_manager`) |
| AI answer about the nursery or account | `src/lib/nursery/tools.ts` (the data), `src/lib/ai/nursery-agent.ts` (rules), `appDataTools` in `src/lib/ai/brain.ts` |
| Nursery "Confirm and save" card fails | The error text comes from the `/api/cfa/*` route named in the draft; card is `src/components/cfa/NurseryConfirmCard.tsx` (chat) or `src/components/workspace/RecordCard.tsx` (workspace) |
| Workspace orb stuck on "Thinking…" / no answer | `src/app/api/workspace/chat/route.ts` (SSE: status → tool → plan → token → done); Vercel logs `[workspace/chat]` |
| Records saved offline never arrive | `src/lib/workspace/storage.ts` queue; sent on reconnect by `Workspace.tsx` `flushQueue` |
| Nursery forms / CFA data | `src/app/api/cfa/`, `src/lib/nursery/`, `src/components/cfa/NurseryTab.tsx` |
| Transfer / loss of seedlings | `src/app/api/cfa/transfer/route.ts`, `src/app/api/cfa/loss/route.ts` |
| Members, roles, CFA profile | `src/app/api/cfa/members/`, `src/app/api/cfa/profile/`, `src/components/cfa/CfaAdminPanel.tsx` |
| Photo / PDF upload fails | `src/app/api/cfa/evidence/route.ts`, rules in `src/lib/nursery/evidence-rules.ts` (3 MB, JPEG/PNG/WebP/PDF); proxy body limit in `src/proxy.ts` |
| "Only a verifier…", verify/reject errors | `src/lib/mrv/verification.ts` (who may decide, allowed status changes) |
| Anchoring on Avalanche fails | `src/lib/mrv/anchor.ts`, `src/components/mrv/VerificationDesk.tsx` (wallet step); Fuji RPC `AVAX_RPC_URL` |
| /verify page says the proof fails | `src/lib/mrv/anchor.ts` `verifyRecordAnchor` — the failing step is named |
| Playground policy won't save / "payment…" errors | `src/app/api/policies/route.ts` (checks the fee on Fuji), rules in `src/lib/policies/payment.ts`; table `playground_policies` |
| KAI website (/kai, /kaiweb) words or layout | Edit `scripts/build-kaiweb.py`, then run `python3 scripts/build-kaiweb.py`; styles in `public/kaiweb/css/kai.css` |
| Login (Privy) fails | `src/components/providers/PrivyAuthProvider.tsx`; allowed origins in the Privy dashboard |

Server logs prefix their source in square brackets, e.g. `[kai-brain]`,
`[/api/agent]`. Search the code for that prefix to find where the log line
is written.

## Database rules (important)

- **Never run `prisma db push`.** The database also holds tables, views,
  triggers and CHECK rules that exist only in `prisma/sql/*.sql` (and tables
  used by the Oloolua hub). `db push` would drop them.
- To change the schema: add a new file `prisma/sql/YYYY-MM-DD_what.sql`, apply it with
  `npx prisma db execute --file prisma/sql/<file>.sql --schema prisma/schema.prisma`,
  then update `prisma/schema.prisma` to match and run `npx prisma generate`.

## Hedera Guardian

Design and schemas only so far: see [docs/guardian/README.md](docs/guardian/README.md).

## AI providers

`src/lib/ai/brain.ts` tries the models in order and skips one that is rate
limited: Gemini → Groq (`GROQ_MODEL`, then `GROQ_FALLBACK_MODEL`) → NVIDIA.
Keys live only in Vercel env / `.env.local`, never in code.

## Commits

See [CONTRIBUTING.md](CONTRIBUTING.md) for the commit message format.
