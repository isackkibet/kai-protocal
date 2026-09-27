export interface ChatHistoryRecord {
  session_id: string;
  user_message: string;
  bot_response: string;
  intent: string;
  timestamp: string;
}

// In-memory session chat cache
const sessionMemory = new Map<string, ChatHistoryRecord[]>();

export async function getHistory(sessionId: string, limit = 10): Promise<ChatHistoryRecord[]> {
  const records = sessionMemory.get(sessionId) || [];
  return records.slice(-limit);
}

export async function storeHistory(params: {
  sessionId: string;
  userMessage: string;
  botResponse: string;
  intent: string;
}): Promise<void> {
  const current = sessionMemory.get(params.sessionId) || [];
  const newRecord: ChatHistoryRecord = {
    session_id: params.sessionId,
    user_message: params.userMessage,
    bot_response: params.botResponse,
    intent: params.intent,
    timestamp: new Date().toISOString(),
  };
  sessionMemory.set(params.sessionId, [...current, newRecord]);
}
