import type { AgentIntent } from "@/lib/agent/types";

// Enhanced semantic pattern detection for interactive storytelling
interface IntentPattern {
  intent: AgentIntent;
  keywords: string[];
  phrases: string[];
  context: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Greeting / Social intents
  {
    intent: "greeting",
    keywords: ["hello", "hi", "hey", "greetings", "morning", "afternoon", "evening", "welcome"],
    phrases: ["how are you", "what's up", "how do you do", "nice to meet you", "good to see you"],
    context: ["first_message", "returning_user"],
  },
  // Farewell / Ending intents
  {
    intent: "farewell",
    keywords: ["bye", "goodbye", "see you", "later", "thanks", "thank you", "appreciate"],
    phrases: ["see you later", "talk soon", "have a good day", "that helps", "that was helpful"],
    context: ["closing", "satisfied"],
  },
  // Story request intents
  {
    intent: "story_request",
    keywords: ["tell me", "story", "narrative", "describe", "explain like", "imagine", "picture"],
    phrases: ["tell me a story", "once upon a time", "what if", "how does it work", "why is that"],
    context: ["engaged", "curious"],
  },
  // Knowledge query intents
  {
    intent: "knowledge_query",
    keywords: ["what", "who", "when", "where", "why", "how", "explain", "define", "meaning"],
    phrases: ["what is", "how do", "why does", "tell me about", "i want to know", "help me understand"],
    context: ["learning", "seeking_info"],
  },
  // Follow-up / Continuation intents
  {
    intent: "follow_up",
    keywords: ["more", "continue", "next", "then", "what else", "go on", "and", "also", "another"],
    phrases: ["tell me more", "what else", "go on", "what happened next", "anything else", "that reminds me"],
    context: ["engaged", "deep_dive"],
  },
  // Clarification intents
  {
    intent: "clarification",
    keywords: ["mean", "clarify", "confused", "understand", "example", "elaborate"],
    phrases: ["what do you mean", "i don't understand", "can you clarify", "for example", "like what"],
    context: ["confused", "seeking_clarity"],
  },
  // Opinion / Emotional intents
  {
    intent: "opinion",
    keywords: ["think", "feel", "believe", "amazing", "beautiful", "sad", "hopeful", "worried"],
    phrases: ["what do you think", "is it true", "i feel like", "that sounds", "wow"],
    context: ["emotional", "reflective"],
  },
  // Semantic search intents
  {
    intent: "semantic_search",
    keywords: ["find", "search", "lookup", "retrieve", "match", "article", "news", "recent"],
    phrases: ["find me", "look up", "any news about", "search for", "show me"],
    context: ["researching", "seeking_sources"],
  },
  // General chat / Small talk
  {
    intent: "general_chat",
    keywords: ["okay", "ok", "sure", "maybe", "perhaps", "interesting", "cool"],
    phrases: ["i see", "makes sense", "got it", "alright", "fine"],
    context: ["acknowledging", "neutral"],
  },
];

// Detect conversation context based on history
export function detectConversationContext(
  message: string,
  history: Array<{ user_message?: string; bot_response?: string }>
): {
  isFirstMessage: boolean;
  isReturningUser: boolean;
  previousIntent?: string;
  conversationDepth: number;
  userEngagement: "low" | "medium" | "high";
} {
  const isFirstMessage = history.length === 0;
  const conversationDepth = history.length;
  
  // Check if user has engaged before (simple heuristic: 3+ messages = returning/engaged)
  const isReturningUser = conversationDepth > 2;
  
  // Get previous intent from last exchange
  const lastExchange = history[history.length - 1];
  const previousIntent = lastExchange ? detectIntent(lastExchange.user_message || "") : undefined;
  
  // Calculate engagement based on message length and question patterns
  const msgLower = message.toLowerCase();
  const hasQuestions = (msgLower.match(/\?/g) || []).length;
  const isDetailed = message.length > 50;
  const showsInterest = /tell|explain|more|story|how|why/.test(msgLower);
  
  let userEngagement: "low" | "medium" | "high" = "low";
  if (isDetailed && (hasQuestions > 0 || showsInterest)) {
    userEngagement = "high";
  } else if (isDetailed || hasQuestions > 0 || showsInterest) {
    userEngagement = "medium";
  }
  
  return {
    isFirstMessage,
    isReturningUser,
    previousIntent,
    conversationDepth,
    userEngagement,
  };
}

// Enhanced intent detection with semantic understanding
export function detectIntent(message: string): AgentIntent {
  const lowered = message.toLowerCase().trim();
  
  // Score each intent pattern
  const scores: Record<string, number> = {};
  
  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    
    // Check keywords (1 point each)
    for (const keyword of pattern.keywords) {
      if (lowered.includes(keyword)) {
        score += 1;
        // Boost if keyword appears at the start
        if (lowered.startsWith(keyword)) score += 0.5;
      }
    }
    
    // Check phrases (2 points each - stronger signal)
    for (const phrase of pattern.phrases) {
      if (lowered.includes(phrase)) {
        score += 2;
      }
    }
    
    scores[pattern.intent] = score;
  }
  
  // Find highest scoring intent
  let bestIntent: AgentIntent = "unknown";
  let bestScore = 0;
  
  for (const [intent, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as AgentIntent;
    }
  }
  
  // Default thresholds
  if (bestScore >= 1) {
    return bestIntent;
  }
  
  return "unknown";
}

// Get the emotional tone/mood of the message
export function detectMood(message: string): "excited" | "curious" | "neutral" | "concerned" | "grateful" {
  const lowered = message.toLowerCase();
  
  if (/wow|amazing|awesome|excited|great|love|fantastic/i.test(lowered)) {
    return "excited";
  }
  if (/why|how|what|tell me|curious|wonder|interested/i.test(lowered)) {
    return "curious";
  }
  if (/worried|concern|sad|bad|problem|issue|afraid/i.test(lowered)) {
    return "concerned";
  }
  if (/thank|grateful|appreciate|helpful|thanks/i.test(lowered)) {
    return "grateful";
  }
  
  return "neutral";
}

// Determine if this is likely a follow-up to previous topic
export function isFollowUpQuestion(
  message: string,
  previousBotResponse?: string
): boolean {
  if (!previousBotResponse) return false;
  
  const lowered = message.toLowerCase();
  
  // Direct follow-up indicators
  const followUpPatterns = [
    /^what about/,
    /^how about/,
    /^and /,
    /^but /,
    /^(what|who|when|where|why|how) else/,
    /^tell me more/,
    /^can you elaborate/,
    /^go on/,
    /^continue/,
    /^that reminds me/,
  ];
  
  for (const pattern of followUpPatterns) {
    if (pattern.test(lowered)) return true;
  }
  
  // Check for pronouns referencing previous context
  const hasPronouns = /\b(it|they|them|this|that|these|those|he|she|we)\b/i.test(lowered);
  const isShort = message.length < 30;
  
  // Short message with pronouns often indicates follow-up
  if (hasPronouns && isShort) return true;
  
  return false;
}
