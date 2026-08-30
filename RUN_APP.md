# Run App

Open separate PowerShell terminals for the services below.

## 1. Start Ollama and the local model

```powershell
ollama serve
```

In another terminal, download the models once and start the chat model:

```powershell
ollama pull qwen3:0.6b
ollama pull nomic-embed-text
ollama run qwen3:0.6b
```

Keep Ollama running at `http://localhost:11434`.

## 2. Start the FastAPI RAG agent

From the project root:

```powershell
cd .\ai-agent
if (-not (Test-Path .\.venv)) { py -m venv .venv }
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

Check the API:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

The API endpoints are:

- `GET http://127.0.0.1:8000/health`
- `POST http://127.0.0.1:8000/chat`
- `POST http://127.0.0.1:8000/stream`

## 3. Start the Next.js frontend

From the project root:

```powershell
npm --prefix .\avax-frontend install
npm --prefix .\avax-frontend run dev
```

Open `http://localhost:3000` in your browser.

## Optional: run the terminal agent directly

This runs the interactive RAG agent instead of the HTTP API:

```powershell
cd .\ai-agent
.\.venv\Scripts\python.exe .\main.py
```

Type `q` to exit.