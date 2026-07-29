import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return new Response(JSON.stringify({ detail: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, model, reasoning, sessionId } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content || "";

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${backendUrl}/agent/chat/stream${
    sessionId ? `?session_id=${sessionId}` : ""
  }`;

  try {
    const backendResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        message: lastMessage,
        model,
        reasoning,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return new Response(errorText, {
        status: backendResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform backend SSE stream into text stream for Vercel AI SDK useChat hook
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.type === "text" && data.token) {
                controller.enqueue(encoder.encode(data.token));
              }
            } catch {
              // ignore parse errors for non-json
            }
          }
        }
      },
    });

    return new Response(backendResponse.body?.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Streaming request failed";
    return new Response(
      JSON.stringify({ detail: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
