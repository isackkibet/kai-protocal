import type { AgentKnowledgeItem } from "@/lib/agent/types";

export function buildAgentResponse(params: {
  message: string;
  intent: string;
  knowledge: AgentKnowledgeItem[];
  history: Array<{ user_message?: string; bot_response?: string }>;
}) {
  const { intent, knowledge, history } = params;

  if (knowledge.length > 0) {
    const top = knowledge[0];
    if (top.title) {
      return `${top.title}\n\n${top.content}\n\nSource: ${top.source}`;
    }

    return `${top.content}\n\nSource: ${top.source}`;
  }

  if (intent === "general_chat") {
    return "I am Agent SIHU. I can help with SIHU Hub, the homepage mission, Lake Victoria Basin topics, and article-based questions.";
  }

  if (history.length > 0) {
    return "I do not have a strong matching article or stored knowledge for that yet, but I can answer once the missing knowledge is added.";
  }

  return "I do not have enough stored knowledge for that yet. You can add more knowledge or ask about SIHU Hub, the homepage mission, or published articles.";
}
