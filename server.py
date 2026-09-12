"""
KAI AI Agent Server v6.0  —  Powered by Needle (Cactus Compute, 14 MB)
=======================================================================
FastAPI application exposing:
  - Needle inference   (/needle/complete, /needle/stream, /needle/intent)
  - RAG chat           (/chat, /stream)
  - Health             (/health)
  - 8 specialised agent endpoints (/agents/*)
  - x402 payment rails            (/agents/x402/*)
  - W3C DID identity              (/agents/identity/*)
  - Escrow management             (/agents/escrow/*)
  - Agentic audit log             (/agents/rails/*)
  - Onboarding suite              (/agents/onboard/*)

All LLM calls are handled by Needle (cactus-needle) — no Ollama required.
"""

import sys
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import os, json, asyncio, shutil, hashlib
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Needle import ─────────────────────────────────────────────────────────────
try:
    from needle import Needle, tool
    
    @tool
    def transfer(token: str, amount: str, to: str):
        """Transfer cryptocurrency tokens to an address or recipient"""
        return {"token": token, "amount": amount, "to": to}

    @tool
    def deposit(token: str, amount: str):
        """Deposit or stake cryptocurrency tokens into a vault or yield farm"""
        return {"token": token, "amount": amount}

    @tool
    def pay_kes(amount_kes: str, phone: str):
        """Send an M-Pesa or fiat payment in Kenyan Shillings (KES)"""
        return {"amount_kes": amount_kes, "phone": phone}

    @tool
    def navigate(page: str):
        """Navigate to a page or section in the KAI application"""
        return {"page": page}

    @tool
    def mrv_audit(batch_id: str):
        """Audit or verify a tree nursery / MRV carbon credit batch"""
        return {"batch_id": batch_id}

    @tool
    def sdg_log(action_id: str):
        """Log an SDG impact activity or sustainability action"""
        return {"action_id": action_id}

    _needle = Needle(tools=[transfer, deposit, pay_kes, navigate, mrv_audit, sdg_log])
    NEEDLE_READY = True
    print("[KAI] Needle model loaded successfully (14 MB engine ready)")
except ImportError:
    _needle = None
    NEEDLE_READY = False
    print("[KAI] cactus-needle not installed. Run: pip install cactus-needle")
except Exception as exc:
    _needle = None
    NEEDLE_READY = False
    print(f"[KAI] Needle initialization note: {exc}")

# ── RAG retriever (vector store) ──────────────────────────────────────────────
try:
    from vector import retriever as _retriever
    RAG_READY = True
    print("[KAI] RAG vector store loaded")
except Exception as exc:
    _retriever = None
    RAG_READY = False
    print(f"[KAI] Vector store unavailable: {exc}")

# ── Agent imports ─────────────────────────────────────────────────────────────
from agents.tx_analyst        import TxAnalystAgent
from agents.portfolio_health  import PortfolioHealthAgent
from agents.contract_auditor  import ContractAuditorAgent, DEFAULT_CONTRACTS_DIR
from agents.dao_drafter       import DAODrafterAgent
from agents.commodity_pricing import CommodityPricingAgent
from agents.policy_recommender import PolicyRecommenderAgent
from agents.code_gen           import CodeGenAgent
from agents.doc_summarizer     import DocSummarizerAgent
from agents.did_tracker        import (DIDTrackerAgent, log_action, authorize,
                                       revoke, is_authorized, get_audit_log)
from agents.glacier_balance    import GlacierBalanceAgent, fetch_portfolio
from agents.liquidity_manager  import LiquidityManagerAgent, get_pool_state, calculate_il
from agents.yield_optimizer    import YieldOptimizerAgent, scan_all_yields
from agents.onboarding         import OnboardingAgent, STEP_GUIDES
from agents.kai_navigator      import KaiNavigatorAgent, INTENT_ROUTES
from agents.trust_score        import TrustScoreAgent, compute_score
from agents.hat_switcher       import HatSwitcherAgent, classify_hat
from agents.unified_profiler   import UnifiedProfilerAgent
from agents.content_curator    import ContentCuratorAgent
from agents.payment_approver   import PaymentApproverAgent, assess_risk
from agents.identity           import (
    list_agent_dids, resolve_did, resolve_address,
    AgentPassport, AgentCapabilities, AgentSigner,
)
from agents.x402_rails         import (
    build_402_response, build_payment_requirement, get_x402_info,
    settle_payment_async, decode_payment_header, x402_gate, ROUTE_PRICES,
)
from agents.rails              import agent_rails, PaymentChannel

# ── Singleton agent instances ─────────────────────────────────────────────────
tx_agent        = TxAnalystAgent()
portfolio_agent = PortfolioHealthAgent()
auditor_agent   = ContractAuditorAgent()
dao_agent       = DAODrafterAgent()
pricing_agent   = CommodityPricingAgent()
policy_agent    = PolicyRecommenderAgent()
codegen_agent   = CodeGenAgent()
doc_agent       = DocSummarizerAgent()
did_agent       = DIDTrackerAgent()
glacier_agent   = GlacierBalanceAgent()
liquidity_agent = LiquidityManagerAgent()
yield_agent     = YieldOptimizerAgent()
onboard_agent   = OnboardingAgent()
navigator_agent = KaiNavigatorAgent()
trust_agent     = TrustScoreAgent()
hat_agent       = HatSwitcherAgent()
profiler_agent  = UnifiedProfilerAgent()
curator_agent   = ContentCuratorAgent()
payment_risk_agent = PaymentApproverAgent()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="KAI Nuvari AI Agent — Needle Edition",
    version="6.0.0",
    description="14 MB Needle model powers all KAI on-device AI agents",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

KAI_SYSTEM = """You are KAI, an expert AI advisor for the KAI Nuvari DeFi ecosystem
built on Avalanche C-Chain. You help African communities access yield vaults, AMM pools,
M-Pesa payments, tokenized commodities, SDG impact tracking, and more.
Be concise, accurate, and culturally relevant. Use KES amounts where appropriate."""


# ═══════════════════════════════════════════════════════════════════════════════
#  Needle inference helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _needle_generate(prompt: str, system: str = "", max_tokens: int = 512) -> str:
    """Synchronous Needle text generation."""
    if not NEEDLE_READY or _needle is None:
        return "KAI AI engine is offline. Start server with Needle installed."
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    try:
        res = _needle.complete(full_prompt, max_new_tokens=max_tokens)
        if isinstance(res, dict):
            if res.get("function_calls"):
                return json.dumps(res["function_calls"])
            return res.get("reasoning") or res.get("text") or "Request processed by Needle."
        return str(res).strip()
    except Exception as exc:
        return f"Needle response: {exc}"


async def _needle_generate_async(prompt: str, system: str = "", max_tokens: int = 512) -> str:
    """Run Needle inference in a thread pool (non-blocking)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _needle_generate, prompt, system, max_tokens)


def _needle_generate_stream(prompt: str, system: str = "", max_tokens: int = 512):
    """Streaming generator for Needle."""
    if not NEEDLE_READY or _needle is None:
        yield f"data: {json.dumps({'token': 'KAI AI engine is offline.'})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"
        return
    try:
        text = _needle_generate(prompt, system, max_tokens)
        words = text.split(" ")
        for i, word in enumerate(words):
            token = ("" if i == 0 else " ") + word
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'token': f'Needle error: {exc}'})}\n\n"
        yield f"data: {json.dumps({'done': True, 'error': str(exc)})}\n\n"


# ── Intent / tool-calling helper ──────────────────────────────────────────────
KAI_TOOLS = [
    {"name": "navigate",   "description": "Navigate to a page in the app",        "params": ["page"]},
    {"name": "transfer",   "description": "Transfer tokens to an address",         "params": ["token", "amount", "to"]},
    {"name": "deposit",    "description": "Deposit tokens into a vault",           "params": ["token", "amount"]},
    {"name": "pay",        "description": "Send M-Pesa / Paystack payment",        "params": ["amount_kes", "phone"]},
    {"name": "balance",    "description": "Check portfolio / wallet balance",       "params": []},
    {"name": "mrv_audit",  "description": "Verify a tree nursery MRV batch",       "params": ["batch_id"]},
    {"name": "sdg_log",    "description": "Log an SDG impact activity",            "params": ["action_id"]},
    {"name": "query",      "description": "Answer a general knowledge question",   "params": ["question"]},
]

INTENT_SYSTEM = """You are a structured intent parser for a DeFi app.
Given a user message, respond ONLY with JSON in this format:
{"intent": "<tool_name>", "params": {<key>: <value>}, "spoken_reply": "<short friendly response>"}
Tool names: navigate, transfer, deposit, pay, balance, mrv_audit, sdg_log, query.
If unsure, use "query". Never include markdown or explanation outside the JSON."""


def _parse_needle_intent(text: str) -> dict:
    """Extract JSON from Needle output, even if wrapped in prose."""
    try:
        start = text.index("{")
        end   = text.rindex("}") + 1
        return json.loads(text[start:end])
    except Exception:
        return {"intent": "query", "params": {}, "spoken_reply": text.strip()}


# ═══════════════════════════════════════════════════════════════════════════════
#  NEEDLE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class CompleteRequest(BaseModel):
    prompt:     str
    system:     str  = ""
    max_tokens: int  = Field(512, ge=1, le=2048)
    stream:     bool = False

class IntentRequest(BaseModel):
    message: str
    tools:   list = []

class ChatRequest(BaseModel):
    question:   Optional[str] = None
    message:    Optional[str] = None
    max_tokens: int = 512
    rag:        bool = True

    def get_prompt(self) -> str:
        return self.question or self.message or ""

@app.get("/health")
async def health():
    return {
        "status":       "ok",
        "engine":       "needle",
        "needle_ready": NEEDLE_READY,
        "rag_ready":    RAG_READY,
        "version":      "6.0.0",
    }

@app.post("/needle/complete")
async def needle_complete_endpoint(req: CompleteRequest):
    """Non-streaming text completion via Needle."""
    text = await _needle_generate_async(req.prompt, system=req.system, max_tokens=req.max_tokens)
    return {"text": text, "engine": "needle"}

@app.post("/needle/stream")
async def needle_stream_endpoint(req: CompleteRequest):
    """Streaming SSE completion via Needle."""
    async def event_generator():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue = asyncio.Queue()

        def run_sync():
            for chunk in _needle_generate_stream(req.prompt, system=req.system, max_tokens=req.max_tokens):
                asyncio.run_coroutine_threadsafe(queue.put(chunk), loop)
            asyncio.run_coroutine_threadsafe(queue.put(None), loop)

        loop.run_in_executor(None, run_sync)

        while True:
            item = await queue.get()
            if item is None:
                break
            yield item

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/needle/intent")
async def needle_intent_endpoint(req: IntentRequest):
    """
    Structured intent / tool-calling via Needle.
    Returns a parsed JSON intent dict.
    """
    if NEEDLE_READY and _needle is not None:
        try:
            res = _needle.complete(req.message)
            if isinstance(res, dict):
                fcalls = res.get("function_calls", [])
                if fcalls:
                    first = fcalls[0]
                    name = first.get("name", "query")
                    return {
                        "intent": {
                            "intent": name,
                            "params": first.get("arguments", {}),
                            "spoken_reply": f"Preparing your {name} transaction on Avalanche."
                        },
                        "engine": "needle"
                    }
        except Exception:
            pass

    prompt = f"User message: {req.message}"
    raw    = await _needle_generate_async(prompt, system=INTENT_SYSTEM, max_tokens=256)
    parsed = _parse_needle_intent(raw)
    return {"intent": parsed, "raw": raw, "engine": "needle"}


# ═══════════════════════════════════════════════════════════════════════════════
#  RAG CHAT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/chat")
async def chat(req: ChatRequest):
    """RAG-augmented question answering using Needle."""
    query = req.get_prompt()
    context = ""
    if RAG_READY and _retriever and req.rag and query:
        try:
            docs    = _retriever.invoke(query)
            context = "\n\n".join(d.page_content for d in docs[:4])
        except Exception:
            context = ""

    prompt = f"""Context from KAI knowledge base:
{context}

User question: {query}

Answer concisely. If context is irrelevant, answer from general knowledge.""" if context else query

    text = await _needle_generate_async(prompt, system=KAI_SYSTEM, max_tokens=req.max_tokens)
    return {
        "answer": text,
        "text": text,
        "response": text,
        "engine": "needle",
        "rag_used": bool(context)
    }


@app.post("/stream")
async def stream_chat(req: ChatRequest):
    """Streaming RAG chat using Needle."""
    query = req.get_prompt()
    context = ""
    if RAG_READY and _retriever and req.rag and query:
        try:
            docs    = _retriever.invoke(query)
            context = "\n\n".join(d.page_content for d in docs[:4])
        except Exception:
            context = ""

    prompt = f"""Context:\n{context}\n\nQuestion: {query}""" if context else query

    async def event_generator():
        loop  = asyncio.get_event_loop()
        queue: asyncio.Queue = asyncio.Queue()

        def run_sync():
            for chunk in _needle_generate_stream(prompt, system=KAI_SYSTEM, max_tokens=req.max_tokens):
                asyncio.run_coroutine_threadsafe(queue.put(chunk), loop)
            asyncio.run_coroutine_threadsafe(queue.put(None), loop)

        loop.run_in_executor(None, run_sync)
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT ENDPOINTS  (unchanged API surface — only LLM backend swapped to Needle)
# ═══════════════════════════════════════════════════════════════════════════════

# ── Tx Analyst ────────────────────────────────────────────────────────────────
class TxRequest(BaseModel):
    tx_hash: str
    chain_id: int = 43113

@app.post("/agents/tx-analyst")
async def analyze_tx(req: TxRequest):
    return await tx_agent.run(tx_hash=req.tx_hash, chain_id=req.chain_id)

# ── Portfolio Health ──────────────────────────────────────────────────────────
class PortfolioRequest(BaseModel):
    wallet:   str
    chain_id: int = 43113

@app.post("/agents/portfolio")
async def portfolio_health(req: PortfolioRequest):
    return await portfolio_agent.run(wallet=req.wallet, chain_id=req.chain_id)

# ── Contract Auditor ──────────────────────────────────────────────────────────
class AuditRequest(BaseModel):
    source_code: Optional[str] = None
    filename:    Optional[str] = None

@app.post("/agents/audit")
async def audit_contract(req: AuditRequest):
    return await auditor_agent.run(source_code=req.source_code, filename=req.filename)

@app.post("/agents/audit/upload")
async def audit_contract_upload(file: UploadFile = File(...)):
    content = await file.read()
    return await auditor_agent.run(source_code=content.decode("utf-8", errors="ignore"))

# ── DAO Drafter ───────────────────────────────────────────────────────────────
class DAORequest(BaseModel):
    title:       str
    description: str
    proposer:    str = "Community Member"

@app.post("/agents/dao-draft")
async def dao_draft(req: DAORequest):
    return await dao_agent.run(title=req.title, description=req.description, proposer=req.proposer)

# ── Commodity Pricing ─────────────────────────────────────────────────────────
class PricingRequest(BaseModel):
    commodity: str
    quantity:  float = 1.0
    unit:      str   = "kg"

@app.post("/agents/pricing")
async def commodity_price(req: PricingRequest):
    return await pricing_agent.run(commodity=req.commodity, quantity=req.quantity, unit=req.unit)

# ── Policy Recommender ────────────────────────────────────────────────────────
class PolicyRequest(BaseModel):
    user_type:  str
    income:     float = 0.0
    dependents: int   = 0

@app.post("/agents/policy")
async def recommend_policy(req: PolicyRequest):
    return await policy_agent.run(user_type=req.user_type, income=req.income, dependents=req.dependents)

# ── Code Gen ─────────────────────────────────────────────────────────────────
class CodeGenRequest(BaseModel):
    description: str
    language:    str = "solidity"

@app.post("/agents/codegen")
async def codegen(req: CodeGenRequest):
    return await codegen_agent.run(description=req.description, language=req.language)

# ── Doc Summarizer ────────────────────────────────────────────────────────────
class DocRequest(BaseModel):
    text: str

@app.post("/agents/summarize")
async def summarize(req: DocRequest):
    return await doc_agent.run(text=req.text)

@app.post("/agents/summarize/upload")
async def summarize_upload(file: UploadFile = File(...)):
    content = await file.read()
    return await doc_agent.run(text=content.decode("utf-8", errors="ignore"))

# ── Glacier Balance ───────────────────────────────────────────────────────────
@app.get("/agents/portfolio/{wallet}")
async def get_portfolio(wallet: str):
    return await fetch_portfolio(wallet)

# ── Liquidity Manager ─────────────────────────────────────────────────────────
@app.get("/agents/pools/{pool_id}")
async def pool_state(pool_id: str):
    return await get_pool_state(pool_id)

@app.post("/agents/pools/il")
async def impermanent_loss(body: dict):
    return calculate_il(
        body.get("price_initial", 1.0),
        body.get("price_current",  1.0),
    )

# ── Yield Optimizer ───────────────────────────────────────────────────────────
@app.get("/agents/yields")
async def all_yields():
    return await scan_all_yields()

# ── Onboarding ────────────────────────────────────────────────────────────────
@app.get("/agents/onboard/steps")
async def onboard_steps():
    return {"steps": STEP_GUIDES}

@app.post("/agents/onboard")
async def onboard(body: dict):
    return await onboard_agent.run(**body)

# ── KAI Navigator ─────────────────────────────────────────────────────────────
@app.post("/agents/navigate")
async def navigate(body: dict):
    return await navigator_agent.run(message=body.get("message", ""))

# ── Trust Score ───────────────────────────────────────────────────────────────
class TrustScoreRequest(BaseModel):
    forest_score: float = 0.0
    msme_score:   float = 0.0
    chama_score:  float = 0.0
    user_name:    str   = "Community Member"

@app.post("/agents/onboard/trust")
async def trust_score(req: TrustScoreRequest):
    return await trust_agent.run(
        forest_score=req.forest_score,
        msme_score=req.msme_score,
        chama_score=req.chama_score,
        user_name=req.user_name,
    )

# ── Hat Switcher ──────────────────────────────────────────────────────────────
@app.post("/agents/onboard/hat")
async def hat_switch(body: dict):
    return classify_hat(body.get("message", ""))

# ── Unified Profiler ──────────────────────────────────────────────────────────
@app.post("/agents/onboard/profile")
async def unified_profile(body: dict):
    return await profiler_agent.run(**body)

# ── Content Curator ───────────────────────────────────────────────────────────
@app.post("/agents/onboard/content")
async def curate_content(body: dict):
    return await curator_agent.run(**body)

# ── Payment Risk ──────────────────────────────────────────────────────────────
@app.post("/agents/onboard/payment-risk")
async def payment_risk(body: dict):
    return assess_risk(body)

# ── DID Tracker ───────────────────────────────────────────────────────────────
@app.get("/agents/identity/dids")
async def list_dids():
    return await list_agent_dids()

@app.get("/agents/identity/did/{did}")
async def resolve_did_endpoint(did: str):
    return await resolve_did(did)

@app.get("/agents/identity/address/{address}")
async def resolve_address_endpoint(address: str):
    return await resolve_address(address)

# ── x402 Rails ────────────────────────────────────────────────────────────────
@app.get("/agents/x402/info")
async def x402_info():
    return get_x402_info()

@app.post("/agents/x402/settle")
async def x402_settle(body: dict):
    return await settle_payment_async(body)

@app.get("/agents/rails/log")
async def rails_log():
    return get_audit_log()

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGENT_PORT", "8000"))
    print(f"\n🚀 KAI Needle Agent Server starting on http://127.0.0.1:{port}")
    print("   Engine: Needle (14 MB — Cactus Compute)")
    print("   Docs:   http://127.0.0.1:{port}/docs\n")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
