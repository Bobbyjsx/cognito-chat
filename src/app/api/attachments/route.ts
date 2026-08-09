import { auth } from "@/auth";
import { apiUrl, atlasHeaders } from "@/lib/api-config";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return new Response(JSON.stringify({ detail: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    // Proxy the exact multipart/form-data to the backend
    const backendRes = await fetch(apiUrl("/agent/attachments"), {
      method: "POST",
      headers: atlasHeaders({
        Authorization: `Bearer ${session.accessToken}`,
      }),
      body: formData,
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      return new Response(errorText, {
        status: backendRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await backendRes.json();
    return Response.json(data);
  } catch (error) {
    console.error("Upload proxy error:", error);
    return new Response(JSON.stringify({ detail: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
