"""
Agent 8: Document Summarizer & Q&A
Loads PDF, TXT, or Markdown documents into a dedicated ChromaDB collection,
then answers questions using RAG (retrieval-augmented generation).
All local — Ollama embeddings + ChromaDB + Ollama LLM.
"""

from __future__ import annotations
import os
import shutil
from pathlib import Path
from typing import AsyncIterator
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from .base import AgentBase, OLLAMA_URL

DOCS_DB_PATH   = os.path.join(os.path.dirname(__file__), "..", "chrome_langchain_db_docs")
EMBED_MODEL    = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
DOCS_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

SYSTEM = """You are a document analyst assistant. You answer questions based ONLY on the
provided document context. If the answer is not in the documents, say so clearly.

Format your responses with:
- A direct answer to the question
- The source document(s) you found this in
- A confidence level (High / Medium / Low)

Quote relevant excerpts when helpful."""


def _get_embeddings():
    return OllamaEmbeddings(
        model=EMBED_MODEL,
        base_url=OLLAMA_URL,
        client_kwargs={"timeout": 300.0},
    )


def _get_vector_store(collection: str = "kai_docs_uploaded") -> Chroma:
    return Chroma(
        collection_name=collection,
        persist_directory=DOCS_DB_PATH,
        embedding_function=_get_embeddings(),
    )


def _split_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Simple character-based chunker."""
    chunks = []
    start  = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start = end - overlap
    return [c for c in chunks if c.strip()]


def _load_txt(path: str) -> str:
    return Path(path).read_text(encoding="utf-8", errors="ignore")


def _load_pdf(path: str) -> str:
    """Extract text from PDF using pypdf (optional dependency)."""
    try:
        import pypdf
        reader = pypdf.PdfReader(path)
        return "\n".join(p.extract_text() or "" for p in reader.pages)
    except ImportError:
        return f"[PDF loading requires pypdf: pip install pypdf]\nFile: {path}"


def _load_document(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext == ".pdf":
        return _load_pdf(path)
    return _load_txt(path)  # txt, md, sol, json, csv all work


class DocSummarizerAgent(AgentBase):
    name = "doc_summarizer"
    description = "Loads documents into ChromaDB and answers questions via RAG"

    def ingest(self, file_path: str, collection: str = "kai_docs_uploaded") -> dict:
        """
        Synchronous ingest — load a document into the vector store.
        Returns ingestion summary.
        """
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}

        text     = _load_document(file_path)
        filename = Path(file_path).name
        chunks   = _split_text(text)

        docs = [
            Document(
                page_content=chunk,
                metadata={"source": filename, "chunk_id": i, "path": file_path},
            )
            for i, chunk in enumerate(chunks)
        ]

        ids   = [f"{filename}_chunk_{i}" for i in range(len(docs))]
        store = _get_vector_store(collection)
        store.add_documents(documents=docs, ids=ids)

        return {
            "file":       filename,
            "chars":      len(text),
            "chunks":     len(chunks),
            "collection": collection,
        }

    def list_documents(self, collection: str = "kai_docs_uploaded") -> list[str]:
        """List all unique source documents in the collection."""
        try:
            store  = _get_vector_store(collection)
            result = store.get()
            sources = list({m.get("source", "unknown") for m in result.get("metadatas", [])})
            return sorted(sources)
        except Exception:
            return []

    def delete_collection(self, collection: str = "kai_docs_uploaded") -> dict:
        """Wipe a collection from the vector store."""
        try:
            store = _get_vector_store(collection)
            store.delete_collection()
            return {"deleted": collection}
        except Exception as e:
            return {"error": str(e)}

    async def run(
        self,
        question: str,
        collection: str = "kai_docs_uploaded",
        k: int = 5,
    ) -> dict:
        store     = _get_vector_store(collection)
        retriever = store.as_retriever(search_kwargs={"k": k})
        docs      = retriever.invoke(question)

        if not docs:
            return {
                "agent":   self.name,
                "question": question,
                "answer":  "No relevant documents found. Please ingest documents first using the /agents/docs/ingest endpoint.",
                "sources": [],
            }

        context = "\n\n".join(
            f"[{d.metadata.get('source', 'unknown')} chunk {d.metadata.get('chunk_id', '?')}]:\n{d.page_content}"
            for d in docs
        )
        prompt = f"Context from documents:\n\n{context}\n\nQuestion: {question}\n\nAnswer based only on the above context."
        answer = await self.complete(prompt, system=SYSTEM)

        return {
            "agent":    self.name,
            "question": question,
            "answer":   answer,
            "sources":  [d.metadata.get("source", "unknown") for d in docs],
            "chunks_used": len(docs),
        }

    async def stream(
        self,
        question: str,
        collection: str = "kai_docs_uploaded",
        k: int = 5,
    ) -> AsyncIterator[str]:
        import json
        store     = _get_vector_store(collection)
        retriever = store.as_retriever(search_kwargs={"k": k})
        docs      = retriever.invoke(question)

        if not docs:
            yield f'data: {json.dumps({"token": "No relevant documents found. Please ingest documents first."})}\n\n'
            yield 'data: {"done": true}\n\n'
            return

        context = "\n\n".join(
            f"[{d.metadata.get('source', 'unknown')}]:\n{d.page_content}"
            for d in docs
        )
        sources = list({d.metadata.get("source", "unknown") for d in docs})
        yield f'data: {json.dumps({"token": f"📚 Found {len(docs)} relevant chunks from: {', '.join(sources)}\\n\\n"})}\n\n'

        prompt = f"Context:\n\n{context}\n\nQuestion: {question}\n\nAnswer:"
        async for chunk in self.stream_response(prompt, system=SYSTEM):
            yield chunk
