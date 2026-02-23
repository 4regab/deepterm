import { ChatMessage } from "@/types/agent";

const CHAT_KEY = "deepterm-chat-history";

function generateId(): string {
  return crypto.randomUUID();
}

export function getChatHistory(): ChatMessage[] {
  try {
    const data = localStorage.getItem(CHAT_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load chat history:", e);
  }
  return [];
}

export function saveChatHistory(messages: ChatMessage[]): void {
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
}

export function addMessage(role: ChatMessage["role"], content: string): ChatMessage {
  const messages = getChatHistory();
  const message: ChatMessage = {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  messages.push(message);
  saveChatHistory(messages);
  return message;
}

export function clearChatHistory(): void {
  localStorage.removeItem(CHAT_KEY);
}
