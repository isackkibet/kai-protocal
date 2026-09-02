"""
KAI AI Agent Server v4.0
FastAPI application exposing:
  - Original RAG chat endpoints  (/chat, /stream, /health)
  - 8 specialised agent endpoints (/agents/*)
  - x402 payment rails            (/agents/x402/*)
  - W3C DID identity              (/agents/identity/*)
  - Escrow management             (/agents/escrow/*)
  - Agentic audit log             (/agents/rails/*)
All powered by local Ollama — no external API keys required.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever
import os, json, httpx, asyncio, shutil, hashlib
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Agent imports ─────────────────────────────────────────────────────────────
from agents.tx_analyst       import TxAnalystAgent
from agents.portfolio_health  import PortfolioHealthAgent
from agents.contract_auditor  import ContractAuditorAgent, DEFAULT_CONTRACTS_DIR
from agents.dao_drafter       import DAODrafterAgent
from agents.commodity_pricing import CommodityPricingAgent
from agents.policy_recommender import PolicyRecommenderAgent
from agents.code_gen          import CodeGenAgent
from agents.doc_summarizer    import DocSummarizerAgent

# ── Agentic Rails imports ─────────────────────────────────────────────────────
from agents.identity   import (
    list_agent_dids, resolve_did, resolve_address,
    AgentPassport, AgentCapabilities, AgentSigner,
)
from agents.x402_rails import (
    build_402_response, build_payment_requirement, get_x402_info,
    settle_payment_async, decode_payment_header, x402_gate, ROUTE_PRICES,
)
from agents.rails import agent_rails, PaymentChannel

# ── Singleton agent instances ─────────────────────────────────────────────────
tx_agent        = TxAnalystAgent()
portfolio_agent = PortfolioHealthAgent()
auditor_agent   = ContractAuditorAgent()
dao_agent       = DAODrafterAgent()
pricing_agent   = CommodityPricingAgent()
policy_agent    = PolicyRecommenderAgent()
codegen_agent   = CodeGenAgent()
doc_agent       = DocSummarizerAgent()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="KAI Multi-Agent Server", version="3.0.0")

ORIGINS = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Original RAG config ───────────────────────────────────────────────────────
OLLAMA_URL   = os.getenv("OLLAMA_BASE_URL",  "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_LLM_MODEL", "qwen3:0.6b")

model = OllamaLLM(
    model=OLLAMA_MODEL, base_url=OLLAMA_URL,
    client_kwargs={"timeout": 600.0}, num_predict=1024, think=False,
)

RAG_TEMPLATE = """You are KAI, the AI assistant for KAI Nuvari — a DeFi ecosystem built on Avalanche C-Chain (Fuji testnet).

KAI Nuvari is a decentralised finance platform that provides:
- 6 ecosystem tokens: NVR (governance), yBOB (stable), YTOKEN (yield ETF), YGOLD (gold-backed), GAMI (community rewards), CENTS (micro-savings)
- AMM liquidity pools (NVR/yBOB, YTOKEN/YGOLD, GAMI/CENTS) with x*y=k pricing
- Yield vaults for each token (kvNVR, kvyBOB, etc.) paying APY
- Securities & Insurance products: KAIVAX Pension, KAI Trust, Crop Insurance, Forest Protection, Medical Pool, RWA Tokenization
- Community commodity tokenization: honey, milk, beadwork, traditional medicine, seeds, pottery, bark cloth
- DAO governance with NVR voting power
- M-Pesa integration for KES payments (Kenya)
- x402 payment rails and W3C DID agent identity
- Conservation NFT marketplace priced in yBOB

Always answer based on the retrieved context below. Be specific about token addresses,
APY rates, pool pairs, and product features. If the context doesn't cover the question,
say so rather than guessing.

Retrieved context from KAI Nuvari documentation:
{reviews}

User question: {question}

Answer clearly and helpfully. Use numbers and specifics from the context."""

PLAIN_TEMPLATE = """You are KAI, the AI assistant for KAI Nuvari — a DeFi ecosystem on Avalanche C-Chain.
KAI Nuvari provides yield vaults, AMM pools, conservation NFTs, M-Pesa payments,
and community commodity tokenization for African markets.

User: {question}
KAI:"""

prompt       = ChatPromptTemplate.from_template(RAG_TEMPLATE)
chain        = prompt | model
plain_prompt = ChatPromptTemplate.from_template(PLAIN_TEMPLATE)
plain_chain  = plain_prompt | model

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# ═════════════════════════════════════════════════════════════════════════════
# Original endpoints (unchanged)
# ═════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str
    rag: bool = True

class ChatResponse(BaseModel):
    text: str
    agent: str
    rag_used: bool
    sources_count: int


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": OLLAMA_MODEL,
        "agents": [
            "tx_analyst", "portfolio_health", "contract_auditor",
            "dao_drafter", "commodity_pricing", "policy_recommender",
            "code_gen", "doc_summarizer",
        ],
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    if not body.message.strip():
        raise HTTPException(400, "Message cannot be empty")
    try:
        if body.rag:
            docs    = retriever.invoke(body.message)
            context = "\n\n".join(f"[Doc {i+1}]: {d.page_content}" for i, d in enumerate(docs))
            result  = chain.invoke({"reviews": context, "question": body.message})
            return ChatResponse(text=str(result), agent="KAI AVAX Agent", rag_used=True, sources_count=len(docs))
        result = plain_chain.invoke({"question": body.message})
        return ChatResponse(text=str(result), agent="KAI AVAX Agent", rag_used=False, sources_count=0)
    except Exception as e:
        raise HTTPException(500, f"RAG chain error: {e}")


@app.post("/stream")
async def stream_chat(body: ChatRequest):
    if not body.message.strip():
        raise HTTPException(400, "Message cannot be empty")
    if body.rag:
        docs    = retriever.invoke(body.message)
        context = "\n\n".join(f"[Doc {i+1}]: {d.page_content}" for i, d in enumerate(docs))
        sources = len(docs)
        full_prompt = (
            f"You are KAI, the AI assistant for KAI Nuvari — a DeFi ecosystem on Avalanche C-Chain.\n\n"
            f"KAI Nuvari provides: 6 ecosystem tokens (NVR, yBOB, YTOKEN, YGOLD, GAMI, CENTS), "
            f"AMM pools, yield vaults, securities & insurance products, community commodity tokenization, "
            f"M-Pesa integration, and conservation NFTs.\n\n"
            f"Retrieved context from KAI Nuvari documentation:\n{context}\n\n"
            f"User question: {body.message}\n\n"
            f"Answer clearly using specifics from the context. If unsure, say so."
        )
    else:
        sources = 0
        full_prompt = f"You are KAI, an AI advisor.\n\nUser: {body.message}\nKAI:"

    async def event_generator():
        payload = {"model": OLLAMA_MODEL, "prompt": full_prompt,
                   "stream": True, "think": False, "options": {"num_predict": 1024}}
        async with httpx.AsyncClient(timeout=600.0) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/generate", json=payload) as resp:
                async for line in resp.aiter_lines():
                    if not line: continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = chunk.get("response", "")
                    if token:
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    if chunk.get("done"):
                        yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"
                        return

    return StreamingResponse(event_generator(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ═════════════════════════════════════════════════════════════════════════════
# Agent 1: Transaction Analyst
# ═════════════════════════════════════════════════════════════════════════════

class TxRequest(BaseModel):
    tx_hash: str = ""
    address: str = ""

@app.post("/agents/tx/analyse")
async def tx_analyse(body: TxRequest):
    if not body.tx_hash and not body.address:
        raise HTTPException(400, "Provide tx_hash or address")
    return await tx_agent.run(tx_hash=body.tx_hash, address=body.address)

@app.post("/agents/tx/stream")
async def tx_stream(body: TxRequest):
    if not body.tx_hash and not body.address:
        raise HTTPException(400, "Provide tx_hash or address")
    return StreamingResponse(
        tx_agent.stream(tx_hash=body.tx_hash, address=body.address),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═════════════════════════════════════════════════════════════════════════════
# Agent 2: Portfolio Health
# ═════════════════════════════════════════════════════════════════════════════

class PortfolioRequest(BaseModel):
    wallet: str
    token_map: dict = Field(default_factory=dict)
    vault_map:  dict = Field(default_factory=dict)

@app.post("/agents/portfolio/health")
async def portfolio_health(body: PortfolioRequest):
    if not body.wallet:
        raise HTTPException(400, "wallet address required")
    return await portfolio_agent.run(
        wallet=body.wallet,
        token_map=body.token_map,
        vault_map=body.vault_map,
    )

@app.post("/agents/portfolio/stream")
async def portfolio_stream(body: PortfolioRequest):
    return StreamingResponse(
        portfolio_agent.stream(wallet=body.wallet,
                               token_map=body.token_map,
                               vault_map=body.vault_map),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═════════════════════════════════════════════════════════════════════════════
# Agent 3: Contract Auditor
# ═════════════════════════════════════════════════════════════════════════════

class AuditRequest(BaseModel):
    contracts_dir: str = DEFAULT_CONTRACTS_DIR
    filename: Optional[str] = None

@app.post("/agents/audit")
async def audit_contracts(body: AuditRequest):
    return await auditor_agent.run(
        contracts_dir=body.contracts_dir,
        filename=body.filename,
    )

@app.post("/agents/audit/stream")
async def audit_stream(body: AuditRequest):
    return StreamingResponse(
        auditor_agent.stream(contracts_dir=body.contracts_dir,
                             filename=body.filename),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═════════════════════════════════════════════════════════════════════════════
# Agent 4: DAO Proposal Drafter
# ═════════════════════════════════════════════════════════════════════════════

class DAORequest(BaseModel):
    idea: str
    author: str = "Community Member"
    category: str = "Protocol"
    kip_number: Optional[int] = None

@app.post("/agents/dao/draft")
async def dao_draft(body: DAORequest):
    if not body.idea.strip():
        raise HTTPException(400, "idea cannot be empty")
    return await dao_agent.run(
        idea=body.idea,
        author=body.author,
        category=body.category,
        kip_number=body.kip_number,
    )

@app.post("/agents/dao/stream")
async def dao_stream(body: DAORequest):
    return StreamingResponse(
        dao_agent.stream(idea=body.idea, author=body.author,
                         category=body.category, kip_number=body.kip_number),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═════════════════════════════════════════════════════════════════════════════
# Agent 5: Commodity Pricing
# ═════════════════════════════════════════════════════════════════════════════

class CommodityRequest(BaseModel):
    commodity: Optional[str] = None
    days: int = 7
    question: Optional[str] = None

class PriceSubmission(BaseModel):
    commodity: str
    price_usd: float
    submitter: str = "community"
    unit: str = "kg"

@app.post("/agents/commodities/report")
async def commodity_report(body: CommodityRequest):
    return await pricing_agent.run(
        commodity=body.commodity,
        days=body.days,
        question=body.question,
    )

@app.post("/agents/commodities/stream")
async def commodity_stream(body: CommodityRequest):
    return StreamingResponse(
        pricing_agent.stream(commodity=body.commodity,
                             days=body.days, question=body.question),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@app.post("/agents/commodities/price")
async def submit_price(body: PriceSubmission):
    """Submit a community price observation."""
    result = CommodityPricingAgent.submit_price(
        commodity=body.commodity,
        price_usd=body.price_usd,
        submitter=body.submitter,
        unit=body.unit,
    )
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


# ═════════════════════════════════════════════════════════════════════════════
# Agent 6: Policy Recommender
# ═════════════════════════════════════════════════════════════════════════════

class PolicyRequest(BaseModel):
    age: int = 30
    risk_tolerance: str = "medium"
    goals: list[str] = Field(default_factory=lambda: ["savings", "yield"])
    occupation: str = "general"
    monthly_income_usd: float = 500.0
    current_holdings: dict = Field(default_factory=dict)
    location: str = "Kenya"
    question: Optional[str] = None

@app.post("/agents/policy/recommend")
async def policy_recommend(body: PolicyRequest):
    return await policy_agent.run(**body.model_dump())

@app.post("/agents/policy/stream")
async def policy_stream(body: PolicyRequest):
    return StreamingResponse(
        policy_agent.stream(**body.model_dump()),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═════════════════════════════════════════════════════════════════════════════
# Agent 7: Code Generator
# ═════════════════════════════════════════════════════════════════════════════

class CodeGenRequest(BaseModel):
    description: str
    contract_name: str = "GeneratedContract"
    save: bool = False

@app.post("/agents/codegen/generate")
async def codegen_generate(body: CodeGenRequest):
    if not body.description.strip():
        raise HTTPException(400, "description cannot be empty")
    return await codegen_agent.run(
        description=body.description,
        contract_name=body.contract_name,
        save=body.save,
    )

@app.post("/agents/codegen/stream")
async def codegen_stream(body: CodeGenRequest):
    return StreamingResponse(
        codegen_agent.stream(description=body.description,
                             contract_name=body.contract_name,
                             save=body.save),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ═════════════════════════════════════════════════════════════════════════════
# Agent 8: Document Summarizer
# ═════════════════════════════════════════════════════════════════════════════

class DocQuestionRequest(BaseModel):
    question: str
    collection: str = "kai_docs_uploaded"
    k: int = 5

@app.post("/agents/docs/ask")
async def docs_ask(body: DocQuestionRequest):
    if not body.question.strip():
        raise HTTPException(400, "question cannot be empty")
    return await doc_agent.run(
        question=body.question,
        collection=body.collection,
        k=body.k,
    )

@app.post("/agents/docs/stream")
async def docs_stream(body: DocQuestionRequest):
    return StreamingResponse(
        doc_agent.stream(question=body.question,
                         collection=body.collection, k=body.k),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@app.post("/agents/docs/ingest")
async def docs_ingest(
    file: UploadFile = File(...),
    collection: str = Form(default="kai_docs_uploaded"),
):
    """Upload a document (PDF, TXT, MD) and ingest it into the vector store."""
    dest = os.path.join(UPLOADS_DIR, file.filename or "upload.txt")
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    result = doc_agent.ingest(dest, collection=collection)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result

@app.get("/agents/docs/list")
async def docs_list(collection: str = "kai_docs_uploaded"):
    return {"collection": collection, "documents": doc_agent.list_documents(collection)}

@app.delete("/agents/docs/collection")
async def docs_delete_collection(collection: str = "kai_docs_uploaded"):
    return doc_agent.delete_collection(collection)


# ═════════════════════════════════════════════════════════════════════════════
# Agent registry — discovery endpoint
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/agents")
def list_agents():
    return {
        "agents": [
            {"name": "tx_analyst",        "endpoints": ["/agents/tx/analyse",          "/agents/tx/stream"],           "description": "Explains Fuji transactions in plain English"},
            {"name": "portfolio_health",   "endpoints": ["/agents/portfolio/health",    "/agents/portfolio/stream"],    "description": "Wallet & vault position health report"},
            {"name": "contract_auditor",   "endpoints": ["/agents/audit",               "/agents/audit/stream"],        "description": "Security analysis of Solidity contracts"},
            {"name": "dao_drafter",        "endpoints": ["/agents/dao/draft",           "/agents/dao/stream"],          "description": "Formal KAIVAX DAO governance proposals"},
            {"name": "commodity_pricing",  "endpoints": ["/agents/commodities/report",  "/agents/commodities/stream",
                                                          "/agents/commodities/price"],                                  "description": "Community commodity market analysis"},
            {"name": "policy_recommender", "endpoints": ["/agents/policy/recommend",    "/agents/policy/stream"],       "description": "Personalised KAIVAX product recommendations"},
            {"name": "code_gen",           "endpoints": ["/agents/codegen/generate",    "/agents/codegen/stream"],      "description": "Solidity generation with Hardhat compile loop"},
            {"name": "doc_summarizer",     "endpoints": ["/agents/docs/ask",            "/agents/docs/stream",
                                                          "/agents/docs/ingest",         "/agents/docs/list",
                                                          "/agents/docs/collection"],                                    "description": "Document Q&A via local RAG"},
        ],
        "rails": {
            "x402":   "/agents/x402/info",
            "identity": "/agents/identity/list",
            "escrow": "/agents/escrow/list",
            "audit":  "/agents/rails/audit",
        },
    }


# ═════════════════════════════════════════════════════════════════════════════
# AGENTIC RAILS — x402, DID Identity, Escrow, Audit
# ═════════════════════════════════════════════════════════════════════════════

# ─── x402 Payment Rails ──────────────────────────────────────────────────────

@app.get("/agents/x402/info")
def x402_info():
    """Returns x402 payment configuration for this server."""
    return get_x402_info()


@app.post("/agents/x402/challenge")
async def x402_challenge(request: Request):
    """
    Return an HTTP 402 payment challenge for a given route.
    Call this to get payment requirements before calling a paid endpoint.
    """
    body   = await request.json()
    route  = body.get("route", "/agents/tx/analyse")
    payer  = body.get("payer")
    req    = build_payment_requirement(route, payer)
    return {"x402Version": 1, "accepts": [req], "route": route}


@app.post("/agents/x402/verify")
async def x402_verify(request: Request):
    """
    Verify an X-PAYMENT header payload off-chain.
    Returns {valid, payer} — does not settle on-chain.
    """
    body   = await request.json()
    header = body.get("payment_header", "")
    route  = body.get("route", "/agents/tx/analyse")
    if not header:
        raise HTTPException(400, "payment_header required")
    try:
        from agents.x402_rails import verify_payment_signature, decode_payment_header, ROUTE_PRICES
        payment  = decode_payment_header(header)
        price    = ROUTE_PRICES.get(route, 100)
        valid, payer = verify_payment_signature(payment, route, price)
        return {"valid": valid, "payer": payer, "route": route, "required_amount": price}
    except Exception as e:
        return {"valid": False, "error": str(e)}


@app.post("/agents/x402/settle")
async def x402_settle(request: Request):
    """
    Request async on-chain settlement of a completed payment.
    Returns the unsigned escrow deposit transaction for the frontend to broadcast.
    """
    body          = await request.json()
    payment       = body.get("payment", {})
    agent_address = body.get("agent_address", "")
    service_desc  = body.get("service_desc", "KAI agent service")
    if not payment or not agent_address:
        raise HTTPException(400, "payment and agent_address required")
    result = await settle_payment_async(payment, agent_address, service_desc)
    return result


# ─── W3C DID Identity ─────────────────────────────────────────────────────────

@app.get("/agents/identity/list")
def identity_list():
    """List all registered KAI agent DID documents."""
    return {"agents": list_agent_dids(), "count": len(list_agent_dids())}


@app.get("/agents/identity/{agent_name}")
def identity_resolve(agent_name: str):
    """
    Resolve the W3C DID document for a named KAI agent.
    Also accepts a full did:kai:... string or 0x address.
    """
    # Try by DID string
    if agent_name.startswith("did:kai:"):
        doc = resolve_did(agent_name)
        if doc:
            return doc
        raise HTTPException(404, f"DID not found: {agent_name}")

    # Try by 0x address
    if agent_name.startswith("0x"):
        passport = resolve_address(agent_name)
        if passport:
            return passport.to_w3c_document()
        raise HTTPException(404, f"Agent address not found: {agent_name}")

    # Try by short name (e.g. "tx_analyst")
    from agents.identity import _PASSPORT_STORE
    for passport in _PASSPORT_STORE.values():
        name_slug = passport.name.lower().replace(" ", "_").replace("kai_", "")
        if agent_name.lower() in (name_slug, passport.name.lower()):
            return passport.to_w3c_document()

    raise HTTPException(404, f"Agent '{agent_name}' not found")


class RegisterAgentRequest(BaseModel):
    agent_address: str
    owner_address: str
    name: str
    description: str
    capabilities: dict = Field(default_factory=dict)
    service_endpoint: str = "http://127.0.0.1:8000"

@app.post("/agents/identity/register")
def identity_register(body: RegisterAgentRequest):
    """
    Register a new agent passport in the local DID store.
    Also returns the args to call KaiAgentRegistry.registerAgent() on-chain.
    """
    from agents.identity import register_local
    caps = AgentCapabilities(**{k: v for k, v in body.capabilities.items()
                                if k in AgentCapabilities.__dataclass_fields__})
    passport = AgentPassport(
        agent_address=body.agent_address,
        owner_address=body.owner_address,
        name=body.name,
        description=body.description,
        capabilities=caps,
        service_endpoint=body.service_endpoint,
    )
    doc          = register_local(passport)
    registry_args = passport.to_registry_args()
    return {
        "did":           passport.did,
        "document":      doc,
        "registry_args": registry_args,
        "note": "Call KaiAgentRegistry.registerAgent() with registry_args to register on-chain.",
    }


# ─── Escrow Management ────────────────────────────────────────────────────────

class EscrowDepositRequest(BaseModel):
    payment_ref:      str
    provider:         str
    agent_name:       str
    token:            str = ""
    amount:           int = 100
    auto_release_sec: int = 300
    service_desc:     str = "KAI agent service"

@app.post("/agents/escrow/deposit")
async def escrow_deposit(body: EscrowDepositRequest):
    """
    Build an unsigned escrow deposit transaction.
    Returns the tx data for the frontend wallet to sign and broadcast.
    """
    # Resolve agent address from name
    from agents.identity import _PASSPORT_STORE
    agent_addr = ""
    for p in _PASSPORT_STORE.values():
        if body.agent_name.lower() in p.name.lower():
            agent_addr = p.agent_address
            break

    if not agent_addr:
        raise HTTPException(404, f"Agent '{body.agent_name}' not found")

    tx = agent_rails.escrow.build_deposit_tx(
        payment_ref=body.payment_ref,
        provider=body.provider,
        agent=agent_addr,
        token=body.token or "0x0000000000000000000000000000000000000000",
        amount=body.amount,
        auto_release_sec=body.auto_release_sec,
        service_desc=body.service_desc,
    )
    return {"escrow_tx": tx, "agent_address": agent_addr}


@app.post("/agents/escrow/release/{escrow_id}")
def escrow_release(escrow_id: str):
    """Build unsigned release transaction for an escrow."""
    tx = agent_rails.escrow.build_release_tx(escrow_id)
    return {"release_tx": tx}


@app.post("/agents/escrow/refund/{escrow_id}")
def escrow_refund(escrow_id: str):
    """Build unsigned refund transaction for an escrow."""
    tx = agent_rails.escrow.build_refund_tx(escrow_id)
    return {"refund_tx": tx}


@app.get("/agents/escrow/list")
def escrow_list():
    """List all escrow records tracked this session."""
    return {
        "escrows": [vars(e) for e in agent_rails.escrow.list_local()],
        "count":   len(agent_rails.escrow.list_local()),
    }


# ─── Agent-to-Agent Payments ─────────────────────────────────────────────────

class A2APaymentRequest(BaseModel):
    from_agent:  str
    to_agent:    str
    amount:      int  = 100
    description: str  = "Sub-service payment"

@app.post("/agents/rails/a2a")
async def rails_a2a(body: A2APaymentRequest):
    """
    Route a micropayment from one KAI agent to another.
    Returns the escrow tx data for the orchestrating agent to broadcast.
    """
    result = await agent_rails.agent_to_agent_payment(
        from_agent=body.from_agent,
        to_agent=body.to_agent,
        amount=body.amount,
        description=body.description,
    )
    return result


# ─── Spend Policy ─────────────────────────────────────────────────────────────

@app.get("/agents/rails/spend/{agent_name}")
def rails_spend(agent_name: str):
    """Returns today's spend total for a named agent."""
    spent = agent_rails.enforcer.daily_spent(agent_name)
    return {"agent": agent_name, "daily_spent_wei": spent, "daily_spent_eth": spent / 1e18}


# ─── Audit Log ────────────────────────────────────────────────────────────────

@app.get("/agents/rails/audit")
def rails_audit(limit: int = 50):
    """Returns the payment channel audit log for all agent interactions."""
    return {"channels": agent_rails.audit_log(limit), "total": len(agent_rails._channels)}


# ─── Pre-flight check (used by the Next.js frontend) ─────────────────────────

class PreflightRequest(BaseModel):
    route:         str
    agent_name:    str
    agent_address: str = ""
    payer:         str = ""
    amount:        int = 100

@app.post("/agents/rails/preflight")
async def rails_preflight(body: PreflightRequest):
    """
    Run pre-flight checks for an agent call:
        1. Registry active check
        2. Spend policy enforcement
        3. Open a payment channel
    Returns the channel receipt + escrow deposit tx.
    """
    # Resolve agent address if not provided
    if not body.agent_address:
        from agents.identity import _PASSPORT_STORE
        for p in _PASSPORT_STORE.values():
            if body.agent_name.lower() in p.name.lower():
                body.agent_address = p.agent_address
                break

    body_hash = hashlib.sha3_256(body.route.encode()).hexdigest()

    try:
        channel = await agent_rails.pre_flight(
            route=body.route,
            agent_name=body.agent_name,
            agent_address=body.agent_address or "0x0000000000000000000000000000000000000001",
            payer=body.payer or "anonymous",
            amount=body.amount,
            body_hash=body_hash,
        )
        escrow_tx = agent_rails.get_escrow_deposit(
            channel=channel,
            provider_address=body.agent_address or "0x0000000000000000000000000000000000000001",
            service_desc=f"KAI {body.agent_name} → {body.route}",
        )
        return {
            "pre_flight": "passed",
            "channel":    channel.to_receipt(),
            "escrow_tx":  escrow_tx,
            "x402_req":   build_payment_requirement(body.route, body.payer or None),
        }
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except ValueError as e:
        raise HTTPException(429, str(e))

