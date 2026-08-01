export const runtime = "edge";

import { NextRequest } from "next/server";
import {
  API_BASE_URL,
  getAtlasApiKey,
  ATLAS_API_KEY_HEADER,
} from "@/lib/api-config";

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const targetPath = path.join("/");

    // Construct the target URL keeping search parameters intact
    const url = new URL(req.url);
    const searchParams = url.search;
    const targetUrl = `${API_BASE_URL}/${targetPath}${searchParams}`;

    // Forward the headers
    const headers = new Headers(req.headers);
    // Remove host header so fetch sets the correct one for the target
    headers.delete("host");

    // Inject the server-side API key
    const atlasKey = getAtlasApiKey();
    if (atlasKey) {
      headers.set(ATLAS_API_KEY_HEADER, atlasKey);
    }

    // Prepare fetch options
    const init: RequestInit = {
      method: req.method,
      headers,
      // For Next.js edge runtime, we don't need to specify agent/redirect settings
      redirect: "manual",
    };

    // Forward the body if present
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = req.body;
      // @ts-expect-error - Duplex is required for streaming bodies in some node/edge fetch implementations
      init.duplex = "half";
    }

    const response = await fetch(targetUrl, init);

    // Proxy the response back to the client
    const responseHeaders = new Headers(response.headers);
    // Next.js handles encoding, so we should delete content-encoding if we stream the body directly
    responseHeaders.delete("content-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ message: "Internal Server Error", detail }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
