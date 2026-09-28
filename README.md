<div align="center">

# KAI Nuvari

**Community finance and conservation rewards on Avalanche.**

[![Live demo](https://img.shields.io/badge/live%20demo-open%20app-10b981?logo=vercel&logoColor=white&style=for-the-badge)](https://avax-frontend-seven.vercel.app/)
[![Network](https://img.shields.io/badge/network-Avalanche%20Fuji-e84142?logo=avalanche&style=for-the-badge)](https://testnet.snowtrace.io)
[![License](https://img.shields.io/badge/license-ISC-6b7280?style=for-the-badge)](#license)

<img src="docs/screenshots/home.png" alt="KAI Nuvari home screen" width="880" />

</div>

## What this is

A web app where you put crypto to work and get rewarded for real-world conservation work, on the Avalanche network. Three things happen here:

- **Put money to work.** Deposit into yield vaults, add liquidity to pools, or swap tokens. Real contracts, real transactions.
- **Earn points daily.** Come back every 24 hours to claim points, finish missions, and invite friends. The more active you are, the more you claim.
- **Learn and ask.** Read news and conservation guides, or talk to the built-in AI agent.

<img src="docs/screenshots/mine.png" alt="The daily points claim screen" width="600" />

## How points work

Points are an in-app score, not a token. Nothing is deposited to your wallet when you claim.

| Action | Reward |
|---|---|
| Daily claim | 10 points, multiplied by your activity level (up to 5x) |
| Missions | 10 to 100 points each, verified server-side |
| Referrals | 20% of each active friend's points |
| Auto-Miner | 0.05 points per second while the page is open |

Two things worth knowing:

- **One claim per 24 hours.** The timer starts when you claim, not at midnight.
- **5% of every claim goes to a treasury**, so a 10-point claim credits you 9.5.

**At the mainnet snapshot, points convert into NVR tokens.** Until then they are just a number in your account.

## Tech stack

| Layer | What we use | For what |
|---|---|---|
| Framework | Next.js 16, React 19, TypeScript | The web app and its API routes |
| Styling | Tailwind CSS 4, framer-motion, lucide-react | Design system and animation |
| Blockchain | viem, wagmi, `@avalanche-sdk/chainkit` | Wallet connection, reads, writes |
| Smart contracts | Solidity, Hardhat, OpenZeppelin | Vaults, AMM, pools, escrow, airdrop vault |
| Auth | Privy | Google or email login, embedded wallet |
| Database | Prisma, Neon Postgres | Users, wallets, claims, referrals |
| Payments | Paystack | KES on-ramp and off-ramp |
| AI | FastAPI, Groq, Gemini, cactus-needle | Agent API, RAG answers, voice |
| State | TanStack Query, Zustand | Server cache and client state |

## Project layout

| Folder | What's inside |
|---|---|
| [`avax-frontend/`](avax-frontend) | The Next.js app, its API routes, and the Prisma schema |
| [`contracts/`](contracts) | Solidity contracts and their `*.t.sol` tests |
| [`scripts/`](scripts) | Deploy and liquidity-seeding scripts for Fuji |
| [`ignition/`](ignition) | Hardhat Ignition deployment modules |
| `server.py` | The Python AI agent API |
| `vector.py` | Builds the ChromaDB index the agent searches |

## Quick start

You need Node.js 20 or newer.

```bash
cp avax-frontend/.env.example avax-frontend/.env.local   # fill in your keys
npm --prefix avax-frontend install
npm run dev:app                                          # http://localhost:3000
```

To run the AI agent too, and to deploy the contracts, see [RUN_APP.md](RUN_APP.md).

## Status

**Live on Fuji testnet:** vaults, pools, swaps, sign-in, points, missions, referrals, hubs, AI agent.

**Not built yet:** the points-to-NVR conversion, and claiming your airdrop on-chain.

## License

ISC
