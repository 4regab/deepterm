"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { useKanbanStore, useCalendarEventStore, useNotificationStore } from "@/lib/stores";

const TOOL_LABELS: Record<string, string> = {
  createTask: "📋 Creating task…",
  updateTask: "📋 Updating task…",
  moveTask: "📋 Moving task…",
  deleteTask: "🗑️ Deleting task…",
  listTasks: "📋 Listing tasks…",
  createCalendarEvent: "📅 Adding to calendar…",
  updateCalendarEvent: "📅 Updating event…",
  deleteCalendarEvent: "🗑️ Removing event…",
  getEventsForRange: "📅 Fetching events…",
  scheduleReminder: "🔔 Scheduling reminder…",
  cancelReminder: "🔔 Cancelling reminder…",
  generateStudyPlan: "📚 Generating study plan…",
};

const SUGGESTIONS = [
  "Create a task for my homework",
  "Show my calendar for this week",
  "Generate a study plan",
];

interface ParsedToolResult {
  success: boolean;
  action: string;
  data: Record<string, unknown>;
}

function parseToolResult(result: unknown): ParsedToolResult | null {
  try {
    if (typeof result === "string") {
      return JSON.parse(result);
    }
    if (typeof result === "object" && result !== null && "action" in result) {
      return result as ParsedToolResult;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof message.parts[number], { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface ToolPartInfo {
  toolCallId: string;
  toolName: string;
  isDone: boolean;
  output?: unknown;
}

function getToolParts(message: UIMessage): ToolPartInfo[] {
  const results: ToolPartInfo[] = [];
  for (const part of message.parts) {
    if (part.type.startsWith("tool-")) {
      const p = part as unknown as { toolCallId: string; state: string; output?: unknown };
      results.push({
        toolCallId: p.toolCallId,
        toolName: part.type.replace(/^tool-/, ""),
        isDone: p.state === "output-available",
        output: p.output,
      });
    }
  }
  return results;
}

export default function ChatSidebar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const processedToolCalls = useRef<Set<string>>(new Set());

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/agent/chat" }),
    []
  );

  const { messages, status, sendMessage } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Process tool call results and dispatch to stores
  useEffect(() => {
    for (const message of messages) {
      const toolParts = getToolParts(message);
      for (const part of toolParts) {
        if (!part.isDone) continue;
        const callId = part.toolCallId;
        if (processedToolCalls.current.has(callId)) continue;
        processedToolCalls.current.add(callId);

        const parsed = parseToolResult(part.output);
        if (!parsed?.success) continue;

        const { action, data } = parsed;

        switch (action) {
          case "created_task":
            useKanbanStore.getState().createTask({
              title: data.title as string,
              columnId: (data.columnId as string) || "backlog",
              description: data.description as string | undefined,
              dueDate: data.dueDate as string | undefined,
              priority: (data.priority as "low" | "medium" | "high" | "urgent") || "medium",
            });
            break;
          case "updated_task":
            useKanbanStore.getState().updateTask(data.taskId as string, {
              title: data.title as string | undefined,
              description: data.description as string | undefined,
              dueDate: data.dueDate as string | undefined,
              priority: data.priority as "low" | "medium" | "high" | "urgent" | undefined,
            });
            break;
          case "moved_task":
            useKanbanStore.getState().moveTask(
              data.taskId as string,
              data.toColumnId as string
            );
            break;
          case "deleted_task":
            useKanbanStore.getState().deleteTask(data.taskId as string);
            break;
          case "created_calendar_event":
            useCalendarEventStore.getState().createEvent({
              title: data.title as string,
              type: data.type as "study_session" | "task_deadline" | "exam" | "pomodoro_block",
              startDateTime: data.startDateTime as string,
              endDateTime: data.endDateTime as string,
              allDay: (data.allDay as boolean) ?? false,
              recurrence: (data.recurrence as "daily" | "weekly" | "monthly" | "none") ?? "none",
            });
            break;
          case "updated_calendar_event":
            useCalendarEventStore.getState().updateEvent(data.eventId as string, {
              title: data.title as string | undefined,
              type: data.type as "study_session" | "task_deadline" | "exam" | "pomodoro_block" | undefined,
              startDateTime: data.startDateTime as string | undefined,
              endDateTime: data.endDateTime as string | undefined,
            });
            break;
          case "deleted_calendar_event":
            useCalendarEventStore.getState().deleteEvent(data.eventId as string);
            break;
          case "scheduled_reminder": {
            let context: Record<string, string> = {};
            try {
              context = JSON.parse(data.context as string);
            } catch (e) {
              console.warn("Failed to parse reminder context JSON:", e);
              context = { info: String(data.context) };
            }
            useNotificationStore.getState().scheduleReminder({
              type: data.type as "study_reminder" | "task_deadline" | "streak_alert" | "weekly_digest",
              recipientEmail: data.recipientEmail as string,
              scheduledAt: data.scheduledAt as string,
              context,
            });
            break;
          }
          case "cancelled_reminder":
            useNotificationStore.getState().cancelReminder(data.reminderId as string);
            break;
          // listed_tasks, fetched_events_range, generated_study_plan are display-only
        }
      }
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#171d2b] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-[#171d2b]/10 bg-[#f0f0ea] shadow-xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#171d2b]/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#171d2b]" />
            <h2 className="font-serif text-lg font-semibold text-[#171d2b]">
              DeepTerm Agent
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-[#171d2b]/60 transition-colors hover:bg-[#171d2b]/5 hover:text-[#171d2b]"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <Bot className="h-10 w-10 text-[#171d2b]/30" />
              <p className="font-sans text-sm text-[#171d2b]/50">
                How can I help you today?
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="rounded-lg border border-[#171d2b]/10 bg-white px-3 py-2 text-left text-sm text-[#171d2b]/70 transition-colors hover:border-[#171d2b]/20 hover:bg-[#171d2b]/5"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message) => {
                const text = getTextContent(message);
                const toolParts = getToolParts(message);
                return (
                  <div key={message.id}>
                    {/* Text content */}
                    {text && (
                      <div
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                            message.role === "user"
                              ? "bg-[#171d2b] text-white"
                              : "border border-[#171d2b]/10 bg-white text-[#171d2b]"
                          }`}
                        >
                          {text}
                        </div>
                      </div>
                    )}
                    {/* Tool invocations */}
                    {toolParts.map((part) => (
                      <div
                        key={part.toolCallId}
                        className="my-1 flex justify-start"
                      >
                        <span className="rounded-md bg-[#171d2b]/5 px-2 py-1 text-xs text-[#171d2b]/60">
                          {part.isDone
                            ? (TOOL_LABELS[part.toolName]?.replace("…", " ✓") ?? `✓ ${part.toolName}`)
                            : (TOOL_LABELS[part.toolName] ?? `⏳ ${part.toolName}…`)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg border border-[#171d2b]/10 bg-white px-3 py-2 text-sm text-[#171d2b]/50">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[#171d2b]/10 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask DeepTerm Agent…"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-[#171d2b]/10 bg-white px-3 py-2 text-sm text-[#171d2b] placeholder-[#171d2b]/40 outline-none transition-colors focus:border-[#171d2b]/30"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171d2b] text-white transition-opacity disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
