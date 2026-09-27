import { detectIntent } from "@/lib/agent/intent";
import { getHistory, storeHistory } from "@/lib/agent/memory";
import { buildStorytellerResponse } from "@/lib/agent/storyteller";
import { retrieveKnowledge } from "@/lib/agent/retrieval";
import type { AgentChatResult } from "@/lib/agent/types";

export async function runSihuAgent(params: {
  sessionId: string;
  message: string;
}): Promise<AgentChatResult & { isStory?: boolean; storyId?: string; speechText?: string }> {
  const intent = detectIntent(params.message);
  const [knowledge, history] = await Promise.all([
    retrieveKnowledge(params.message, 3),
    getHistory(params.sessionId, 10),
  ]);

  // Use storytelling response builder for engaging narrative responses
  const storyResult = buildStorytellerResponse({
    message: params.message,
    intent,
    knowledge,
    history,
  });

  await storeHistory({
    sessionId: params.sessionId,
    userMessage: params.message,
    botResponse: storyResult.reply,
    intent,
  });

  return {
    reply: storyResult.reply,
    intent,
    sources: knowledge.map((item) => item.source).filter(Boolean),
    knowledge,
    isStory: storyResult.isStory,
    storyId: storyResult.storyId,
    speechText: storyResult.speechText,
  };
}
