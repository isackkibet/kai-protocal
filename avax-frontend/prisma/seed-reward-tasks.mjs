// One-off / idempotent seed for the RewardTask catalog (KAI Nuvari PRD §3 —
// "reward values should be easy to change from the backend"). Safe to re-run:
// upserts by taskType, never duplicates rows.
//
// Usage: node prisma/seed-reward-tasks.mjs   (reads DATABASE_URL from env)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TASKS = [
  {
    taskType: 'SIGNUP',
    name: 'Create your account',
    description: 'Sign in and get your Avalanche wallet — covered by your welcome bonus.',
    rewardAmount: 1000,
  },
  {
    taskType: 'DAILY_CHECKIN',
    name: 'Daily sign-in',
    description: 'Come back once a day to claim your streak bonus.',
    rewardAmount: 10,
  },
  {
    taskType: 'COMPLETE_PROFILE',
    name: 'Complete your profile',
    description: 'Add your name and phone number.',
    rewardAmount: 20,
  },
  {
    taskType: 'CAMPAIGN',
    name: 'Follow KAI Nuvari',
    description: 'Follow our official channel for updates.',
    rewardAmount: 10,
  },
];

for (const t of TASKS) {
  const existing = await prisma.rewardTask.findFirst({ where: { taskType: t.taskType } });
  if (existing) {
    await prisma.rewardTask.update({
      where: { id: existing.id },
      data: { name: t.name, description: t.description, rewardAmount: t.rewardAmount, active: true },
    });
    console.log(`updated  ${t.taskType} → ${t.rewardAmount}pts`);
  } else {
    await prisma.rewardTask.create({ data: t });
    console.log(`created  ${t.taskType} → ${t.rewardAmount}pts`);
  }
}

await prisma.$disconnect();
