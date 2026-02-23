export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCallStatus[];
}

export interface ToolCallStatus {
  id: string;
  toolName: string;
  status: "pending" | "running" | "completed" | "error";
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface NotificationPreference {
  type: "study_reminder" | "task_deadline" | "streak_alert" | "weekly_digest";
  enabled: boolean;
  timing: string;
}

export interface StudyPlan {
  id: string;
  durationDays: number;
  targetDeckIds: string[];
  dailyHoursAvailable: number;
  examDate: string | null;
  status: "draft" | "approved" | "active" | "completed";
  events: string[];
  tasks: string[];
  createdAt: string;
}
