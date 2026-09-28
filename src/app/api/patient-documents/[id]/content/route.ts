import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { APP_CONFIG } from "@/lib/config/config";
import { getServerSession } from "@/lib/actions/auth.server";

/**
 * Same-origin streaming proxy for patient document bytes, used as the `src` of
 * `<audio>`/`<video>` elements (which cannot send Authorization headers).
 * Forwards the access-token cookie as a bearer token plus `X-Clinic-ID`, passes
 * the `Range` header through and streams the backend response back with its
 * status (200/206) and content headers preserved, so seeking works.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "content-disposition",
  "etag",
  "last-modified",
] as const;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id || !ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedClinicId = request.nextUrl.searchParams.get("clinicId");
  const session = await getServerSession();
  const clinicId =
    (requestedClinicId && ID_PATTERN.test(requestedClinicId) ? requestedClinicId : null) ??
    session?.user?.clinicId ??
    cookieStore.get("clinic_id")?.value;
  if (!clinicId) {
    return NextResponse.json(
      { error: "Clinic context is missing. Please re-login." },
      { status: 403 },
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "X-Clinic-ID": clinicId,
  };
  const sessionId = cookieStore.get("session_id")?.value;
  if (sessionId) headers["X-Session-ID"] = sessionId;
  const range = request.headers.get("range");
  if (range) headers.Range = range;

  const disposition =
    request.nextUrl.searchParams.get("disposition") === "attachment"
      ? "?disposition=attachment"
      : "";

  try {
    const upstream = await fetch(
      `${APP_CONFIG.API.BASE_URL}/patient-documents/${id}/content${disposition}`,
      { headers, cache: "no-store" },
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: text || "Failed to load the document" },
        { status: upstream.status },
      );
    }

    const responseHeaders = new Headers();
    for (const name of PASSTHROUGH_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set("Cache-Control", "private, no-store");
    responseHeaders.set("X-Content-Type-Options", "nosniff");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load the document";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
