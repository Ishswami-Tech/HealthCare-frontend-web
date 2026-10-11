import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { APP_CONFIG } from "@/lib/config/config";
import { getServerSession } from "@/lib/actions/auth.server";
import { fetchWithAbort } from "@/lib/utils/fetch-with-abort";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Prescription PDF for the signed-in user. The backend endpoint needs the access token and clinic
 * header, which a plain link from the browser does not carry, so the page links here and this route
 * forwards the request with them.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: prescriptionId } = await params;

  // Prescription ids are UUIDs; anything else (including ".." or quotes) is refused before any request.
  if (!prescriptionId || !/^[A-Za-z0-9-]{8,64}$/.test(prescriptionId)) {
    return NextResponse.json({ error: "Invalid prescription ID" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const session = await getServerSession();
  const clinicId = session?.user?.clinicId || cookieStore.get("clinic_id")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!clinicId) {
    return NextResponse.json({ error: "Clinic context is missing. Please re-login." }, { status: 403 });
  }

  try {
    const backendResponse = await fetchWithAbort(
      `${APP_CONFIG.API.BASE_URL}/pharmacy/prescriptions/${encodeURIComponent(prescriptionId)}/pdf`,
      {
        headers: { Authorization: `Bearer ${accessToken}`, "X-Clinic-ID": clinicId },
        timeout: 60000,
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      // The backend's own message stays on the server.
      return NextResponse.json(
        { error: "The prescription PDF is not available" },
        { status: backendResponse.status === 404 ? 404 : 502 }
      );
    }

    const pdfBuffer = await backendResponse.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // Opens in the browser's viewer, where it can be printed.
        "Content-Disposition": 'inline; filename="prescription.pdf"',
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "The prescription PDF could not be loaded" }, { status: 500 });
  }
}
