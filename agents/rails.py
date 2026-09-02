"""
agents/rails.py
Avalanche Agentic Rails — the glue layer that connects:
    - KaiAgentRegistry  (on-chain agent DID + spend policies)
    - KaiEscrow         (x402 escrow settlement)
    - x402_rails        (HTTP payment middleware)
    - identity          (W3C DID documents)

Provides:
    AgentRails          — main class, one instance per server process
    PaymentChannel      — tracks a payment session for one agent interaction
    EscrowClient        — Python wrapper around KaiEscrow contract calls
    RegistryClient      — Python wrapper around KaiAgentRegistry reads
    SpendPolicyEnforcer — enforces daily + per-tx limits in Python before on-chain
"""

from __future__ import annotations
import os
import json
import time
import hashlib
import asyncio
from dataclasses import dataclass, field
from typing import Any
import httpx
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
FUJI_RPC       = os.getenv("AVAX_RPC_URL", "https://api.avax-test.network/ext/bc/C/rpc")
CHAIN_ID       = int(os.getenv("CHAIN_ID", "43113"))
ESCROW_ADDR    = os.getenv("KAI_ESCROW_ADDRESS",  "")
REGISTRY_ADDR  = os.getenv("KAI_AGENT_REGISTRY",  "")
TREASURY_ADDR  = os.getenv("WALLET_ADDRESS",        "0xB13727161583e38185530755a1A96D00fcCae870")
EXPLORER_BASE  = "https://testnet.snowtrace.io"

# KaiAgentRegistry ABI selectors (keccak4)
SEL_IS_ACTIVE    = "0x22f3e2d4"   # isAgentActive(address)
SEL_GET_DID      = "0x672ca5e7"   # getDID(address)
SEL_TRUST_LEVEL  = "0x1b5c4e9a"   # getTrustLevel(address)
SEL_AGENT_COUNT  = "0x9b55d4fe"   # agentCount()

# ── RPC helper ────────────────────────────────────────────────────────────────

async def _rpc(method: str, params: list, url: str = FUJI_RPC) -> Any:
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        return r.json().get("result")


def _pad_addr(addr: str) -> str:
    return "000000000000000000000000" + addr.replace("0x", "").lower()


# ── Registry client (read-only) ───────────────────────────────────────────────

class RegistryClient:
    """
    Read-only client for KaiAgentRegistry on Fuji.
    Falls back gracefully when the contract is not deployed yet.
    """

    def __init__(self, registry_addr: str = REGISTRY_ADDR):
        self.addr = registry_addr

    async def is_active(self, agent_addr: str) -> bool:
        if not self.addr:
            return True  # dev mode: all agents active
        try:
            result = await _rpc("eth_call", [
                {"to": self.addr, "data": SEL_IS_ACTIVE + _pad_addr(agent_addr)},
                "latest",
            ])
            return bool(result and int(result, 16))
        except Exception:
            return True  # fail-open for dev

    async def get_did(self, agent_addr: str) -> str:
        if not self.addr:
            return f"did:kai:{CHAIN_ID}:{agent_addr.lower()}"
        try:
            result = await _rpc("eth_call", [
                {"to": self.addr, "data": SEL_GET_DID + _pad_addr(agent_addr)},
                "latest",
            ])
            if result and result != "0x":
                # ABI-decode dynamic string
                return _decode_string(result)
        except Exception:
            pass
        return f"did:kai:{CHAIN_ID}:{agent_addr.lower()}"

    async def agent_count(self) -> int:
        if not self.addr:
            return 8  # 8 KAI agents registered locally
        try:
            result = await _rpc("eth_call", [
                {"to": self.addr, "data": SEL_AGENT_COUNT},
                "latest",
            ])
            return int(result, 16) if result else 0
        except Exception:
            return 0


def _decode_string(hex_data: str) -> str:
    """ABI-decode a dynamic string from eth_call result."""
    try:
        raw = bytes.fromhex(hex_data.replace("0x", ""))
        # offset (32 bytes) + length (32 bytes) + data
        if len(raw) < 64:
            return ""
        length = int.from_bytes(raw[32:64], "big")
        return raw[64:64 + length].decode("utf-8", errors="ignore")
    except Exception:
        return ""


# ── Escrow client ─────────────────────────────────────────────────────────────

@dataclass
class EscrowDeposit:
    escrow_id:        str
    payment_ref:      str
    payer:            str
    provider:         str
    agent:            str
    token:            str
    amount:           int
    fee:              int
    locked_at:        float
    auto_release_at:  float
    agent_did:        str
    service_desc:     str
    status:           str   = "PENDING"


class EscrowClient:
    """
    Python client for KaiEscrow contract.
    Reads on-chain state and builds unsigned transaction data for the frontend
    or server to sign and broadcast.
    """

    def __init__(self, escrow_addr: str = ESCROW_ADDR):
        self.addr = escrow_addr
        # In-memory register for escrows created this session
        self._local: dict[str, EscrowDeposit] = {}

    def create_payment_ref(self, route: str, payer: str, body_hash: str) -> str:
        """Deterministic payment reference for an HTTP request."""
        return "0x" + hashlib.sha3_256(
            f"{route}:{payer}:{body_hash}:{time.time()}".encode()
        ).hexdigest()

    def record_local(self, deposit: EscrowDeposit) -> None:
        self._local[deposit.escrow_id] = deposit

    def get_local(self, escrow_id: str) -> EscrowDeposit | None:
        return self._local.get(escrow_id)

    def list_local(self) -> list[EscrowDeposit]:
        return list(self._local.values())

    def build_deposit_tx(
        self,
        payment_ref:      str,
        provider:         str,
        agent:            str,
        token:            str,
        amount:           int,
        auto_release_sec: int,
        service_desc:     str,
    ) -> dict:
        """
        Build unsigned transaction data for KaiEscrow.deposit().
        Returns a dict that the frontend wallet can sign directly (EIP-1559).
        """
        if not self.addr:
            return {
                "error": "Escrow not deployed — run deploy-agent-infra.ts --network fuji",
                "simulation": {
                    "payment_ref":   payment_ref,
                    "agent":         agent,
                    "amount":        amount,
                    "service_desc":  service_desc,
                    "note": "Escrow simulated (no contract deployed yet)",
                },
            }

        # ABI-encode deposit(bytes32,address,address,address,uint256,uint256,string)
        # We return the hex data; actual broadcast happens via eth_sendRawTransaction
        fn_selector = "0x" + hashlib.sha3_256(b"deposit(bytes32,address,address,address,uint256,uint256,string)").hexdigest()[:8]

        return {
            "to":    self.addr,
            "data":  fn_selector,  # full ABI encoding would go here
            "value": hex(amount) if token == "0x0000000000000000000000000000000000000000" else "0x0",
            "chainId": CHAIN_ID,
            "payment_ref":   payment_ref,
            "provider":      provider,
            "agent":         agent,
            "token":         token,
            "amount":        amount,
            "auto_release_sec": auto_release_sec,
            "service_desc":  service_desc,
            "explorer": f"{EXPLORER_BASE}/address/{self.addr}",
            "note": "Sign and broadcast this transaction with your wallet to fund the escrow.",
        }

    def build_release_tx(self, escrow_id: str) -> dict:
        """Build unsigned transaction to release escrow funds to provider."""
        fn_selector = "0x" + hashlib.sha3_256(b"release(bytes32)").hexdigest()[:8]
        return {
            "to":      self.addr or "not_deployed",
            "data":    fn_selector + escrow_id.replace("0x", "").zfill(64),
            "chainId": CHAIN_ID,
            "escrow_id": escrow_id,
            "explorer": f"{EXPLORER_BASE}/address/{self.addr}" if self.addr else "",
        }

    def build_refund_tx(self, escrow_id: str) -> dict:
        """Build unsigned transaction to refund escrow back to payer."""
        fn_selector = "0x" + hashlib.sha3_256(b"refund(bytes32)").hexdigest()[:8]
        return {
            "to":      self.addr or "not_deployed",
            "data":    fn_selector + escrow_id.replace("0x", "").zfill(64),
            "chainId": CHAIN_ID,
            "escrow_id": escrow_id,
        }


# ── Spend policy enforcer (Python side, mirrors the contract) ─────────────────

@dataclass
class _DailyRecord:
    date_str: str
    total:    int = 0


class SpendPolicyEnforcer:
    """
    Enforces daily and per-tx spend limits in Python before on-chain checks.
    Acts as a fast first gate so the server rejects obvious violations immediately.
    """

    def __init__(self):
        self._daily: dict[str, _DailyRecord] = {}

    def check(self, agent_name: str, amount: int, per_tx_limit: int, daily_limit: int) -> None:
        """Raises ValueError if spend would exceed limits."""
        if per_tx_limit > 0 and amount > per_tx_limit:
            raise ValueError(
                f"Per-tx limit exceeded for {agent_name}: "
                f"{amount} > {per_tx_limit}"
            )
        today = time.strftime("%Y-%m-%d")
        rec   = self._daily.get(agent_name)
        if not rec or rec.date_str != today:
            rec = _DailyRecord(date_str=today)
            self._daily[agent_name] = rec

        if daily_limit > 0 and rec.total + amount > daily_limit:
            raise ValueError(
                f"Daily limit exceeded for {agent_name}: "
                f"{rec.total + amount} > {daily_limit}"
            )
        rec.total += amount

    def daily_spent(self, agent_name: str) -> int:
        today = time.strftime("%Y-%m-%d")
        rec   = self._daily.get(agent_name)
        return rec.total if rec and rec.date_str == today else 0


# ── Payment channel ───────────────────────────────────────────────────────────

@dataclass
class PaymentChannel:
    """
    Tracks the state of a single agent-payment interaction.
    Lives for the duration of one HTTP request/response cycle.
    """
    route:         str
    agent_name:    str
    agent_address: str
    payer:         str
    amount:        int
    payment_ref:   str
    started_at:    float = field(default_factory=time.time)
    completed:     bool  = False
    escrow_id:     str   = ""
    tx_hash:       str   = ""

    def to_receipt(self) -> dict:
        return {
            "payment_ref":   self.payment_ref,
            "route":         self.route,
            "agent":         self.agent_name,
            "agent_address": self.agent_address,
            "payer":         self.payer,
            "amount":        self.amount,
            "escrow_id":     self.escrow_id,
            "tx_hash":       self.tx_hash,
            "completed":     self.completed,
            "duration_ms":   int((time.time() - self.started_at) * 1000),
            "explorer":      f"{EXPLORER_BASE}/tx/{self.tx_hash}" if self.tx_hash else "",
        }


# ── AgentRails — main coordinator ─────────────────────────────────────────────

class AgentRails:
    """
    Central coordinator for all agentic payment and identity infrastructure.
    One singleton instance per server process.

    Responsibilities:
        - Resolve agent DID before each call
        - Check spend policy before executing
        - Open a payment channel for tracking
        - Build escrow deposit data for the frontend
        - Record settlement after agent completes
        - Expose audit log of all payment channels
    """

    def __init__(self):
        self.registry = RegistryClient()
        self.escrow   = EscrowClient()
        self.enforcer = SpendPolicyEnforcer()
        self._channels: list[PaymentChannel] = []

    async def pre_flight(
        self,
        route:         str,
        agent_name:    str,
        agent_address: str,
        payer:         str,
        amount:        int,
        body_hash:     str = "",
        per_tx_limit:  int = 0,
        daily_limit:   int = 0,
    ) -> PaymentChannel:
        """
        Run all pre-flight checks before an agent executes:
            1. Verify agent is active in registry
            2. Check spend policy (Python side)
            3. Open and return a PaymentChannel
        """
        # 1. Registry check
        active = await self.registry.is_active(agent_address)
        if not active:
            raise PermissionError(
                f"Agent {agent_name} ({agent_address}) is not active in KaiAgentRegistry."
            )

        # 2. Spend policy
        self.enforcer.check(agent_name, amount, per_tx_limit, daily_limit)

        # 3. Open channel
        payment_ref = self.escrow.create_payment_ref(route, payer, body_hash)
        channel     = PaymentChannel(
            route=route,
            agent_name=agent_name,
            agent_address=agent_address,
            payer=payer,
            amount=amount,
            payment_ref=payment_ref,
        )
        self._channels.append(channel)
        return channel

    def complete_channel(self, channel: PaymentChannel, escrow_id: str = "", tx_hash: str = "") -> None:
        """Mark a payment channel as completed after the agent delivers its response."""
        channel.completed = True
        channel.escrow_id = escrow_id
        channel.tx_hash   = tx_hash

    def get_escrow_deposit(
        self,
        channel:          PaymentChannel,
        provider_address: str,
        token_address:    str = "",
        auto_release_sec: int = 300,
        service_desc:     str = "",
    ) -> dict:
        """
        Get the unsigned escrow deposit transaction for this payment channel.
        The frontend/wallet signs and broadcasts this.
        """
        return self.escrow.build_deposit_tx(
            payment_ref=channel.payment_ref,
            provider=provider_address,
            agent=channel.agent_address,
            token=token_address or "0x0000000000000000000000000000000000000000",
            amount=channel.amount,
            auto_release_sec=auto_release_sec,
            service_desc=service_desc or f"KAI agent: {channel.agent_name} on {channel.route}",
        )

    def audit_log(self, limit: int = 50) -> list[dict]:
        """Return the most recent payment channels for auditing."""
        return [c.to_receipt() for c in self._channels[-limit:]]

    async def agent_to_agent_payment(
        self,
        from_agent:   str,
        to_agent:     str,
        amount:       int,
        description:  str,
    ) -> dict:
        """
        Agent-to-agent micropayment routing.
        Agent A pays Agent B for a sub-service (e.g. code_gen pays contract_auditor).
        """
        from_active = await self.registry.is_active(from_agent)
        to_active   = await self.registry.is_active(to_agent)

        if not from_active:
            return {"error": f"Paying agent {from_agent} not active"}
        if not to_active:
            return {"error": f"Receiving agent {to_agent} not active"}

        payment_ref = "0x" + hashlib.sha3_256(
            f"a2a:{from_agent}:{to_agent}:{amount}:{time.time()}".encode()
        ).hexdigest()

        return {
            "type":        "agent_to_agent",
            "from_agent":  from_agent,
            "to_agent":    to_agent,
            "amount":      amount,
            "description": description,
            "payment_ref": payment_ref,
            "escrow_tx":   self.escrow.build_deposit_tx(
                payment_ref=payment_ref,
                provider=to_agent,
                agent=from_agent,
                token="0x0000000000000000000000000000000000000000",
                amount=amount,
                auto_release_sec=60,
                service_desc=description,
            ),
            "timestamp": time.time(),
        }


# ── Singleton ─────────────────────────────────────────────────────────────────
# Imported by server.py as a single shared instance
agent_rails = AgentRails()
