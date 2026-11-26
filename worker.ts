import { handleApiRequest, SECURITY_HEADERS, type EdgeApiEnv } from "./src/server/repairApiEdge.ts";

interface AssetsFetcher {
  fetch(input: Request | string): Promise<Response>;
}

interface CloudflareEnv extends EdgeApiEnv {
  ASSETS: AssetsFetcher;
}

export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    }

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
