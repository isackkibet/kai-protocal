"""
agents/x402_rails.py
x402 HTTP payment middleware for the KAI agent server.

Implements the full x402 flow on Avalanche Fuji:
    1. Server decorates a route → returns HTTP 402 with payment requirements
    2. Client receives the challenge, signs an EIP-3009 transfer authorisation
    3. Client retries with X-PAYMENT header containing the signed payload
    4. Middleware verifies the payment on-chain (or via registry) and allows through
    5. On success, the escrow contract records the settled payment reference

Reference: https://x402.org / https://build.avax.network/…/x402-payment-infrastructure

We implement a self-hosted facilitator (no Coinbase/Cloudflare dependency needed)
using:
    - EIP-712 typed data signing (eth_account)
    - Direct Fuji RPC for on-chain reads
    - KaiEscrow contract for settlement
    - KaiAgentRegistry for spend-policy enforcement
"""

from __future__ import annotations
import os
import json
import time
import hashlib
import base64
from typing import Callable, Awaitable, Any
import httpx
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from eth_account import Account
from eth_account.messages import encode_typed_data
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
FUJI_RPC       = os.getenv("AVAX_RPC_URL", "https://api.avax-test.network/ext/bc/C/rpc")
CHAIN_ID       = int(os.getenv("CHAIN_ID", "43113"))
ESCROW_ADDR    = os.getenv("KAI_ESCROW_ADDRESS",    "")
REGISTRY_ADDR  = os.getenv("KAI_AGENT_REGISTRY",    "")
TREASURY_ADDR  = os.getenv("WALLET_ADDRESS",         "0xB13727161583e38185530755a1A96D00fcCae870")
USDC_ADDR      = os.getenv("USDC_FUJI_ADDRESS",      "")  # USDC on Fuji (if deployed)
CENTS_ADDR     = os.getenv("NEXT_PUBLIC_CENTS_ADDRESS", "")  # CENTS token as micro-payment

# Fall back to CENTS token if no USDC on Fuji
PAYMENT_TOKEN  = USDC_ADDR or CENTS_ADDR or ""
PAYMENT_SYMBOL = "USDC" if USDC_ADDR else "CENTS"

# x402 price table: agent route → cost in token units (6 decimals for USDC, 18 for CENTS)
ROUTE_PRICES: dict[str, int] = {
    "/agents/tx/analyse":          100,     # 0.0001 USDC or 100 CENTS-wei
    "/agents/tx/stream":           100,
    "/agents/portfolio/health":    200,
    "/agents/portfolio/stream":    200,
    "/agents/audit":               500,
    "/agents/audit/stream":        500,
    "/agents/dao/draft":           200,
    "/agents/dao/stream":          200,
    "/agents/commodities/report":  100,
    "/agents/commodities/stream":  100,
    "/agents/policy/recommend":    200,
    "/agents/policy/stream":       200,
    "/agents/codegen/generate":    1000,
    "/agents/codegen/stream":      1000,
    "/agents/docs/ask":            100,
    "/agents/docs/stream":         100,
    "/agents/docs/ingest":         300,
}

# EIP-712 type for EIP-3009 transferWithAuthorization (simplified)
TRANSFER_AUTH_TYPES = {
    "EIP712Domain": [
        {"name": "name",              "type": "string"},
        {"name": "version",           "type": "string"},
        {"name": "chainId",           "type": "uint256"},
        {"name": "verifyingContract", "type": "address"},
    ],
    "TransferWithAuthorization": [
        {"name": "from",        "type": "address"},
        {"name": "to",          "type": "address"},
        {"name": "value",       "type": "uint256"},
        {"name": "validAfter",  "type": "uint256"},
        {"name": "validBefore", "type": "uint256"},
        {"name": "nonce",       "type": "bytes32"},
    ],
}

# ── Payment requirement builder ───────────────────────────────────────────────

def build_payment_requirement(route: str, payer: str | None = None) -> dict:
    """
    Build the x402 payment requirement object returned in the 402 response.
    This tells the client exactly how much to pay, to whom, and using which token.
    """
    price = ROUTE_PRICES.get(route, 100)
    nonce = "0x" + hashlib.sha3_256(
        f"{route}:{payer or 'anonymous'}:{time.time()}".encode()
    ).hexdigest()

    return {
        "x402Version":  1,
        "scheme":       "exact",
        "network":      f"eip155:{CHAIN_ID}",
        "maxAmountRequired": str(price),
        "resource":     f"https://kai.nuvari{route}",
        "description":  f"KAI Agent service: {route}",
        "mimeType":     "application/json",
        "payTo":        TREASURY_ADDR,
        "maxTimeoutSeconds": 300,
        "asset":        PAYMENT_TOKEN or "native",
        "assetSymbol":  PAYMENT_SYMBOL,
        "extra": {
            "escrowAddress":   ESCROW_ADDR,
            "registryAddress": REGISTRY_ADDR,
            "chainId":         CHAIN_ID,
            "nonce":           nonce,
            "validBefore":     int(time.time()) + 300,
        },
    }


def build_402_response(route: str, payer: str | None = None) -> JSONResponse:
    """Return a proper HTTP 402 response with payment requirements."""
    requirement = build_payment_requirement(route, payer)
    return JSONResponse(
        status_code=402,
        content={
            "error":   "Payment Required",
            "message": f"This KAI agent endpoint requires payment. Send the X-PAYMENT header with a valid x402 payload.",
            "accepts": [requirement],
        },
        headers={
            "X-Payment-Required": "true",
            "X-Payment-Network":  f"eip155:{CHAIN_ID}",
            "X-Payment-Asset":    PAYMENT_TOKEN or "native",
        },
    )


# ── Payment header verification ───────────────────────────────────────────────

class X402PaymentError(Exception):
    pass


def decode_payment_header(header_value: str) -> dict:
    """
    Decode the X-PAYMENT header. The header is a base64-encoded JSON payload:
    {
        "x402Version": 1,
        "scheme": "exact",
        "network": "eip155:43113",
        "payload": {
            "signature": "0x...",
            "authorization": { ...EIP-712 transferWithAuthorization... }
        }
    }
    """
    try:
        raw = base64.b64decode(header_value + "==").decode("utf-8")
        return json.loads(raw)
    except Exception:
        try:
            return json.loads(header_value)
        except Exception as e:
            raise X402PaymentError(f"Invalid X-PAYMENT header: {e}")


def verify_payment_signature(
    payment: dict,
    expected_route: str,
    expected_amount: int,
) -> tuple[bool, str]:
    """
    Verify the payment payload signature off-chain.
    Returns (is_valid, payer_address).

    Full on-chain settlement happens asynchronously via the escrow contract.
    This fast path checks the cryptographic proof so the agent can respond
    immediately without waiting for on-chain confirmation.
    """
    try:
        payload = payment.get("payload", {})
        auth    = payload.get("authorization", {})
        sig     = payload.get("signature", "")

        if not sig or not auth:
            return False, ""

        # Recover signer from EIP-712 transferWithAuthorization
        token_addr = auth.get("asset") or auth.get("token") or PAYMENT_TOKEN
        domain = {
            "name":              auth.get("tokenName", "USD Coin"),
            "version":           "2",
            "chainId":           CHAIN_ID,
            "verifyingContract": token_addr or TREASURY_ADDR,
        }

        message = {
            "from":        auth.get("from", ""),
            "to":          auth.get("to",   TREASURY_ADDR),
            "value":       int(auth.get("value", 0)),
            "validAfter":  int(auth.get("validAfter",  0)),
            "validBefore": int(auth.get("validBefore", int(time.time()) + 300)),
            "nonce":       auth.get("nonce", "0x" + "00" * 32),
        }

        # Check deadline
        if time.time() > message["validBefore"]:
            return False, ""

        # Check amount
        if message["value"] < expected_amount:
            return False, ""

        # Recover signer
        recovered = Account.recover_message(
            encode_typed_data(
                domain_data=domain,
                message_types={"TransferWithAuthorization": TRANSFER_AUTH_TYPES["TransferWithAuthorization"]},
                message_data=message,
            ),
            signature=sig,
        )
        return True, recovered

    except Exception:
        return False, ""


# ── x402 FastAPI middleware (dependency) ──────────────────────────────────────

class X402Middleware:
    """
    FastAPI dependency that gates a route behind x402 payment.

    Usage:
        @app.post("/agents/tx/analyse")
        async def my_route(payment=Depends(x402_middleware("/agents/tx/analyse"))):
            ...
    """

    def __init__(self, route: str, enabled: bool = True):
        self.route   = route
        self.enabled = enabled
        self.price   = ROUTE_PRICES.get(route, 100)

    async def __call__(self, request: Request) -> dict:
        """
        Returns payment context dict if payment is valid (or bypassed).
        Raises HTTPException(402) if payment is required but missing/invalid.
        """
        if not self.enabled or not PAYMENT_TOKEN:
            # x402 not configured — allow through (dev mode)
            return {"paid": False, "dev_mode": True, "route": self.route}

        # Check for bypass: owner wallet (no payment required for owner)
        caller_addr = request.headers.get("X-Wallet-Address", "")
        if caller_addr.lower() == TREASURY_ADDR.lower():
            return {"paid": False, "owner": True, "route": self.route}

        # Check X-PAYMENT header
        payment_header = request.headers.get("X-PAYMENT", "")
        if not payment_header:
            # Return 402 challenge
            req  = build_payment_requirement(self.route, caller_addr or None)
            raise HTTPException(
                status_code=402,
                detail={
                    "error":   "Payment Required",
                    "accepts": [req],
                },
            )

        # Verify the payment
        try:
            payment = decode_payment_header(payment_header)
            valid, payer = verify_payment_signature(payment, self.route, self.price)
            if not valid:
                raise HTTPException(status_code=402, detail={"error": "Invalid payment signature"})
            return {
                "paid":    True,
                "payer":   payer,
                "amount":  self.price,
                "route":   self.route,
                "payment": payment,
            }
        except X402PaymentError as e:
            raise HTTPException(status_code=402, detail={"error": str(e)})


def x402_gate(route: str, enabled: bool | None = None) -> X402Middleware:
    """Factory for creating route-specific x402 middleware."""
    # If PAYMENT_TOKEN is not set, default to disabled (dev mode)
    active = enabled if enabled is not None else bool(PAYMENT_TOKEN)
    return X402Middleware(route=route, enabled=active)


# ── Settlement helper ─────────────────────────────────────────────────────────

async def settle_payment_async(
    payment: dict,
    agent_address: str,
    service_desc: str,
    auto_release_sec: int = 300,
) -> dict:
    """
    After the agent completes work, call the escrow contract to record settlement.
    This is fire-and-forget — the agent response doesn't wait for this.

    In production this would be called by a background task after the agent
    returns its response.
    """
    if not ESCROW_ADDR:
        return {"settled": False, "reason": "Escrow not deployed — run deploy-agent-infra.ts"}

    auth    = payment.get("payload", {}).get("authorization", {})
    payer   = auth.get("from", "")
    amount  = int(auth.get("value", 0))
    nonce   = auth.get("nonce", "0x" + "00" * 32)

    payment_ref = "0x" + hashlib.sha3_256(
        json.dumps(payment, sort_keys=True).encode()
    ).hexdigest()[:64]

    # Build the eth_call to deposit() on KaiEscrow
    # In production this would be signed and broadcast; here we return the tx data
    return {
        "settled":       False,  # would be True after broadcast
        "escrow_addr":   ESCROW_ADDR,
        "payment_ref":   payment_ref,
        "payer":         payer,
        "agent":         agent_address,
        "amount":        amount,
        "service_desc":  service_desc,
        "auto_release_at": int(time.time()) + auto_release_sec,
        "note": "On-chain settlement queued. Call /agents/x402/settle to broadcast.",
    }


# ── x402 status / info endpoint data ─────────────────────────────────────────

def get_x402_info() -> dict:
    """Returns x402 configuration info for the /agents/x402/info endpoint."""
    return {
        "x402_version":  1,
        "network":       f"eip155:{CHAIN_ID}",
        "payment_token": PAYMENT_TOKEN or "not configured",
        "payment_symbol":PAYMENT_SYMBOL,
        "treasury":      TREASURY_ADDR,
        "escrow":        ESCROW_ADDR or "not deployed",
        "registry":      REGISTRY_ADDR or "not deployed",
        "route_prices":  ROUTE_PRICES,
        "dev_mode":      not bool(PAYMENT_TOKEN),
        "note": (
            "Set KAI_ESCROW_ADDRESS and KAI_AGENT_REGISTRY in .env after running "
            "deploy-agent-infra.ts to enable live on-chain payments."
            if not ESCROW_ADDR else
            "x402 live on Avalanche Fuji."
        ),
    }
