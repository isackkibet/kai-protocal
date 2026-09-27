# SIHU Agent PRD

## 1. Product Overview
SIHU Agent is a lightweight semantic assistant for SIHU Hub. It provides a chat-based user experience backed by a Next.js server-side agent runtime and a Supabase knowledge base. The system is designed to answer questions, retrieve stored knowledge, and support future tool execution without depending on external LLM APIs.

The MVP uses retrieval-first reasoning:
- detect intent
- retrieve relevant knowledge
- retrieve recent session memory
- generate a structured answer using deterministic templates

This makes the system cheap to run, controllable, and easy to extend later with optional LLM fallback if needed.

## 2. Problem Statement
Users need a simple assistant that can answer domain questions, search stored knowledge, and maintain continuity across a conversation. Existing LLM-heavy assistants are expensive, less predictable, and harder to control for a focused product at early stage.

SIHU Agent solves this by combining:
- a simple chat UI
- semantic retrieval over stored knowledge
- rule-based reasoning and response assembly
- session memory for continuity

## 3. Goals
- Provide an assistant-like chat experience without LLM dependency.
- Support semantic search over a Supabase-backed knowledge base.
- Return clear, structured, expert-style answers.
- Store chat history by session for continuity.
- Keep the architecture modular for future agent tools and integrations.

## 4. Non-Goals (MVP)
- No multimodal input such as voice or image understanding.
- No advanced generative reasoning model.
- No blockchain or IPFS execution yet.
- No complex workflow automation.
- No highly polished design system beyond a usable chat interface.

## 5. Users
### Primary users
- End users asking questions through the SIHU chat interface
- Internal operators adding knowledge into the system

### User needs
- Ask a question and get a fast answer
- Search stored knowledge semantically
- Continue a conversation across multiple turns
- Receive factual, structured responses

## 6. Product Scope
### In scope
- Next.js chat interface
- Next.js server-side agent routes
- Supabase knowledge store
- Embedding-based semantic retrieval
- Rule-based intent detection
- Session memory retrieval
- Deterministic response builder

### Out of scope
- Autonomous tool execution
- Fine-tuned models
- Streaming token generation
- Role-based admin UI beyond basic API support

## 7. System Architecture
```text
Next.js Frontend
    ->
Next.js Route Handlers
    ->
SIHU Agent Core
    |- Intent Detector
    |- Knowledge Retriever
    |- Memory Retriever
    |- Response Builder
    \- Tool Router (future)
    ->
Supabase
    |- knowledge_base
    \- chat_history
```

## 8. Core Experience
### 8.1 Chat flow
1. User opens the chat UI.
2. User sends a message.
3. Frontend posts the message and `session_id` to the backend.
4. Backend detects intent.
5. Backend retrieves relevant knowledge and recent chat history.
6. Backend builds a response using deterministic templates.
7. Backend stores the exchange in `chat_history`.
8. Frontend renders the response.

### 8.2 Knowledge ingestion flow
1. Operator submits new content to `/add-knowledge`.
2. Backend generates an embedding for the content.
3. Backend stores content and embedding in `knowledge_base`.
4. Content becomes available for retrieval.

## 9. Functional Requirements
### 9.1 Frontend
- Provide a simple responsive chat UI built with Next.js.
- Allow message input and response display.
- Persist or reuse a `session_id` per user session.
- Show loading state while waiting for backend response.
- Be lightweight and mobile-friendly.

### 9.2 Backend API
- `POST /chat`
  - accepts `session_id` and `message`
  - returns answer, matched intent, and optional retrieved sources
- `POST /add-knowledge`
  - accepts content and metadata
  - stores embedding + knowledge record
- `GET /history/{session_id}`
  - returns recent chat messages for the session

### 9.3 Intent detection
- Use hybrid intent detection:
  - keyword/rule matching first
  - semantic similarity fallback second
- Initial intent classes:
  - `knowledge_query`
  - `semantic_search`
  - `general_chat`
  - `unknown`

### 9.4 Knowledge retrieval
- Always retrieve relevant knowledge before composing an answer.
- Use vector similarity search with top-k results.
- Prefer knowledge base results over conversational memory for factual answers.
- Return a fallback response if no relevant knowledge exists.

### 9.5 Memory
- Store each user/assistant exchange in `chat_history`.
- Retrieve the latest N conversation turns for context.
- Isolate sessions using `session_id`.

### 9.6 Response engine
- No external LLM API allowed in MVP.
- Build responses using:
  - retrieved knowledge
  - matched intent
  - deterministic templates
  - optional memory context
- Output must be:
  - short
  - factual
  - structured
  - expert in tone

## 10. Data Model
### 10.1 `knowledge_base`
- `id`
- `content`
- `embedding`
- `type`
- `source` optional
- `created_at`

### 10.2 `chat_history`
- `id`
- `session_id`
- `user_message`
- `bot_response`
- `intent`
- `timestamp`

## 11. Technical Stack
### Frontend
- Next.js
- React
- simple CSS or Tailwind-based UI

### Backend
- Next.js route handlers
- TypeScript server utilities
- optional provider APIs for boosted responses

### Database
- Supabase Postgres
- pgvector / vector similarity search

## 12. Reasoning Rules
The backend must follow this order:
1. classify intent
2. fetch relevant knowledge
3. fetch recent memory
4. build answer from templates
5. store conversation

Fallback rule:
- if relevant knowledge is not found, respond with:
  - a clear limitation statement
  - a suggestion to add knowledge

## 13. UX Principles
- Minimal and fast
- Mobile-first layout
- Very low UI complexity
- Clear message hierarchy
- No unnecessary visual noise

## 14. Success Metrics
- Time to first response under 2 seconds for normal queries
- Knowledge retrieval returns relevant context for top user questions
- Chat history is stored reliably by session
- User can complete a basic question-answer flow without assistance

## 15. Risks and Constraints
- Without an LLM, responses may feel rigid.
- Retrieval quality depends on embedding quality and stored content quality.
- Poor chunking or metadata design can reduce answer relevance.
- Session-only memory may limit long-term personalization.

## 16. Future Extensions
- Optional LLM fallback for harder reasoning
- Tool router activation
- API integrations
- blockchain and IPFS actions
- richer admin knowledge management
- offline embedding or local inference options

## 17. MVP Delivery Checklist
- [ ] Next.js chat interface
- [ ] Next.js route endpoints implemented
- [ ] Supabase schema created
- [ ] vector search enabled
- [ ] embedding generation wired
- [ ] chat history persistence working
- [ ] deterministic response templates implemented
- [ ] local and production environment configuration documented
