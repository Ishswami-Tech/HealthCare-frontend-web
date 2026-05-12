export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ path?: string[] }>;
};

function buildTargetUrl(pathParts: string[], search: string) {
  if (pathParts.length < 2) {
    return null;
  }

  const [host, ...rest] = pathParts;
  const target = new URL(`https://${host}/${rest.join("/")}`);

  if (search) {
    target.search = search;
  }

  return target;
}

function forwardHeaders(request: Request) {
  const headers = new Headers();
  const allowList = [
    "accept",
    "accept-language",
    "cache-control",
    "content-type",
    "if-modified-since",
    "if-none-match",
    "origin",
    "range",
    "referer",
    "user-agent",
  ];

  for (const key of allowList) {
    const value = request.headers.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  return headers;
}

async function proxyRequest(request: Request, pathParts: string[]) {
  const targetUrl = buildTargetUrl(pathParts, new URL(request.url).search);

  if (!targetUrl) {
    return Response.json({ error: "A proxy target is required." }, { status: 400 });
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: forwardHeaders(request),
    redirect: "follow",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstreamResponse = await fetch(targetUrl, init);
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, { params }: RouteParams) {
  const { path = [] } = await params;
  return proxyRequest(request, path);
}

export async function HEAD(request: Request, { params }: RouteParams) {
  const { path = [] } = await params;
  return proxyRequest(request, path);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { path = [] } = await params;
  return proxyRequest(request, path);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { path = [] } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { path = [] } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { path = [] } = await params;
  return proxyRequest(request, path);
}

