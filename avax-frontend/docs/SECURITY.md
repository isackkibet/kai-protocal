# Security

What is in place, what it actually protects against, and — just as important —
what it does **not** protect against. Written to be useful to whoever picks
this up next, not to look thorough.

Last reviewed: 2026-09-29.

---

## 1. The four findings that mattered

These were live before this work and are the reason to read the rest of this
document.

### 1.1 CRITICAL — customer chose the price, and the reference

`POST /api/paystack/initiate` read `priceUsd` **and** `reference` from the
request body. The browser shipped the price from a catalogue held in client
JavaScript (`app/connft/page.tsx`), and the webhook matches settlement on
`reference`.

Chained into a payment bypass:

1. Create an order at the real price, leaving it `pending`.
2. Start a second Paystack transaction with the **same** `reference` at
   `priceUsd: 0.01`.
3. Pay the 1-kobo charge for real. This produces a **genuine** Paystack event
   with a **genuinely valid HMAC signature**.
4. The webhook matches the reference and marks the expensive order `success`.

Webhook signature verification does not help here — the attacker's payment is
real. The defect was that the server had no authoritative price of its own.

**Fixed:** the server resolves every price from `src/lib/payments/catalog.ts` and mints
every reference itself. A client-sent price is ignored entirely. The webhook
now re-checks the settled amount against the stored `amount_subunits` before
writing `success`, and refuses to settle on mismatch.

### 1.2 CRITICAL — M-Pesa callbacks were trusted, and they are unsigned

`POST /api/mpesa/callback` recorded whatever arrived as a completed payment.
Safaricom's Daraja IPN carries **no HMAC and no verifiable signature**. Anyone
who could reach the URL could POST a fabricated `ResultCode: 0` and have the
app believe a payment succeeded.

**Fixed:** the callback is now treated as a *notification*, never as evidence.
The flow is lookup → STK Query against Safaricom over our authenticated OAuth
channel → settle only if Safaricom confirms. A forged callback fails at the
lookup (no such transaction) or at the query (Safaricom has no record of it).

Pending transactions are stored in **Neon**, not in memory. This is a
correctness requirement, not tidiness: on Vercel the callback may be routed to
a different instance than the one that made the STK push, so an in-memory store
would silently drop real payments.

### 1.3 HIGH — payment status endpoint leaked PII

The old `GET /api/mpesa/callback?checkoutRequestId=…` returned the stored
record to anyone, including the payer's **phone number** and M-Pesa receipt.

**Fixed:** requires a verified session, is scoped to the caller's own
transaction at the query level (no 200-vs-404 existence oracle), and returns
status only.

### 1.4 HIGH — `x402/approve` auth was a self-declared header

The owner guard compared `x-wallet-address` against the owner wallet. Any
client can send any header, so the real requirement was "know a public
address".

**Fixed:** backed by a real signature challenge via `verifyWalletOwnership`.

---

## 2. What is now in place

| Control | Where |
|---|---|
| Layered rate limiting (global / IP / user / endpoint) | `src/lib/security/rate-limit.ts` |
| Client IP resolution + abuse risk signals | `src/lib/security/client-ip.ts` |
| CSRF double-submit cookie + origin check | `src/lib/security/csrf.ts` |
| SQLi / NoSQL / prototype-pollution rejection, XSS sinks | `src/lib/security/input.ts` |
| CSP, HSTS, frame, nosniff, permissions policy, CORS | `src/lib/security/headers.ts` |
| Global request gate | `src/proxy.ts` |
| Per-route auth + rate limiting helper | `src/lib/security/route-guard.ts` |
| Server-side price authority | `src/lib/payments/catalog.ts` |
| M-Pesa pending-transaction tracking | `src/lib/payments/mpesa-transactions.ts` |
| Tests (48 cases) | `src/lib/security/security.test.ts` |

Run them with `npm run test:security`.

### Rate limiting dimensions

- **global** — one shared budget for the deployment. Deliberately *not* keyed by
  route or IP; a flood must not be able to spread itself across endpoints.
- **ip** — one client cannot spend the whole budget.
- **user** — a signed-in account cannot multiply its limit by logging out.
- **endpoint** — money and AI routes get their own, tighter budgets.

### Privilege escalation guard

`assertNoPrivilegeEscalation()` rejects client-supplied
`verificationStatus`, `blockchainStatus`, `avalancheTxHash`, `dataHash`,
`previousHash`, `role` and `pointsAwarded`. This mirrors the MRV PRD's hardest
rule: `verified` and `anchored` are backend-only states.

---

## 3. Honest limitations

Read this before assuming the app is hardened.

### Rate limiting is a backstop, not DDoS protection

The store is **in-process**. On Vercel each serverless instance holds its own
counters, so the effective limit is `configured limit × number of warm
instances`, and everything resets on cold start. It stops scripted abuse and
runaway clients. It does **not** stop volumetric floods.

**You still need edge protection** — see §4.

### VPN detection is a risk signal, not a block

Residential proxies, which are what payment fraud actually uses, are
indistinguishable from ordinary users at the application layer. The code
therefore *raises the tier* (dividing the limit) rather than blocking. A hard
block on commercial VPN ranges would lock out real Kenyan users on carrier NAT
while a fraudster walks straight through.

### SQL injection was never the live risk

All DB access goes through Prisma, which parameterises every query. The only
raw SQL is four `SELECT id … FOR UPDATE` row locks using Prisma's tagged
template — still parameterised. The SQLi filter is a **tripwire**: it rejects
loudly so probing shows up in logs, and it catches the day someone
concatenates a string into a query. Do not treat it as sanitisation.

### CSP is permissive by necessity

Privy renders in an iframe and WalletConnect loads remote iframes, so
`frame-src` and `script-src` are explicit allow-lists rather than `'self'`.
The directives that never need relaxing — `frame-ancestors 'none'`,
`object-src 'none'`, `base-uri 'none'`, `form-action 'self'` — are strict.

Scripts use a per-request nonce. `COEP` is **not** set, because it would block
the very iframes Privy needs.

### CSRF is origin-based; the token is opt-in

Be precise about what this does, because it is easy to over-claim.

`verifyCsrf()` enforces, in order:
1. Safe methods pass.
2. `Sec-Fetch-Site: cross-site` is refused.
3. An `Origin` that is neither same-origin nor allow-listed is refused.
4. **Only if the client sends a token** (cookie or header) is the pair
   verified to match.

So the primary defence is the **origin check**, which is sound: browsers always
attach `Origin` to cross-site POSTs and an attacker's page cannot forge it. The
double-submit token is an *extra* layer that no client currently sends — nothing
in `src/app` reads `kai_csrf_token`. A request with no `Origin` and no token
therefore passes, which is acceptable (that is a non-browser client, and CSRF is
about hijacking a *browser's* ambient credentials), but it is **not** the same
thing as a fully-enforced token scheme.

If you want the token enforced, two steps: have the app set the cookie on a
Server Component, and send the header on mutating fetches.

### Two CSP owners would break the app

CSP is set in `proxy.ts` **only**. `next.config.ts` deliberately sets every
other header but not CSP. Sending two CSP headers makes the browser enforce the
intersection, which silently tightens the nonce policy and breaks login.

**CSP is currently REPORT-ONLY, not enforcing.** The proxy sends
`Content-Security-Policy-Report-Only` unless `CSP_ENFORCE=true`, because
enforcing a nonce policy breaks every prerendered page and silently kills Privy
login. Practically: the other headers (`X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy`) **are** live right now; CSP is
observation only. Flip `CSP_ENFORCE=true` once the console is clean.

### M-Pesa reconciliation is manual

The STK Query response does not include the amount actually charged, so the
request-time path cannot confirm the charged figure from Safaricom. Verifying
that a given reference was billed the expected amount requires a Safaricom
reconciliation report against the shortcode. Do that as an ops task.

### Proxy is not the security boundary

`src/proxy.ts` is a cheap pre-filter. Next's own documentation is explicit
that it must not be the only authorization. Sensitive routes authenticate in
their own handlers, deliberately, so a mis-scoped `config.matcher` cannot open
the app.

---

## 4. Recommended next steps, in order

1. **Edge rate limiting (do this first).** Dashboard → **your project** →
   **Firewall** in the sidebar → *Configure* (top right) → **+ New Rule**.
   Conditions: `Path starts with /api/` → *Then*: **Rate Limit** → *Fixed
   Window* → 60s → Request Limit → counting key **IP** → action **429**.
   First rule prompts a pricing dialog — 1M allowed requests/month is included.

   ⚠️ **On the Hobby plan you get exactly ONE rate limit rule per project**
   (up to 3 total custom firewall rules, fixed window only, 10s–10min). So
   write it as one broad `/api/*` rule, not separate payment/chat rules — the
   per-endpoint granularity you want lives in `src/lib/security/rate-limit.ts`
   where it is cheap and exact. On Pro you get 40 rules and can split them.
2. **Turn on Vercel Attack Challenge** for `/api/*` to cut scripted traffic cheaply.
3. **Set `NEXT_PUBLIC_SITE_URL`** in every Vercel environment. CORS and CSRF fail
   closed; if it is wrong, forms silently stop working.
4. **Fill in `MPESA_ALLOWED_IPS`** from Safaricom's current list.
5. **Rotate `ADMIN_API_KEY`** and audit who holds `x-admin-key`.
6. **Run `npm audit` and `npx @next/codemod@canary middleware-to-proxy .`** —
   the repo was already on Next 16's proxy convention, but confirm nothing else
   depends on the deprecated name.
7. **Move rate-limit counters to a shared store** (Upstash Redis / Vercel KV) if
   you need limits to hold across instances. `RateLimitStore` is the seam.
8. **Add CSP `report-only` rollout** before tightening further:
   `Content-Security-Policy-Report-Only` with a reporting endpoint, watch for a
   week, then enforce.

---

## 5. Operational rules

- **Never commit a secret.** `.env.local` is gitignored. A key pasted into a
  chat, a ticket or a commit history is compromised — rotate it.
- **Rotate any key that has been shared in plain text**, starting with any
  `NVIDIA_API_KEY` exposed in conversation.
- Prices live in `src/lib/payments/catalog.ts`. The client copy in
  `app/connft/page.tsx` is display-only; if they disagree, the server wins.
- Do not treat a self-declared header (`x-wallet-address`, `x-admin-key`) as
  identity. Verify a signature.
- Webhooks are signature-authenticated and must stay exempt from CSRF. Everything
  else that changes state needs the token.

---

## 6. Checking the current state yourself

`GET /api/admin/diagnostics` (admin key required) reports live posture: which
secrets are set (never their values), whether the configured CSRF origin is
actually accepted, the live rate-limit policies, catalogue size, and database
reachability.

```
curl -H "x-admin-key: $ADMIN_API_KEY" https://your-domain/api/admin/diagnostics
```

The `csrf.status` field is the one to watch: it reads
`MISCONFIGURED — configured origin is rejected` in production when
`NEXT_PUBLIC_SITE_URL` is wrong, which means **every state-changing request
will 403**. In development it is a non-finding, because localhost origins are
allowed by default.

`npm run test:security` covers the primitives, including two guards worth
knowing about:

- **catalog price authority** — fails if the storefront and the server ever
  disagree on a price. This is the regression test for finding 1.1.
- **abuse risk scoring** — fails if platform forwarding headers or a browser
  `fetch()`'s `Accept` header are ever counted as risk again. This caught a
  live bug where every real user's AI quota was silently quartered to 5/min.
