# Product Requirements Document (PRD)
# KAI Points & Gmail Authentication Engine

**Document Title:** KAI Airdrop Engine — Web2 Points Architecture & Google Auth Specification  
**Document Version:** 2.0 (Revised Points-First Architecture)  
**Target Platform:** Next.js (TypeScript), NextAuth / OAuth 2.0 (Google/Gmail), Neon PostgreSQL (Prisma ORM)  
**Prepared For:** Engineering Team & Google Antigravity Agents  

---

## 1. Executive Summary & Revised System Logic

### Core Architectural Pivot
1. **Web2-First Identity**: Users authenticate seamlessly using their Gmail / Google account via NextAuth OAuth 2.0. Web3 wallet connections (Privy / Wagmi) are deferred to downstream token redemption and claiming phases.
2. **Points-Ledger First**: All daily claims, check-in streaks, auto-drop background mining, and ecosystem tasks reward off-chain **KAI Points** (persisted in PostgreSQL via Prisma ORM) rather than directly minting or transferring ecosystem tokens.
3. **Conversion Path**: Off-chain points accumulate in a transactional ledger (`PointLedger`). A designated conversion pipeline and active launchpool mechanics handle point-to-token ratio redemptions (converting points into `$NVR`, `$YBOB`, `$YTOKEN`, and `$GAMI`).
4. **No SDG Points**: Per PRD requirements, SDG points are completely decoupled from the airdrop engine.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USER AUTHENTICATION & IDENTITY                                       │
│    - Google OAuth 2.0 Sign-In via Gmail (NextAuth)                      │
│    - Neon Postgres User Record (email, googleId, pointsBalance, streak) │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. POINTS-ONLY OFF-CHAIN ENGAGEMENT ENGINE                             │
│    - Daily Claim: +100 KAI Points (24-hour cooldown timer)              │
│    - Daily Check-In Streak Bonus (+10 to +100 KAI Points)               │
│    - Background Mining Daemon: Generates KAI Points in real-time        │
│    - Task Engine: Complete tasks → Credit KAI Points                    │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. POINTS LEDGER & AUDIT TRAIL                                          │
│    - Transactional Postgres Ledger recording every point credit/debit   │
│    - API endpoints to fetch live user point balance & history           │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. TOKEN CONVERSION LAYER (Deferred / Launchpools)                     │
│    - Conversion ratios (e.g., 100 Points = 1 NVR / 2 YBOB)              │
│    - Active Launchpools / Vault Claims for token allocations            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Architecture & Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                String         @id @default(uuid())
  email             String         @unique
  googleId          String?        @unique
  name              String?
  image             String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  // Point Ledger & Mining State
  pointsBalance     Int            @default(0)
  streakCount       Int            @default(0)
  lastClaimAt       DateTime?
  lastCheckInAt     DateTime?
  isAutoMining      Boolean        @default(false)
  minedPointsBuffer Float          @default(0.0) // Sub-second precision for background mining

  // Relations
  ledgerEntries     PointLedger[]
  completedTasks    UserTask[]
}

model PointLedger {
  id          String   @id @default(uuid())
  userId      String
  amount      Int      // Positive for credit, negative for conversion/debit
  source      String   // "DAILY_CLAIM", "CHECKIN_STREAK", "AUTO_MINER", "TASK_POLICY", "TASK_AGENT"
  description String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}

enum TaskType {
  DAILY_CHECKIN
  EXPLORE_POLICY
  ASK_KAI_AGENT
  JOIN_COMMUNITY
}

model UserTask {
  id          String   @id @default(uuid())
  userId      String
  taskType    TaskType
  completedAt DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, taskType, completedAt])
  @@index([userId])
}
```

---

## 3. TypeScript Technical Implementation

### 3.1 NextAuth / Google OAuth Configuration (`src/lib/auth.ts`)

```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert User in Neon Postgres on Google Login
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          image: user.image,
          googleId: account?.providerAccountId,
        },
        create: {
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: account?.providerAccountId,
          pointsBalance: 0,
        },
      });

      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, pointsBalance: true, streakCount: true, lastClaimAt: true },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.pointsBalance = dbUser.pointsBalance;
          session.user.streakCount = dbUser.streakCount;
          session.user.lastClaimAt = dbUser.lastClaimAt;
        }
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 3.2 Daily Points Claim Logic (`src/app/api/mine/claim/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAILY_CLAIM_POINTS = 100; // Standard daily point reward
const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized. Please log in with Gmail." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const now = new Date();
  if (user.lastClaimAt) {
    const timeSinceLastClaim = now.getTime() - new Date(user.lastClaimAt).getTime();
    if (timeSinceLastClaim < CLAIM_COOLDOWN_MS) {
      const remainingMs = CLAIM_COOLDOWN_MS - timeSinceLastClaim;
      return NextResponse.json(
        { error: "Cooldown active.", remainingMs },
        { status: 429 }
      );
    }
  }

  // Transactional Points Grant via DB Transaction
  const [updatedUser, ledgerEntry] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        pointsBalance: { increment: DAILY_CLAIM_POINTS },
        lastClaimAt: now,
      },
    }),
    prisma.pointLedger.create({
      data: {
        userId: user.id,
        amount: DAILY_CLAIM_POINTS,
        source: "DAILY_CLAIM",
        description: "Daily 24-hour claim reward",
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    newPointsBalance: updatedUser.pointsBalance,
    pointsAwarded: DAILY_CLAIM_POINTS,
    nextClaimAvailable: new Date(now.getTime() + CLAIM_COOLDOWN_MS),
  });
}
```

### 3.3 Task Completion API (`src/app/api/kai-bar/tasks/complete/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskType } from "@prisma/client";

const TASK_POINT_VALUES: Record<TaskType, number> = {
  DAILY_CHECKIN: 50,
  EXPLORE_POLICY: 20,
  ASK_KAI_AGENT: 30,
  JOIN_COMMUNITY: 25,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const taskType = body.taskType as TaskType;

  if (!TASK_POINT_VALUES[taskType]) {
    return NextResponse.json({ error: "Invalid task type" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if task already completed today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existingTask = await prisma.userTask.findFirst({
    where: {
      userId: user.id,
      taskType: taskType,
      completedAt: { gte: startOfDay },
    },
  });

  if (existingTask) {
    return NextResponse.json({ error: "Task already completed today" }, { status: 400 });
  }

  const pointsToReward = TASK_POINT_VALUES[taskType];

  await prisma.$transaction([
    prisma.userTask.create({
      data: { userId: user.id, taskType },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { pointsBalance: { increment: pointsToReward } },
    }),
    prisma.pointLedger.create({
      data: {
        userId: user.id,
        amount: pointsToReward,
        source: `TASK_${taskType}`,
        description: `Completed task: ${taskType}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    taskType,
    pointsAwarded: pointsToReward,
  });
}
```

---

## 4. Front-End Component Requirements (`/mine` Page)

1. **Google Login Entrypoint**:
   - Replace direct Web3 wallet connect modals with a Google authentication prompt:
     ```tsx
     import { signIn, signOut, useSession } from "next-auth/react";
     
     // When unauthenticated:
     <button onClick={() => signIn("google")}>
       Sign in with Gmail to Claim
     </button>
     ```
2. **Animated Points Display**:
   - Render `session.user.pointsBalance` prominently using the smooth `useCountUp` animation.
   - Display active streak count and remaining daily claim cooldown.
3. **Active Launchpool UI (Points-to-Token Redemption Dynamics)**:
   - Preserve the visual container of launchpools, refactored for point conversion dynamics:
     - **Pool 1**: AVAX Alpha Pool — Convert KAI Points to `$NVR` (Ratio: 100 Points = 1 NVR).
     - **Pool 2**: NVR Launch Pool — Convert KAI Points to `$YBOB` Stablecoin (Ratio: 50 Points = 1 YBOB).
     - **Pool 3**: Core Wallet Promo — Status: Closed / Full.
4. **Auto-Miner Engine**:
   - Calculate background mining at a rate of **0.05 KAI Points / second** while active.
   - Accumulate points in client memory buffer and sync to server via batched pings (every 30 seconds) to avoid database overhead.
5. **Decoupled SDG Points**:
   - Confirm complete removal of `SDGImpactCard` from `/mine`.

---

## 5. Acceptance Criteria

| ID | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **AC-1** | User logs in with Gmail | User is upserted into Neon Postgres, JWT session contains `id`, `pointsBalance`, and `streakCount`. |
| **AC-2** | User triggers Daily Claim for the first time | User receives +100 KAI Points, `lastClaimAt` is stamped, `PointLedger` records `DAILY_CLAIM`. |
| **AC-3** | User attempts to claim twice within 24 hours | API returns HTTP 429 Cooldown Active with `remainingMs`. |
| **AC-4** | User completes a daily task | Point reward credited according to `TASK_POINT_VALUES` and locked until next UTC midnight. |
| **AC-5** | Auto-Drop background miner active | Generates 0.05 KAI Points/sec, batched and flushed cleanly to Postgres ledger. |
| **AC-6** | Launchpool redemption | Deducts off-chain KAI Points from `pointsBalance` and registers token allocation claim. |
