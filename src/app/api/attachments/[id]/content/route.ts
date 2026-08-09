import { auth } from "@/auth";
import { API_BASE_URL, atlasHeaders } from "@/lib/api-config";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const backendRes = await fetch(
      `${API_BASE_URL}/agent/attachments/${id}/content`,
      {
        headers: atlasHeaders({
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    );

    if (!backendRes.ok) {
      return new Response("Not Found", { status: backendRes.status });
    }

    return new Response(backendRes.body, {
      status: 200,
      headers: {
        "Content-Type":
          backendRes.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Failed to proxy attachment content", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
