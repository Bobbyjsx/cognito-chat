/**
 * Existing session — URL: /chat/[sessionId]
 * UI is rendered by the parent ChatShell (layout) so streams survive navigation.
 */
export const runtime = "edge";

export default async function SessionChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  // Resolve params so Next treats this as a dynamic segment; ChatShell reads the URL.
  await params;
  return null;
}
