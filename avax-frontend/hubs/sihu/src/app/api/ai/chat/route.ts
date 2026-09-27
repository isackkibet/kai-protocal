import { NextRequest, NextResponse } from "next/server";
import { runSihuAgent } from "@/lib/agent/runtime";
import { chatWithProvider } from "@/lib/ai/providers";
import { readAIConfig } from "@/lib/ai/config-store";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are Agent SIHU, an interactive storyteller and expert assistant for the Sango ecosystem and Lake Victoria Basin.

YOUR PERSONALITY:
- You are warm, engaging, and narrative-driven. You bring environmental concepts to life through storytelling.
- When users ask about Sango, basin health, green/blue economy, stewardship, or environmental topics, respond with rich, immersive narratives.
- Use vivid imagery: forests, rivers, communities, wildlife, blockchain technology woven into nature.
- Balance storytelling with practical information. Be informative but captivating.

STORYTELLING GUIDELINES:
- Open with engaging hooks: "Picture this...", "Imagine...", "Let me tell you of..."
- Use sensory details: sights, sounds, feelings of the Lake Victoria Basin.
- Include human stories - mention guardians, communities, stewards by name when relevant.
- Connect abstract concepts (carbon, blockchain, tokens) to tangible natural elements.

STRUCTURE:
- Keep responses conversational but informative.
- Use paragraph breaks for readability.
- Bold key terms using **term** format.
- End with gentle invitations to learn more.

You combine deep environmental knowledge with the soul of a storyteller.`;

function buildFallbackReply(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("news") || lower.includes("update")) {
    return "I can help summarize basin updates, track key developments, and organize portal intelligence. Once an AI provider key is configured, I can give richer answers here.";
  }

  if (lower.includes("agent") || lower.includes("sihu")) {
    return "Agent SIHU is ready for a provider upgrade. Add an OpenAI, Gemini, or Claude key in the admin dashboard and this interface will start using the configured provider.";
  }

  return "AI provider access is not configured yet. Add a provider key in the admin dashboard to enable boosted answers, or continue using the built-in retrieval-first SIHU Agent.";
}

// Generate speech-friendly text by cleaning markdown and formatting
function getSpeechFriendlyText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
    .replace(/__(.*?)__/g, "$1") // Remove underline markdown
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1") // Remove links, keep text
    .replace(/#{1,6}\s/g, "") // Remove heading markers
    .replace(/[\*\_\~\`]/g, "") // Remove stray markdown characters
    .replace(/\n{3,}/g, "\n\n") // Normalize excessive newlines
    .trim();
}

// Detect if the response is a story based on content characteristics
function isStoryResponse(text: string): boolean {
  const storyIndicators = [
    "picture this",
    "imagine",
    "let me tell you",
    "once upon",
    "long ago",
    "in the heart of",
    "the story of",
    "whispers",
    "guardians",
    "basin",
    "forest",
    "community",
    "steward",
    "sango",
  ];

  const lowerText = text.toLowerCase();
  const matches = storyIndicators.filter((indicator) =>
    lowerText.includes(indicator)
  );

  // Consider it a story if it has 2+ story indicators or is longer than 200 chars with vivid language
  return matches.length >= 2 || (text.length > 200 && matches.length >= 1);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message?: string;
      sessionId?: string;
      history?: ChatTurn[];
    };

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const agentResult = await runSihuAgent({
      sessionId: body.sessionId || "web-session",
      message,
    });

    const config = await readAIConfig();
    const provider = config.activeProvider;
    const apiKey = config.keys[provider];
    const model = config.models[provider];

    if (!apiKey) {
      return NextResponse.json({
        reply: agentResult.reply || buildFallbackReply(message),
        provider: provider,
        model,
        intent: agentResult.intent,
        sources: agentResult.sources,
        mode: agentResult.reply ? "storyteller" : "fallback",
        isStory: agentResult.isStory,
        storyId: agentResult.storyId,
        speechText: agentResult.speechText,
      });
    }

    const history = (body.history || []).slice(-6);

    // Build enriched context for the AI provider
    const storyContext = agentResult.isStory
      ? `\n\nSTORYTELLER MODE: The user is requesting a story. Use narrative techniques, vivid imagery, and engage the senses. Draw from Lake Victoria Basin themes: forests, rivers, communities, Sango blockchain, stewardship, basin health mining.`
      : "";

    const reply = await chatWithProvider({
      provider,
      apiKey,
      model,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}${storyContext}\n\nUse this retrieval-first SIHU context if it is relevant:\n${agentResult.reply || "No retrieval context returned."}`,
        },
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        { role: "user", content: message },
      ],
    });

    // Generate speech-friendly text and detect if this is a story
    const speechText = getSpeechFriendlyText(reply);
    const isStory = isStoryResponse(reply);

    return NextResponse.json({
      reply,
      provider,
      model,
      intent: agentResult.intent,
      sources: agentResult.sources,
      mode: "provider-boosted",
      speechText,
      isStory,
      storyId: isStory ? `api-story-${Date.now()}` : undefined,
    });
  } catch (error) {
    console.error("AI chat route failed:", error);
    return NextResponse.json(
      {
        error: "Failed to process AI chat request.",
      },
      { status: 500 }
    );
  }
}
