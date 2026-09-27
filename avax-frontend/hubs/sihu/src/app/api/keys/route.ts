import { NextRequest, NextResponse } from "next/server";
import { readPublicAIConfig, writeAIConfig } from "@/lib/ai/config-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { openai, gemini, anthropic, activeProvider, models } = body as {
      openai?: string;
      gemini?: string;
      anthropic?: string;
      activeProvider?: "openai" | "gemini" | "anthropic";
      models?: {
        openai?: string;
        gemini?: string;
        anthropic?: string;
      };
    };

    const config = await writeAIConfig({
      activeProvider,
      models,
      keys: {
        openai: openai || undefined,
        gemini: gemini || undefined,
        anthropic: anthropic || undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "AI gateway settings saved.",
        activeProvider: config.activeProvider,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(await readPublicAIConfig());
}
