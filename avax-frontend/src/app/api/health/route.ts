import { NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:1.7b';
const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

export async function GET() {
  const status = {
    ragServer: 'offline',
    ollamaServer: 'offline',
    modelLoaded: false,
    modelName: OLLAMA_MODEL,
    details: ''
  };

  // 1. Check Python FastAPI RAG Server Health
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const ragRes = await fetch(`${RAG_API_URL}/health`, { 
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);

    if (ragRes.ok) {
      const data = await ragRes.json();
      status.ragServer = 'online';
      if (data.model) {
        status.modelName = data.model;
      }
    } else {
      status.details += `FastAPI health returned status ${ragRes.status}. `;
    }
  } catch (e: any) {
    status.details += `FastAPI offline: ${e.message || e}. `;
  }

  // 2. Check Ollama Server Health
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/tags`, { 
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    if (ollamaRes.ok) {
      status.ollamaServer = 'online';
      const data = await ollamaRes.json();
      const models = data.models || [];
      const hasModel = models.some((m: any) => 
        m.name.includes(OLLAMA_MODEL) || 
        OLLAMA_MODEL.includes(m.name)
      );
      status.modelLoaded = hasModel;
    } else {
      status.details += `Ollama tags returned status ${ollamaRes.status}. `;
    }
  } catch (e: any) {
    status.details += `Ollama offline: ${e.message || e}. `;
  }

  return NextResponse.json(status);
}
