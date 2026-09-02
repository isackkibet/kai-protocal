# KAI Local RAG Agent

This service embeds the HTML pages in the workspace `kaiweb` folder with Ollama's
`nomic-embed-text` model and answers questions with `qwen3:1.7b`.

## Run locally

Start Ollama first, then run the API:

```powershell
cd ai-agent
.\.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8000
```

The Next.js app expects the API at `http://localhost:8000`.

## Rebuild website embeddings

Run this after adding or changing files in `kaiweb`:

```powershell
cd ai-agent
$env:REBUILD_INDEX="true"
.\.venv\Scripts\python.exe -c "import vector"
Remove-Item Env:REBUILD_INDEX
```

The index is built from the HTML files in `../kaiweb`; it is not built from the
restaurant CSV or the old restaurant prompt.