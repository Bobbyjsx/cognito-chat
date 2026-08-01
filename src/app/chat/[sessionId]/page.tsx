/**
 * Existing session — URL: /chat/[sessionId]
 * UI is rendered by the parent ChatShell (layout) so streams survive navigation.
 */
export const runtime = "edge";

export default function SessionChatPage() {
  // Return null immediately; UI is owned by ChatShell.
  // By avoiding an async Server Component, we prevent Next.js from blocking client-side transitions.
  return null;
}
