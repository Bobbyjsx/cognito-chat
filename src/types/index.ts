export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  resetAt: string | null;
  pct6h?: number;
  resetCountdown6h?: string;
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
    }
  | {
      type: "sources";
      sources: Array<{
        title?: string;
        url?: string;
        uri?: string;
        domain?: string;
        faviconUrl?: string;
      }>;
    }
  | {
      type: "source";
      url?: string;
      uri?: string;
      title?: string;
      domain?: string;
      faviconUrl?: string;
    }
  | {
      type: "file";
      url?: string;
      urlExpiresAt?: string;
      filename?: string;
      mediaType?: string;
      contentType?: string;
      size?: number;
      bucket?: string;
      objectName?: string;
      attachmentId?: string;
    };

export interface MessageSchema {
  id?: string;
  role: "user" | "model" | "assistant" | string;
  /** Flattened text content (for previews / legacy). */
  content: string;
  /** Error message if generation failed */
  error?: string | null;
  /** Structured parts for rich rendering (markdown, thoughts, tools). */
  parts?: ChatMessagePart[];
  /** IDs of attachments referenced by this message. */
  attachmentIds?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/** Session row from GET /agent/sessions (no full message history). */
export interface ChatSessionListItem {
  id: string;
  userId: string;
  title?: string | null;
  lastMessageContent?: string | null;
  lastMessageRole?: string | null;
  readStatus?: "read" | "not read" | string;
  activeGenerationId?: string | null;
  excludeFromMemory?: boolean;
  /** Present when this session has an active public share link. */
  shareId?: string | null;
  animateTitle?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Full session from GET /agent/sessions/:id. */
export interface ChatSession extends ChatSessionListItem {
  messages?: MessageSchema[];
}

export interface SessionWithPaginatedMessages {
  session: ChatSessionListItem;
  messages: PaginatedResponse<MessageSchema>;
  activeGenerationId?: string | null;
}

export interface ChatRequest {
  message: string;
  model?: string;
  reasoning?: string;
  attachments?: string[];
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
  provider?: string;
}

/** Categorization of an uploaded attachment (mirrors backend AttachmentType). */
export type AttachmentType =
  | "image"
  | "pdf"
  | "document"
  | "audio"
  | "video"
  | "spreadsheet"
  | "json"
  | "text";

/** Attachment metadata returned by the backend (camelCased by the axios layer). */
export interface AttachmentSchema {
  id: string;
  filename: string;
  mimeType: string;
  contentType?: string;
  size: number;
  type: AttachmentType;
  sessionId?: string | null;
  bucket?: string | null;
  objectName?: string | null;
  storageUri?: string | null;
  url?: string | null;
  urlExpiresAt?: string | null;
  downloadUrl?: string | null;
  deletedAt?: string | null;
  uploadedAt: string;
}

export interface PresignedUploadResponse {
  attachmentId: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  attachment: AttachmentSchema;
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
  enableSmartRouting?: boolean;
  defaultRoutingMode?: string;
  enableAiStt: boolean;
  sttModel: string;
  enableAttachments: boolean;
  attachmentMaxSize: number;
  attachmentMaxCount: number;
  attachmentAllowedTypes: AttachmentType[];
  contextTrimEnabled: boolean;
  contextMaxTokens: number;
  contextKeepRecent: number;
  updatedAt: string;
}

export interface ServerActionErrorResponse {
  error: string;
  isServerActionError: true;
}

export interface SharedChatMessage {
  id: string;
  role: "user" | "agent" | "assistant" | "system" | string;
  content: string;
  attachmentIds?: string[];
  parts?: ChatMessagePart[];
  createdAt: string;
}

export interface CreateSharedChatRequest {
  title?: string | null;
  showName?: boolean;
}

export interface SharedChat {
  id: string;
  sessionId: string;
  title?: string | null;
  authorName?: string | null;
  isOwner?: boolean;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  messages: SharedChatMessage[];
}

export interface CreateSharedChatResponse {
  shareId: string;
  sessionId: string;
  title?: string | null;
  authorName?: string | null;
  createdAt: string;
  messageCount: number;
}

export interface ContinueChatResponse {
  sessionId: string;
  title?: string | null;
  excludeFromMemory?: boolean;
}
