/**
 * Plain words for the KAI Playground (/nuvari) form. The operation registry
 * (operationSchemas.ts) uses finance terms ("settlor", "vesting cliff");
 * this file says what each field means in everyday words, its unit, and a
 * few common values to tap. Only the page reads it; the saved policy keeps
 * the registry's field keys.
 */

export interface FieldWords {
  /** Shorter, everyday label. */
  label?: string;
  /** One sentence: what this is, in simple words. */
  help: string;
  /** Shown inside the box, after the number. */
  unit?: string;
  /** Common values to tap instead of typing. */
  picks?: (string | number)[];
}

export const FIELD_WORDS: Record<string, FieldWords> = {
  // Names
  title: { label: "Name of the policy", help: "Any name that helps you find it later." },
  policyTitle: { label: "Name of the policy", help: "Any name that helps you find it later." },
  trustName: { label: "Name of the trust", help: "Any name, for example your family name." },
  planTitle: { label: "Name of the plan", help: "Any name that helps you find it later." },
  milestoneName: { label: "Name of the goal", help: "For example \"Finished secondary school\"." },
  memo: { label: "Note", help: "A short note saved with this action. Optional." },

  // Which policy
  policyId: { label: "Which policy", help: "The policy ID starts with pol_. Tap the box to pick one of yours." },
  trustId: { label: "Which trust", help: "The trust's policy ID starts with pol_. Tap the box to pick one of yours." },
  planId: { label: "Which pension plan", help: "The plan's policy ID starts with pol_. Tap the box to pick one of yours." },

  // Types
  coverageType: { label: "What is covered", help: "Choose what this insurance protects." },
  trustType: { label: "Kind of trust", help: "Who the money is for decides the kind of trust." },
  planType: { label: "Kind of pension", help: "Personal: just you. SME: a business and its workers." },
  assetType: { label: "What you put in", help: "AVAX is the network's coin. A token is any other coin." },
  milestoneType: { label: "Kind of goal", help: "What must happen before money is released." },

  // People and wallets
  owner: { label: "Owner's wallet", help: "The wallet that controls this policy. Usually yours." },
  settlor: { label: "Who puts the money in", help: "The wallet of the person who creates and funds the trust. Usually yours." },
  trustee: { label: "Who looks after the trust", help: "The wallet of the person or service that manages the money." },
  trusteeAccount: { label: "Second manager's wallet", help: "Another person who must also approve big decisions." },
  beneficiary: { label: "Who receives the benefit", help: "A wallet address (0x…), or a group name like \"CFA members\"." },
  beneficiaryAccount: { label: "Who receives the money", help: "The wallet address (0x…) of the person who will be paid." },
  assessorAccount: { label: "Who checks claims", help: "The wallet of the person who approves or rejects claims." },
  settlementAccount: { label: "Where leftover money goes", help: "When the policy closes, money left over is sent to this wallet." },
  memberAccount: { label: "Member's wallet", help: "The wallet of the person saving in this pension." },
  employerAccount: { label: "Employer's wallet", help: "The business that adds money for its workers." },
  tokenAddress: { label: "Token address", help: "Only if you put in a token instead of AVAX. Leave empty for AVAX." },

  // Money in AVAX
  premium: { label: "Premium", help: "What is paid regularly to stay covered.", unit: "AVAX", picks: [0.001, 0.01, 0.1] },
  maxClaim: { label: "Most paid for one claim", help: "The biggest payout for a single claim.", unit: "AVAX", picks: [0.1, 1, 10] },
  coverageLimit: { label: "Most paid for this cover", help: "The biggest payout for this extra cover.", unit: "AVAX", picks: [0.1, 1, 10] },
  autoApproveBelow: { label: "Pay small claims at once", help: "Claims below this amount are paid without waiting for a person.", unit: "AVAX", picks: [0, 0.01, 0.1] },
  fundingAmount: { label: "Money to start with", help: "How much goes into the trust at the start.", unit: "AVAX", picks: [0.01, 0.1, 1] },
  contribution: { label: "Saved each time", help: "How much goes into the pension each time.", unit: "AVAX", picks: [0.005, 0.01, 0.1] },
  monthlyContribution: { label: "Saved each month", help: "How much goes into the pension every month.", unit: "AVAX", picks: [0.01, 0.1, 1] },
  monthlyContrib: { label: "Saved each month", help: "How much you plan to save every month.", unit: "AVAX", picks: [0.01, 0.1, 1] },
  amount: { label: "Amount", help: "How much money this action moves.", unit: "AVAX", picks: [0.001, 0.01, 0.1] },
  releaseAmount: { label: "Paid when the goal is reached", help: "Money released when the goal is proven.", unit: "AVAX", picks: [0.01, 0.1, 1] },
  matchCap: { label: "Most the employer adds", help: "The employer never adds more than this each month.", unit: "AVAX", picks: [0.01, 0.1, 1] },
  currentBalance: { label: "Saved so far", help: "How much is in the pension today.", unit: "AVAX", picks: [0, 1, 10] },

  // Time
  gracePeriod: { label: "Extra days to pay", help: "If a payment is late, cover continues for this many days.", unit: "days", picks: [7, 14, 30] },
  vestingCliff: { label: "Wait before you can withdraw", help: "Money stays locked for this many months first.", unit: "months", picks: [6, 12, 24] },
  timelockMonths: { label: "Locked for", help: "Nobody can take the money out before this time ends.", unit: "months", picks: [6, 12, 24] },
  years: { label: "Years until retirement", help: "How many years until you stop working.", unit: "years", picks: [10, 20, 30] },
  startDate: { label: "First payment date", help: "Write it as year-month-day, for example 2026-11-01." },
  frequency: { label: "How often", help: "How often money is paid in." },
  rebalanceFrequency: { label: "How often to adjust", help: "How often the investment mix is checked and adjusted." },

  // Percentages
  allocationPercent: { label: "Share of the payout", help: "This person's part of the money. 100 means all of it.", unit: "%", picks: [25, 50, 100] },
  employerMatch: { label: "Employer adds", help: "For every 100 saved, the employer adds this much.", unit: "%", picks: [0, 50, 100] },
  matchPercent: { label: "Employer adds", help: "For every 100 saved, the employer adds this much.", unit: "%", picks: [0, 50, 100] },
  escalationRate: { label: "Increase each year", help: "Savings go up by this much every year.", unit: "%", picks: [0, 5, 10] },
  annualReturn: { label: "Expected growth per year", help: "A guess of how much the savings grow each year.", unit: "%", picks: [3, 6, 10] },

  // Counts and choices
  memberCount: { label: "Number of people", help: "How many people this cover is for.", unit: "people", picks: [1, 10, 50] },
  sigWeight: { label: "Voting power", help: "How much this manager's approval counts. 1 is normal.", picks: [1, 2] },
  ageRange: { label: "Usual age of the people", help: "Older groups usually pay more." },
  riskLevel: { label: "How risky", help: "Higher risk usually means a higher premium." },
  threshold: { label: "Approvals needed", help: "How many managers must agree before money moves." },
  triggerCondition: { label: "When money is released", help: "The event that lets money go to the receiver." },
  payoutType: { label: "How it is paid", help: "All at once, or in parts over time." },
  strategy: { label: "How savings are invested", help: "Safer grows slowly. Growth can go up or down more." },
  status: { label: "Show which claims", help: "Choose \"all\" to see every claim." },
  reason: { label: "Reason", help: "A short reason, saved in the history." },

  // Yes / no
  autoRenew: { label: "Renew by itself", help: "Yes: the cover continues each period without asking you again." },
  requireEventProof: { label: "Need proof for claims", help: "Yes: a claim needs a photo or document before it is paid." },
  autoReleaseOnMilestone: { label: "Pay when the goal is reached", help: "Yes: money is released as soon as the goal is proven." },
  requireMultiSig: { label: "Two people must approve", help: "Yes: money moves only when more than one manager agrees." },
  antiTamper: { label: "Block changes", help: "Yes: nobody can change the lock once it is set." },
  confirmImmutability: { label: "I understand this can't be changed", help: "After this step, the trust rules are final." },
  autoInvest: { label: "Invest savings by itself", help: "Yes: new savings are invested automatically." },
};

/** Everyday names and descriptions for actions whose registry text is jargon. */
export const ACTION_WORDS: Record<string, { name?: string; description: string }> = {
  qs_create_insurance: { description: "The quickest start: give it a name, choose what is covered, done." },
  qs_create_trust: { description: "The quickest start: keep money safe for your family." },
  qs_create_pension: { description: "The quickest start: save a little and get it later." },
  qs_execute_policy: { name: "Run a policy", description: "Make one of your policies do its job now, for example pay out." },
  ins_create: { name: "Create insurance (all options)", description: "Like the quick start, but you set every detail: claims, grace days, renewal." },
  ins_update: { name: "Change premium or payout", description: "Change how much is paid in, or the most that is paid out." },
  ins_add_coverage: { name: "Add more cover", description: "Add extra protection, like dental or maternity, to a policy you have." },
  ins_add_beneficiary: { name: "Add a person to be paid", description: "Add someone who receives money when a claim is paid." },
  ins_configure_claims: { name: "Set claim rules", description: "Decide who checks claims and which small claims are paid at once." },
  ins_pause: { name: "Pause", description: "Stop payments and claims for a while. You can resume later." },
  ins_resume: { name: "Resume", description: "Start a paused policy again." },
  ins_terminate: { name: "Close for good", description: "End the policy and send any money left to a wallet." },
  ins_set_premium_schedule: { name: "Set payment dates", description: "Choose how often the premium is paid, and from when." },
  ins_calculate_premium: { name: "Estimate the premium", description: "Get a guess of the premium for a group of people." },
  ins_get_policy: { name: "See a policy", description: "Show the details and status of one policy." },
  ins_get_claims: { name: "See claims", description: "Show the claims made on a policy." },
  ins_get_audit_log: { name: "See history", description: "Show everything that happened to a policy." },
  trs_create: { name: "Create a trust (all options)", description: "Like the quick start, but you choose managers, receivers and approvals." },
  trs_add_trustee: { name: "Add a second manager", description: "Add someone who must also approve big decisions." },
  trs_define_distribution: { name: "Set when money is paid", description: "Choose what must happen before money goes to the receiver." },
  trs_create_milestone: { name: "Add a goal", description: "Money is released when a goal is proven, like finishing school." },
  trs_lock_assets: { name: "Lock the money", description: "Lock the money so nobody can take it before a date." },
  trs_attach_assets: { name: "Add more money", description: "Put more AVAX or tokens into the trust." },
  trs_suspend: { name: "Freeze", description: "Stop everything in the trust while it is checked." },
  trs_deploy: { name: "Make it final", description: "Turn the trust on for good. Its rules can't change after this." },
  trs_get_trust: { name: "See a trust", description: "Show the details, status and receivers of one trust." },
  trs_get_audit: { name: "See history", description: "Show everything that happened to a trust." },
  trs_get_assets: { name: "See the money inside", description: "Show what is locked in the trust." },
  pen_create: { name: "Create a pension (all options)", description: "Like the quick start, but with employer top-ups and a waiting time." },
  pen_add_employer: { name: "Add an employer", description: "Link a business that adds money to the worker's savings." },
  pen_configure_contribution: { name: "Set how much and how often", description: "Choose the saving amount, how often, and a yearly increase." },
  pen_attach_strategy: { name: "Choose how savings grow", description: "Pick a safer or a faster-growing way to invest the savings." },
  pen_withdraw: { name: "Take money out", description: "Withdraw from the pension, if the waiting time is over." },
  pen_calculate_projection: { name: "Estimate at retirement", description: "See roughly how much you will have when you retire." },
  pen_deploy: { name: "Make it final", description: "Turn the pension on for good." },
  pen_get_plan: { name: "See a pension", description: "Show the details and status of one pension plan." },
  pen_get_contributions: { name: "See savings history", description: "Show every amount saved into a plan." },
  tpl_motor: { description: "Cover for a car or motorbike. Filled in for you; change anything." },
  tpl_health: { description: "Medical cover for a group, like a business or SACCO. Filled in for you." },
  tpl_life: { description: "Pays your family if you die. Filled in for you." },
  tpl_crop: { description: "Pays farmers when the weather ruins the harvest. Filled in for you." },
  tpl_family_trust: { description: "Money for your children, paid at the ages you choose. Filled in for you." },
  tpl_education_trust: { description: "School or university fees, paid when the student is admitted. Filled in for you." },
  tpl_estate_trust: { description: "Shares what you leave behind, as you decided. Filled in for you." },
  tpl_charitable_trust: { description: "Gives money to good causes every month. Filled in for you." },
  tpl_personal_pension: { description: "Your own retirement savings. Filled in for you." },
  tpl_sme_pension: { description: "A business saves for its workers and adds half on top. Filled in for you." },
  tpl_informal_pension: { description: "Small savings for jua kali and other informal workers. Filled in for you." },
  pen_get_projection: { name: "See the estimate", description: "Show the latest retirement estimate for a plan." },
};

/** A value as a person would say it: "14 days", "Yes", "0.01 AVAX", "0xaA99…8514". */
export function sayValue(value: unknown, unit?: string): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const s = value == null ? "" : String(value).trim();
  if (!s) return "Not set";
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) return `${s.slice(0, 6)}…${s.slice(-4)}`;
  if (!unit) return s;
  return unit === "%" ? `${s}%` : `${s} ${unit}`;
}
