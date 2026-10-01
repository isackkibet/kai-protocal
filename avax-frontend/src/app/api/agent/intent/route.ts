import { NextResponse } from 'next/server';
import { ECOSYSTEM_TOKENS } from '@/lib/blockchain/tokens';
import { AgentProposal } from '@/components/ai/AgentProposalCard';

export interface AgentIntentResult {
  intentType: 'TRANSFER' | 'STAKE' | 'PAYMENT' | 'NAVIGATE' | 'BALANCE' | 'MRV_AUDIT' | 'QUERY';
  spokenReply: string;
  displayText: string;
  proposal?: AgentProposal;
  navigationPath?: string;
  paymentData?: {
    amountKes: number;
    phone?: string;
    purpose?: string;
  };
}

const VAULT_ADDRESSES: Record<string, `0x${string}`> = {
  yBOB: '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
  NVR:  '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
  YGOLD:'0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
  GAMI: '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
};

// ── Needle FastAPI URL ────────────────────────────────────────────────────────
const NEEDLE_API = process.env.NEEDLE_API_URL ?? 'http://127.0.0.1:8000';

/**
 * Try to classify the message via the Needle FastAPI (/needle/intent).
 * Returns null when the Needle server is unreachable (graceful fallback).
 */
async function callNeedleIntent(message: string): Promise<{
  intent: string;
  params: Record<string, string>;
  spoken_reply: string;
} | null> {
  try {
    const res = await fetch(`${NEEDLE_API}/needle/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.intent ?? null;
  } catch {
    // Needle server offline — fall through to rule-based engine
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message, userAddress } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const text  = message.trim();
    const lower = text.toLowerCase();

    // ══════════════════════════════════════════════════════════════════════════
    //  STEP 1: Try Needle AI (14 MB engine via FastAPI)
    // ══════════════════════════════════════════════════════════════════════════
    const needleResult = await callNeedleIntent(text);

    if (needleResult && needleResult.intent && needleResult.intent !== 'query') {
      const { intent, params, spoken_reply } = needleResult;

      switch (intent) {
        case 'navigate': {
          const page = params?.page ?? '/';
          return NextResponse.json({
            intentType: 'NAVIGATE',
            spokenReply: spoken_reply || `Navigating to ${page}.`,
            displayText: `🧭 **Navigating** to \`${page}\``,
            navigationPath: page.startsWith('/') ? page : `/${page}`,
          });
        }

        case 'transfer': {
          const token = findTokenInText(lower) ?? ECOSYSTEM_TOKENS.find(t => t.symbol === 'NVR')!;
          const amount = params?.amount ?? '10';
          const to = params?.to ?? userAddress ?? '0x0000000000000000000000000000000000000000';
          const proposal: AgentProposal = {
            agentName: 'Needle Tx Agent',
            actionType: 'TRANSFER',
            title: `Transfer ${amount} ${token.symbol}`,
            description: `Needle-classified ERC-20 transfer of ${amount} ${token.symbol} on Avalanche Fuji.`,
            amount,
            tokenSymbol: token.symbol,
            tokenAddress: (token.address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
            recipientAddress: to as `0x${string}`,
          };
          return NextResponse.json({
            intentType: 'TRANSFER',
            spokenReply: spoken_reply || `Prepared transfer of ${amount} ${token.symbol}.`,
            displayText: `⚡ **Token Transfer** — ${amount} ${token.symbol} → \`${to}\``,
            proposal,
          });
        }

        case 'deposit': {
          const token = findTokenInText(lower) ?? ECOSYSTEM_TOKENS.find(t => t.symbol === 'yBOB')!;
          const amount = params?.amount ?? '25';
          const apyMap: Record<string, string> = { yBOB: '7.5%', NVR: '12%', YGOLD: '18%', GAMI: '22%' };
          const apy = apyMap[token.symbol] ?? '10%';
          const proposal: AgentProposal = {
            agentName: 'Needle Yield Agent',
            actionType: 'APPROVE_STAKE',
            title: `Deposit ${amount} ${token.symbol} into Vault`,
            description: `Needle-classified vault deposit — earn ${apy} APY on Avalanche.`,
            amount,
            tokenSymbol: token.symbol,
            tokenAddress: (token.address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
            targetContract: VAULT_ADDRESSES[token.symbol] ?? '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
            projectedApy: `${apy} APY`,
          };
          return NextResponse.json({
            intentType: 'STAKE',
            spokenReply: spoken_reply || `Vault deposit of ${amount} ${token.symbol} configured.`,
            displayText: `🏦 **Vault Deposit** — ${amount} ${token.symbol} · ${apy} APY`,
            proposal,
          });
        }

        case 'pay': {
          const amount = parseFloat(params?.amount_kes ?? '500');
          const phone  = params?.phone;
          return NextResponse.json({
            intentType: 'PAYMENT',
            spokenReply: spoken_reply || `M-Pesa payment of ${amount} KES prepared.`,
            displayText: `📱 **M-Pesa Payment** — ${amount} KES${phone ? ` to ${phone}` : ''}`,
            paymentData: { amountKes: amount, phone, purpose: 'KAI DeFi Service' },
            navigationPath: `/pay?amount=${amount}${phone ? `&phone=${phone}` : ''}`,
          });
        }

        // Balance and MRV/nursery questions are answered by the KAI brain with
        // real data (balance tools, nursery summary, record lookup). These
        // used to return canned text — including an "MRV audit complete for
        // Nursery Batch 07, 94.8% survival" claim for a batch that doesn't
        // exist — so they fall through to QUERY instead.
        case 'balance':
        case 'mrv_audit':
          break;

        case 'sdg_log': {
          return NextResponse.json({
            intentType: 'NAVIGATE',
            spokenReply: spoken_reply || 'Opening your SDG impact dashboard.',
            displayText: `🌍 **SDG Impact** — logging activity and updating your score.`,
            navigationPath: '/sdg',
          });
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  STEP 2: Rule-based fallback (always works, no external dependency)
    // ══════════════════════════════════════════════════════════════════════════

    // Navigation
    const navMatch = checkNavigationIntent(lower);
    if (navMatch) {
      return NextResponse.json({
        intentType: 'NAVIGATE',
        spokenReply: `Navigating to ${navMatch.name}.`,
        displayText: `🧭 **Navigating to ${navMatch.name}** (\`${navMatch.path}\`)\n\nOpening the page right away for you.`,
        navigationPath: navMatch.path,
      });
    }

    // x402 Protocol
    if (lower.includes('x402') || lower.includes('yield sweep') || lower.includes('reentrancy') || lower.includes('contract audit')) {
      const isAudit  = lower.includes('audit')  || lower.includes('security');
      const isMRV    = lower.includes('mrv')    || lower.includes('nursery');
      const isOracle = lower.includes('oracle') || lower.includes('slippage');
      const cost  = isAudit ? 500 : isMRV ? 200 : 100;
      const title = isAudit ? 'KaiEscrow Bytecode Security Audit' : isMRV ? 'dMRV Tree Nursery Batch #07 Proof' : isOracle ? 'Nuvari AMM Slippage Oracle Route' : 'KaiVault Yield Sweep & Reentrancy Validator';
      const proposal: AgentProposal = {
        agentName: 'x402 Protocol Rails Agent',
        actionType: 'TRANSFER',
        title: `${title} (${cost} CENTS)`,
        description: `Off-chain signed EIP-712 transfer authorization settled via KaiEscrow on Avalanche Fuji.`,
        amount: String(cost),
        tokenSymbol: 'CENTS',
        tokenAddress: '0x1bd79052747A236Aca137380394da27771e95eeA',
        recipientAddress: '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
        targetContract:   '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
      };
      return NextResponse.json({
        intentType: 'PAYMENT',
        spokenReply: `Executing ${title} via x402 for ${cost} CENTS on Avalanche Fuji.`,
        displayText: `⚡ **x402 Agentic Protocol Execution**\n\n- **Service:** ${title}\n- **Cost:** **${cost} CENTS**\n- **Network:** Avalanche Fuji C-Chain`,
        proposal,
      });
    }

    // M-Pesa
    if (lower.includes('mpesa') || lower.includes('m-pesa') || lower.includes('kes') || lower.includes('shilling')) {
      const amountMatch = lower.match(/(\d+(?:\.\d+)?)/);
      const phoneMatch  = lower.match(/(07\d{8}|01\d{8}|\+254\d{9}|254\d{9})/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 500;
      const phone  = phoneMatch ? phoneMatch[1] : undefined;
      return NextResponse.json({
        intentType: 'PAYMENT',
        spokenReply: `M-Pesa payment of ${amount} KES prepared. Please confirm.`,
        displayText: `📱 **M-Pesa / Paystack Payment**\n\n- **Amount:** ${amount} KES\n- **Phone:** ${phone ?? 'Enter at prompt'}\n- **Settlement:** yBOB minted to your Fuji wallet.`,
        paymentData: { amountKes: amount, phone, purpose: 'Community Forest & DeFi Subscription' },
        navigationPath: `/pay?amount=${amount}${phone ? `&phone=${phone}` : ''}`,
      });
    }

    // Transfer
    if (lower.includes('transfer') || lower.includes('send')) {
      const token       = findTokenInText(lower) ?? ECOSYSTEM_TOKENS.find(t => t.symbol === 'NVR')!;
      const amountMatch = lower.match(/(\d+(?:\.\d+)?)/);
      const amount      = amountMatch ? amountMatch[1] : '10';
      const addrMatch   = text.match(/0x[a-fA-F0-9]{40}/);
      const recipient   = (addrMatch ? addrMatch[0] : '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as `0x${string}`;
      const proposal: AgentProposal = {
        agentName: 'Tx Dispatcher Agent',
        actionType: 'TRANSFER',
        title: `Transfer ${amount} ${token.symbol}`,
        description: `ERC-20 transfer of ${amount} ${token.symbol} on Avalanche Fuji C-Chain.`,
        amount,
        tokenSymbol: token.symbol,
        tokenAddress: (token.address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
        recipientAddress: recipient,
      };
      return NextResponse.json({
        intentType: 'TRANSFER',
        spokenReply: `Prepared transfer of ${amount} ${token.symbol}. Review the proposal to sign.`,
        displayText: `⚡ **On-Chain Transfer**\n\n- **Token:** ${token.symbol}\n- **Amount:** ${amount}\n- **Recipient:** \`${recipient}\`\n- **Network:** Avalanche Fuji`,
        proposal,
      });
    }

    // Deposit / Stake
    if (lower.includes('deposit') || lower.includes('stake') || lower.includes('yield') || lower.includes('vault')) {
      const token       = findTokenInText(lower) ?? ECOSYSTEM_TOKENS.find(t => t.symbol === 'yBOB')!;
      const amountMatch = lower.match(/(\d+(?:\.\d+)?)/);
      const amount      = amountMatch ? amountMatch[1] : '25';
      const apyMap: Record<string, string> = { yBOB: '7.5%', NVR: '12%', YGOLD: '18%', GAMI: '22%' };
      const apy = apyMap[token.symbol] ?? '10%';
      const proposal: AgentProposal = {
        agentName: 'Yield Optimizer Agent',
        actionType: 'APPROVE_STAKE',
        title: `Deposit ${amount} ${token.symbol} into Vault`,
        description: `Deposit ${token.symbol} into KaiVault to earn ${apy} APY on Avalanche.`,
        amount,
        tokenSymbol: token.symbol,
        tokenAddress: (token.address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
        targetContract: VAULT_ADDRESSES[token.symbol] ?? '0x431A98d42f9F7d6529C676115D5E3Df3c2419DA2',
        projectedApy: `${apy} APY`,
      };
      return NextResponse.json({
        intentType: 'STAKE',
        spokenReply: `Configured deposit of ${amount} ${token.symbol} earning ${apy} APY.`,
        displayText: `🏦 **Vault Deposit Proposal**\n\n- **Strategy:** kv${token.symbol} Yield Pool\n- **Projected APY:** **${apy}**\n- **Amount:** ${amount} ${token.symbol}`,
        proposal,
      });
    }

    // MRV / nursery / balance questions: no canned reply here — the default
    // QUERY below hands them to the KAI brain, which answers from real data.

    // Default — hand off to /api/chat (RAG + Needle)
    return NextResponse.json({
      intentType: 'QUERY',
      spokenReply: needleResult?.spoken_reply ?? 'Let me check the KAI knowledge base for you.',
      displayText: '',
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Intent parsing failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findTokenInText(text: string) {
  for (const token of ECOSYSTEM_TOKENS) {
    if (text.includes(token.symbol.toLowerCase()) || text.includes(token.name.toLowerCase())) {
      return token;
    }
  }
  if (text.includes('avax')) {
    return { symbol: 'AVAX', name: 'Avalanche', decimals: 18, emoji: '🔺', color: '#e84142', address: null, role: 'Native gas' };
  }
  return null;
}

function checkNavigationIntent(text: string): { name: string; path: string } | null {
  const routes = [
    { keys: ['vault', 'vaults', 'yield'],               name: 'Yield Vaults',           path: '/vaults' },
    { keys: ['pool', 'pools', 'amm', 'liquidity'],       name: 'AMM Pools',              path: '/pools' },
    { keys: ['nursery', 'tree nursery', 'cfa', 'trees'], name: 'Oloolua CFA Nursery',     path: '/nursery' },
    { keys: ['hub', 'info hub', 'news', 'mrv'],          name: 'Information Hub',        path: '/hub' },
    { keys: ['pay', 'payment', 'qr', 'mpesa'],           name: 'Scan & Pay',             path: '/pay' },
    { keys: ['saving', 'chama', 'saving group'],         name: 'Saving Circles',          path: '/saving' },
    { keys: ['sme', 'business', 'invoice'],              name: 'SME Hub',                 path: '/sme' },
    { keys: ['mine', 'airdrop', 'rewards'],              name: 'Mine & Airdrop',          path: '/mine' },
    { keys: ['profile', 'account', 'settings'],         name: 'User Profile',            path: '/profile' },
    { keys: ['securities', 'security', 'structured'],   name: 'Securities & Products',   path: '/securities' },
    { keys: ['sdg', 'impact', 'sustainability'],         name: 'SDG Impact',              path: '/sdg' },
    { keys: ['home', 'dashboard', 'overview'],           name: 'Home Dashboard',          path: '/' },
  ];

  for (const r of routes) {
    for (const k of r.keys) {
      // "open the nursery", "show me my profile", "take me to the vaults"…
      const verb = String.raw`(?:go to|open|take me to|show me|show|navigate to|bring up)`;
      const re = new RegExp(String.raw`\b${verb}\s+(?:the\s+|my\s+|our\s+)?${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`);
      if (re.test(text) || text === k || text === `go ${k}`) {
        return { name: r.name, path: r.path };
      }
    }
  }
  return null;
}
