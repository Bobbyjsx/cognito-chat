export interface UserProfile {
  id: string;
  email: string;
  tokensUsed: number;
  tokenLimit: number;
  tokensUsed6h: number;
  tokenLimit6h: number;
  resetAt: string | null;
  tokensUsedWeekly: number;
  tokenLimitWeekly: number;
  weeklyResetAt: string | null;
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

export interface MessageSchema {
  id?: string;
  role: "user" | "model" | "assistant" | string;
  content: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: MessageSchema[];
  lastMessageContent?: string;
  lastMessageRole?: string;
  readStatus?: "read" | "not read";
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  model?: string;
  reasoning?: string;
}

export interface ChatResponse {
  sessionId: string;
  response: string;
}

export interface AppConfig {
  id: string;
  enableTextGeneration: boolean;
  enableImageGeneration: boolean;
  enableVideoGeneration: boolean;
  allowedTextModels: string[];
  defaultTextModel: string;
  allowedReasoningLevels: string[];
  defaultReasoningLevel: string;
  allowedImageModels: string[];
  allowedVideoModels: string[];
  allowedTools: string[];
  updatedAt: string;
}

export interface ServerActionErrorResponse {
  error: string;
  isServerActionError: true;
}
