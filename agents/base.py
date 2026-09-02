"""
agents/base.py
Shared utilities for all KAI local agents.
Ollama is optional — all agents degrade gracefully when it is offline.
"""

from __future__ import annotations
import os
import json
import asyncio
from typing import AsyncIterator, Any
import httpx
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL   = os.getenv("OLLAMA_BASE_URL",  "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_LLM_MODEL", "qwen3:0.6b")
TIMEOUT      = 600.0

# Friendly message returned when Ollama is unreachable
_OFFLINE_MSG = (
    "The local AI model (Ollama) is currently offline. "
    "Start it with: ollama serve\n"
    "All other agent features continue to work without it."
)


# ─── Availability probe ───────────────────────────────────────────────────────

async def ollama_available() -> bool:
    """Return True if Ollama is reachable, False otherwise."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


# ─── Low-level helpers ────────────────────────────────────────────────────────

async def ollama_complete(
    prompt: str,
    system: str = "",
    model: str = OLLAMA_MODEL,
) -> str:
    """
    Single blocking-style completion via Ollama.
    Returns a graceful fallback string when Ollama is offline or errors.
    """
    messages: list[dict] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model":    model,
        "messages": messages,
        "stream":   False,
        "options":  {"num_predict": 2048, "temperature": 0.3},
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"].strip()
    except httpx.ConnectError:
        return _OFFLINE_MSG
    except httpx.TimeoutException:
        return "The AI model timed out. Try a shorter prompt or restart Ollama."
    except httpx.HTTPStatusError as e:
        return f"Ollama returned an error ({e.response.status_code}). Check that the model is loaded."
    except Exception as e:
        return f"AI model unavailable: {e}"


async def ollama_stream(
    prompt: str,
    system: str = "",
    model: str = OLLAMA_MODEL,
) -> AsyncIterator[str]:
    """
    Stream tokens from Ollama as SSE lines.
    Yields a single error SSE event when Ollama is offline.
    """
    messages: list[dict] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model":    model,
        "messages": messages,
        "stream":   True,
        "options":  {"num_predict": 2048, "temperature": 0.3},
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            async with client.stream(
                "POST", f"{OLLAMA_URL}/api/chat", json=payload
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    if chunk.get("done"):
                        yield f"data: {json.dumps({'done': True})}\n\n"
                        return

    except httpx.ConnectError:
        yield f"data: {json.dumps({'token': _OFFLINE_MSG})}\n\n"
        yield f"data: {json.dumps({'done': True, 'error': 'ollama_offline'})}\n\n"
    except httpx.TimeoutException:
        msg = "AI model timed out. Restart Ollama and try again."
        yield f"data: {json.dumps({'token': msg})}\n\n"
        yield f"data: {json.dumps({'done': True, 'error': 'timeout'})}\n\n"
    except Exception as e:
        msg = f"AI model unavailable: {e}"
        yield f"data: {json.dumps({'token': msg})}\n\n"
        yield f"data: {json.dumps({'done': True, 'error': str(e)})}\n\n"


# ─── Base class ───────────────────────────────────────────────────────────────

class AgentBase:
    """
    Base class for all KAI agents.

    Ollama is used when available; all agents return structured results
    even when the model is offline. Subclasses implement:
        async def run(self, **kwargs) -> dict
        async def stream(self, **kwargs) -> AsyncIterator[str]
    """

    name:        str = "base"
    description: str = ""

    def __init__(self, model: str = OLLAMA_MODEL):
        self.model = model

    # ── Convenience wrappers ──────────────────────────────────────────────────

    async def complete(self, prompt: str, system: str = "") -> str:
        """Complete a prompt. Returns offline message if Ollama is down."""
        return await ollama_complete(prompt, system=system, model=self.model)

    async def stream_response(
        self, prompt: str, system: str = ""
    ) -> AsyncIterator[str]:
        """Stream a completion. Yields offline SSE event if Ollama is down."""
        async for chunk in ollama_stream(prompt, system=system, model=self.model):
            yield chunk

    async def is_model_available(self) -> bool:
        """Quick check — use this to decide whether to include AI output."""
        return await ollama_available()

    # ── Abstract interface ────────────────────────────────────────────────────

    async def run(self, **kwargs) -> dict:
        raise NotImplementedError

    async def stream(self, **kwargs) -> AsyncIterator[str]:
        raise NotImplementedError
