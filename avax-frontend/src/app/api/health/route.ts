import { NextResponse } from 'next/server';

const NEEDLE_API_URL = process.env.NEEDLE_API_URL || process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function GET() {
  const status = {
    needleServer: 'offline',
    ragServer: 'offline',
    modelLoaded: false,
    modelName: 'Cactus Compute Needle (14 MB)',
    details: ''
  };

  // 1. Check Python FastAPI Needle / RAG Server Health
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    
    const res = await fetch(`${NEEDLE_API_URL}/health`, { 
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      status.needleServer = data.needle_ready ? 'online' : 'ready';
      status.ragServer = data.rag_ready ? 'online' : 'ready';
      status.modelLoaded = true;
      status.details = 'Needle engine active on FastAPI.';
    } else {
      status.details += `FastAPI health returned status ${res.status}. `;
    }
  } catch (e: any) {
    status.details += `FastAPI offline: ${e.message || e}. `;
  }

  return NextResponse.json(status);
}
