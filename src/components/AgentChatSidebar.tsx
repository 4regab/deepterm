import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Trash2, X } from "lucide-react";
import { ChatMessage } from "@/types/agent";
import { getChatHistory, addMessage, clearChatHistory } from "@/services/chatService";

const SYSTEM_GREETING: ChatMessage = {
  id: "system-greeting",
  role: "assistant",
  content:
    "👋 Hi! I'm the DeepTerm Agent. I can help you manage your tasks, schedule events, and create study plans. Try saying:\n\n• *\"Create a task: Review Biology Chapter 3 by Friday\"*\n• *\"Schedule a study session for tomorrow at 2pm\"*\n• *\"Show my pending tasks\"*",
  timestamp: new Date().toISOString(),
};

const AgentChatSidebar: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = getChatHistory();
    setMessages(history.length > 0 ? history : [SYSTEM_GREETING]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;

    setInputValue("");
    const userMsg = addMessage("user", text);
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    // Simulate agent response (placeholder for real AI SDK integration)
    setTimeout(() => {
      let response = "";
      const lower = text.toLowerCase();

      if (lower.includes("task") || lower.includes("todo")) {
        response =
          "📋 I can help with tasks! Use the **Kanban Board** to manage your tasks visually, or tell me:\n\n• *\"Create a task: [title]\"*\n• *\"Show my tasks\"*\n• *\"Move task to In Progress\"*";
      } else if (lower.includes("calendar") || lower.includes("schedule") || lower.includes("event")) {
        response =
          "📅 I can help with scheduling! Use the **Calendar** to view and manage events, or tell me:\n\n• *\"Create an event: [title] at [time]\"*\n• *\"Show my events for this week\"*";
      } else if (lower.includes("study") || lower.includes("flashcard") || lower.includes("deck")) {
        response =
          "📚 I can help with studying! I can generate study plans and flashcards. Try:\n\n• *\"Create a study plan for 7 days\"*\n• *\"Generate flashcards about [topic]\"*";
      } else if (lower.includes("help")) {
        response =
          "Here's what I can do:\n\n📋 **Tasks** — Create, update, and organize kanban tasks\n📅 **Calendar** — Schedule events and study sessions\n📚 **Study** — Generate flashcards and study plans\n🔔 **Reminders** — Set up email notifications\n\nJust tell me what you need!";
      } else {
        response = `I received your message: "${text}". I'm currently in preview mode — full AI-powered responses will be available when connected to the Vercel AI SDK with a Gemini or GPT model. In the meantime, try the **Kanban Board** or **Calendar** for task management!`;
      }

      const assistantMsg = addMessage("assistant", response);
      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChatHistory();
    setMessages([SYSTEM_GREETING]);
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === "user";
    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
      >
        <div
          className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
            isUser
              ? "bg-neo-accent text-white rounded-br-none"
              : "bg-white neo-border shadow-neo-sm rounded-bl-none"
          }`}
        >
          <div className="whitespace-pre-wrap">{msg.content}</div>
          <div
            className={`text-[10px] mt-1 ${
              isUser ? "text-white/70" : "text-gray-400"
            }`}
          >
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-neo-accent text-white shadow-neo neo-border hover:bg-neo-accent/90 hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all z-40"
          size="icon"
          aria-label="Open AI Agent Chat"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] p-0 flex flex-col border-l-2 border-neo-black bg-[#FFF9EB]"
      >
        <SheetHeader className="px-4 py-3 border-b-2 border-neo-black bg-white">
          <SheetDescription className="sr-only">Chat with the DeepTerm AI agent</SheetDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neo-accent flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold">DeepTerm Agent</SheetTitle>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] text-gray-500">Online</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear} aria-label="Clear chat">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {messages.map(renderMessage)}
          {isProcessing && (
            <div className="flex justify-start mb-3">
              <div className="bg-white neo-border shadow-neo-sm rounded-lg rounded-bl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t-2 border-neo-black bg-white">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the agent..."
              className="neo-border flex-1"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isProcessing}
              className="bg-neo-accent text-white hover:bg-neo-accent/90 neo-border shadow-neo-sm"
              size="icon"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Powered by DeepTerm Agent • Preview Mode
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AgentChatSidebar;
