export interface UserProfile {
  id: string;
  email: string;
  tokensUsed: number;
  tokenLimit?: number;
  tokensUsed6h: number;
  tokenLimit6h: number;
  resetAt: string | null;
  pct6h?: number;
  resetCountdown6h?: string;
  tokensUsedWeekly: number;
  tokenLimitWeekly: number;
  weeklyResetAt: string | null;
  pctWeekly?: number;
  resetCountdownWeekly?: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface PasswordResetRequest {
  email: string;
  newPassword: string;
}

export type ChatMessagePart =
  | {
      type: "text";
      text: string;
      state?: "streaming" | "done";
    }
  | {
      type: "reasoning";
      text: string;
      state?: "streaming" | "done";
    }
  | {
      type: "tool";
      toolCallId: string;
      toolName: string;
      state: string;
      input?: unknown;
      output?: unknown;
    };

export interface MessageSchema {
  id?: string;
  role: "user" | "model" | "assistant" | string;
  /** Flattened text content (for previews / legacy). */
  content: string;
  /** Structured parts for rich rendering (markdown, thoughts, tools). */
  parts?: ChatMessagePart[];
}

/** Session row from GET /agent/sessions (no full message history). */
export interface ChatSessionListItem {
  id: string;
  userId: string;
  title?: string | null;
  lastMessageContent?: string | null;
  lastMessageRole?: string | null;
  readStatus?: "read" | "not read" | string;
  createdAt: string;
  updatedAt: string;
}

/** Full session from GET /agent/sessions/:id. */
export interface ChatSession extends ChatSessionListItem {
  messages?: MessageSchema[];
}

export interface ChatRequest {
  message: string;
  model?: string;
  reasoning?: string;
}

export interface ChatResponse {
  sessionId: string;
  title?: string | null;
  response: string;
}

export interface TextModelConfig {
  description: string;
  enabled: boolean;
  reasoningModes: string[];
}

export interface AppConfig {
  id: string;
  enableTextGeneration: boolean;
  enableImageGeneration: boolean;
  enableVideoGeneration: boolean;
  defaultTextModel: string;
  allowedReasoningLevels: string[];
  defaultReasoningLevel: string;
  modelsList: Record<string, TextModelConfig>;
  allowedImageModels: string[];
  allowedVideoModels: string[];
  allowedTools: string[];
  enableAiStt: boolean;
  sttModel: string;
  updatedAt: string;
}

export interface ServerActionErrorResponse {
  error: string;
  isServerActionError: true;
}
