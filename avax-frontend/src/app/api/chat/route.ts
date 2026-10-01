import { NextResponse } from 'next/server';
import { VAULT_ADDRESSES, AMM_ADDRESS, EXPLORER_BASE } from '@/lib/blockchain/addresses';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody } from '@/lib/security/input';
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { runKai, BrainUnavailableError } from '@/lib/ai/brain';

// Vercel Hobby plan cap is 300s
export const maxDuration = 300;


// ── Built-in KAI knowledge base (fallback when all LLMs are offline) ──────────
const KAI_KB: { match: RegExp; answer: string }[] = [
  {
    match: /token|kai|nvr|ybob|ytoken|ygold|gami|cents/i,
    answer: `**KAI Nuvari Ecosystem Tokens** on Avalanche Fuji C-Chain:\n\n- **KAI** - Governance & utility token. Powers DAO voting and protocol fees.\n- **NVR (Nuvari)** - Vault receipt token. Earned by depositing into KAI vaults.\n- **yBOB** - USD-pegged yield-bearing stablecoin. 1 yBOB ≈ 1 USD, earns ~7.5% APY in kvyBOB vault.\n- **yTOKEN** - Community yield token. Linked to SME and saving group liquidity.\n- **yGOLD** - Tokenized gold commodity. Backed by community commodity pools.\n- **GAMI** - Gaming & airdrop incentive token. Distributed via the Mine/Airdrop module.\n- **CENTS** - Micro-payment unit. Used for M-Pesa & Paystack payment rails.\n\n1 AVAX ≈ 100 ecosystem tokens on testnet. All tokens are ERC-20 on Avalanche C-Chain.`,
  },
  {
    match: /vault|apy|yield|deposit|stake/i,
    answer: `**KAI Yield Vaults** - Earn passive yield on Avalanche:\n\n- **kvyBOB Vault** - 7.5% APY · deposit yBOB · low risk\n- **kvNVR Vault** - 12% APY · deposit NVR · medium risk\n- **kvYGOLD Vault** - 18% APY · deposit yGOLD · commodity-backed\n- **kvGAMI Vault** - 22% APY · deposit GAMI · high risk / high reward\n\n**How to deposit:**\n1. Connect MetaMask or Core Wallet to Fuji testnet\n2. Navigate to /vaults and select a vault\n3. Approve the token spend, then click **Deposit**\n4. You receive NVR receipt tokens representing your share\n\nYield accrues every block (~2 seconds on Avalanche).`,
  },
  {
    match: /pool|liquidity|amm|swap|impermanent/i,
    answer: `**KAI AMM Pools** - Avalanche-native liquidity:\n\n- **NVR/yBOB** - Core stable pair · 0.3% swap fee\n- **AVAX/KAI** - Main gateway pair · 0.3% fee\n- **yGOLD/yBOB** - Commodity stable pair · 0.25% fee\n\n**Adding Liquidity:**\n1. Go to /pools and pick a pair\n2. Approve both tokens\n3. Set amounts (equal value) and click **Add**\n4. Receive LP tokens representing your share\n\n**Impermanent Loss** occurs when token prices diverge. The yBOB pairs have minimal IL since both sides are stable or pegged.`,
  },
  {
    match: /govern|dao|vote|proposal/i,
    answer: `**KAI DAO Governance** - On-chain voting with KAI tokens:\n\n- **1 KAI = 1 vote** · lock KAI to gain voting power\n- Proposals need **100 KAI** quorum to pass\n- Voting period: **3 days**\n- Timelock: **24h** before execution\n\n**Active Proposal Types:**\n- Vault APY adjustments\n- Fee distribution changes\n- New token listings\n- Community treasury allocations\n\nNavigate to /cfa → Governance to create or vote on proposals.`,
  },
  {
    match: /mpesa|payment|kes|pay|scan/i,
    answer: `**KAI × M-Pesa Integration** - Fiat on/off ramp for Kenya:\n\n- Send KES via M-Pesa → receive yBOB or CENTS on-chain\n- Exchange rate: **1 USD = ~130 KES** (live rate)\n- Powered by **Safaricom Daraja API** + Paystack for card payments\n- **Scan & Pay** (/pay) - generate a QR code, recipient scans and pays in KES\n- Settlement: yBOB sent to your wallet within ~30 seconds\n\nCurrently on Fuji testnet with M-Pesa sandbox.`,
  },
  {
    match: /nft|conservation|art|marketplace/i,
    answer: `**KAI Conservation NFT Marketplace** (/connft):\n\n- Artists and conservationists mint NFTs representing real forest assets\n- Buy with **yBOB** - 1 yBOB = 1 USD equivalent\n- **5% of every sale** goes to the Community Forest Treasury\n- NFTs are ERC-721 on Avalanche C-Chain\n- Fuji testnet: gas fees < 0.001 AVAX per transaction\n\nConnect your wallet and navigate to /connft to browse or list.`,
  },
  {
    match: /sme|business|invoice|loan/i,
    answer: `**SME Dashboard** (/sme) - Digitise your small business on-chain:\n\n- **Invoice Tokenisation** - create on-chain invoices backed by yBOB\n- **Micro-loans** - borrow against inventory collateral\n- **Cash Digitisation** - convert M-Pesa float to yBOB instantly\n- **Inventory tracking** - log stock on IPFS with Avalanche timestamps\n\nDesigned for Kenyan MSMEs. No bank account required.`,
  },
  {
    match: /saving|chama|group|pool fund/i,
    answer: `**Saving Group** (/saving) - Decentralised chama (ROSCA) on Avalanche:\n\n- Create or join a saving circle with 2-20 members\n- Pool yBOB or KAI weekly/monthly\n- Smart contract auto-distributes the pot in turn\n- **Yield on idle funds** - pooled amount earns vault APY while waiting\n- Transparent on-chain history - no disputes\n\nNavigate to /saving to create your first on-chain chama.`,
  },
  {
    match: /security|audit|vulnerab|safe/i,
    answer: `**KAI Smart Contract Security:**\n\n- All contracts audited by internal review on Fuji testnet\n- Using **OpenZeppelin** v5 libraries (ReentrancyGuard, Ownable, ERC-20)\n- **DID tracker** logs every agent action with timestamps\n- x402 payment rails require signed authorisation before any transfer\n- Key contracts:\n  - KaiVault: \`${VAULT_ADDRESSES.NVR ?? 'see /vaults'}\`\n  - NuvariAMM: \`${AMM_ADDRESS ?? 'see /pools'}\`\n\nAlways verify contract addresses on ${EXPLORER_BASE} before interacting.`,
  },
  {
    match: /avax|avalanche|fuji|testnet|network/i,
    answer: `**Avalanche C-Chain (Fuji Testnet):**\n\n- **Chain ID:** 43113\n- **RPC:** \`https://api.avax-test.network/ext/bc/C/rpc\`\n- **Explorer:** https://testnet.snowtrace.io\n- **Block time:** ~2 seconds\n- **Get test AVAX:** https://faucet.avax.network\n\n**Wallet Setup:**\n1. Add Fuji to MetaMask: Settings → Networks → Add Network\n2. Use the RPC above with Chain ID 43113\n3. Get free test AVAX from the faucet\n4. Connect at the top of the KAI app`,
  },
];

function kaiKnowledgeFallback(message: string): string {
  const q = message.toLowerCase();
  for (const entry of KAI_KB) {
    if (entry.match.test(q)) return entry.answer;
  }
  return `**KAI Agent** - I'm your DeFi guide for the KAI Nuvari ecosystem on Avalanche.\n\nHere's what I can help you with:\n- **Tokens** - NVR, yBOB, YTOKEN, YGOLD, GAMI, CENTS\n- **Vaults** - Yield strategies from 7.5% to 22% APY\n- **Pools** - AMM liquidity and swap rates\n- **Governance** - DAO proposals and voting\n- **Payments** - M-Pesa KES ↔ yBOB on-ramp\n- **Conservation NFTs** - Forest-backed digital assets\n\nTry asking: *"What are the KAI vault APYs?"* or *"How do I add liquidity?"*`;
}

// ── Wallet context: lets the home page pass the connected wallet's real
// balances so the agent can answer "what's my portfolio worth" etc. with
// actual numbers instead of a generic answer. ──────────────────────────────
interface WalletContext {
  connected?: boolean;
  address?: string;
  network?: string;
  totalUsd?: number;
  balances?: { symbol: string; value: number }[];
}

const VAULT_APY: Record<string, number> = { NVR: 15.2, YBOB: 7.5, YTOKEN: 14.8, YGOLD: 12.4, GAMI: 22.0, CENTS: 6.5 };

function contextSummary(context?: WalletContext): string {
  if (!context?.connected) return '';
  const bals = (context.balances ?? []).filter(b => b.value > 0);
  const balLine = bals.length
    ? bals.map(b => `${b.symbol}: ${b.value}`).join(', ')
    : 'no token balances yet';
  return `\n\nThe user's wallet is currently connected on ${context.network ?? 'Fuji'} (address ${context.address ?? 'unknown'}). Estimated portfolio value: $${(context.totalUsd ?? 0).toFixed(2)}. Balances: ${balLine}. Use these real figures when the question is about "my" balance, portfolio, or yield — don't invent numbers.`;
}

/** Deterministic answer for "my portfolio / balance / yield" questions, built
 * straight from the wallet context — bypasses the LLM so figures can't drift
 * or be hallucinated. Returns null when the question isn't personal or no
 * wallet is connected, so callers fall through to the normal RAG/LLM path. */
function personalAnswer(message: string, context?: WalletContext): string | null {
  if (!context?.connected) return null;
  const q = message.toLowerCase();
  const isPersonal = /\b(my|i have|i've got|i own|portfolio|holdings|how much (do )?i|worth)\b/.test(q);
  if (!isPersonal) return null;

  const bals = (context.balances ?? []).filter(b => b.value > 0);
  const wantsYield = /yield|apy|best (rate|return)|earn/.test(q);

  if (wantsYield) {
    if (!bals.length) {
      return `**Best yield for you right now**\n\nYour wallet is connected but holds no ecosystem tokens yet, so there's nothing to deposit into a vault. Pick up some yBOB or NVR first, then check back — highest APY currently is **kvGAMI at 22%**.`;
    }
    const ranked = bals
      .map(b => ({ ...b, apy: VAULT_APY[b.symbol.toUpperCase()] ?? 0 }))
      .filter(b => b.apy > 0)
      .sort((a, b) => b.apy - a.apy);
    const lines = ranked.map(b => `- **${b.symbol}** (${b.value}): kv${b.symbol.toUpperCase()} vault at **${b.apy}% APY**`).join('\n');
    return `**Best yield for your holdings**\n\n${lines || 'None of your current holdings have a matching vault yet.'}\n\nHighest match: **${ranked[0]?.symbol ?? 'n/a'}** at ${ranked[0]?.apy ?? 0}% APY. Deposit from /vaults.`;
  }

  const balLines = bals.length
    ? bals.map(b => `- **${b.symbol}**: ${b.value}`).join('\n')
    : '- No token balances yet — your wallet is connected but empty on ' + (context.network ?? 'Fuji') + ' testnet.';
  return `**Your KAI Portfolio** (${context.network ?? 'Fuji'})\n\nEstimated value: **$${(context.totalUsd ?? 0).toFixed(2)}**\n\n${balLines}\n\nWallet: \`${context.address ?? ''}\`\n\nAsk "best yield for me" to see where these could earn.`;
}

/** Stream a plain string as SSE events (token by token) */
function streamText(text: string): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();

  (async () => {
    // Split into word-sized chunks for a realistic typing effect
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      const token = (i === 0 ? '' : ' ') + words[i];
      await writer.write(enc.encode(`data: ${JSON.stringify({ token })}\n\n`));
      // Small delay to simulate streaming
      await new Promise(r => setTimeout(r, 18));
    }
    await writer.write(enc.encode(`data: ${JSON.stringify({ done: true, sources: 0 })}\n\n`));
    await writer.close();
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ── POST /api/chat ─────────────────────────────────────────────────────────────
// Body: { message, history?, stream?, context? }
//   history — earlier turns of this conversation [{ role, content }], from the
//             user's browser; the brain keeps the last 10.
//   context — the home page's connected-wallet balances, if any.
// Answers come from the shared KAI brain (lib/ai/brain.ts): LangChain tools
// over real app data, Gemini → Groq → NVIDIA fallbacks. The built-in
// knowledge base is the last resort when no model answers.
export async function POST(req: Request) {
  try {
    /*
     * Every message here can cost real money (paid model APIs, possibly
     * several tool rounds). An unauthenticated script looping this endpoint
     * is a direct financial attack, so it gets a per-IP budget in addition
     * to the global proxy limit.
     */
    const limited = await requireRateLimit(req, [
      { scope: 'ip', limit: 20, windowMs: 60_000 },
    ]);
    if (!limited.ok) return limited.response;

    // Sanitised parse — rejects injection payloads and prototype-pollution keys.
    // 64 KB: one message plus up to 10 earlier turns.
    const { message, stream = true, context, history } = await readJsonBody(req, 64 * 1024) as {
      message?: string;
      stream?: boolean;
      context?: WalletContext;
      history?: unknown;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (message.length > 8000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
    }

    // Personal questions ("what's my portfolio worth", "best yield for me")
    // are answered straight from the wallet context the home page sends —
    // no LLM round-trip, so the numbers are always the real balances.
    const direct = personalAnswer(message, context);
    if (direct) {
      return stream
        ? streamText(direct)
        : NextResponse.json({ text: direct, agent: 'KAI Agent', rag_used: false, sources_count: 0 });
    }

    // Identity only from a verified Privy token — it unlocks the user's own
    // account data in the brain's get_my_account tool, nothing else.
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization')).catch(() => null);

    let text: string;
    let agent: string;
    let toolsUsed: string[] = [];
    try {
      const result = await runKai({
        message,
        history,
        mode: 'chat',
        privyUserId,
        wallet: context?.address ?? null,
        pageContext: contextSummary(context).trim(),
      });
      text = result.text;
      agent = `KAI (${result.provider})`;
      toolsUsed = result.toolsUsed;
      // The chat window can't show the brain's approval cards (only the voice
      // agent can), so say where each prepared plan is completed instead of
      // leaving "approve it in your wallet" with nothing to approve.
      if (result.plans.length) {
        const where: Record<string, string> = {
          prepare_swap: 'the Swap page (/swap)',
          prepare_mpesa_payment: 'the Pay page (/pay)',
          prepare_nft_purchase: 'the Conservation NFTs page (/connft)',
        };
        const pages = [...new Set(result.plans.map((p) => where[String(p.name)] ?? 'the Voice agent (/voice)'))];
        text = text.replace(/please review and approve it in your wallet\.?/i, '').trim();
        text += `${text ? '\n\n' : ''}Nothing has been sent. To review and sign this, open ${pages.join(' or ')} — you approve every transaction in your own wallet.`;
      }
    } catch (e) {
      if (!(e instanceof BrainUnavailableError)) console.error('[/api/chat] brain error', e);
      // Say plainly that the AI is down. The built-in notes are added only
      // when they actually match the question — the generic product menu
      // used to be returned as if it were an answer.
      const notes = kaiKnowledgeFallback(message);
      const matched = notes !== kaiKnowledgeFallback('');
      text = "KAI's AI is temporarily unavailable, so I can't answer that properly right now. Please try again in a few minutes."
        + (matched ? `\n\nMeanwhile, here is some general information:\n\n${notes}` : '');
      agent = 'KAI Agent (offline)';
    }

    return stream
      ? streamText(text)
      : NextResponse.json({ text, agent, rag_used: toolsUsed.length > 0, sources_count: toolsUsed.length, tools: toolsUsed });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/chat]', msg);
    return streamText(kaiKnowledgeFallback(''));
  }
}
