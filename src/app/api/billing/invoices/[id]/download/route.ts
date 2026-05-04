import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { APP_CONFIG } from "@/lib/config/config";
import { fetchWithAbort } from "@/lib/utils/fetch-with-abort";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: invoiceId } = await params;

  if (!invoiceId || typeof invoiceId !== "string") {
    return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const clinicId = cookieStore.get("clinic_id")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendResponse = await fetchWithAbort(
      `${APP_CONFIG.API.BASE_URL}/billing/invoices/${invoiceId}/pdf-download`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(clinicId ? { "X-Clinic-ID": clinicId } : {}),
        },
        timeout: 60000,
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Failed to fetch invoice PDF: ${errorText}` },
        { status: backendResponse.status }
      );
    }

    const pdfBuffer = await backendResponse.arrayBuffer();
    const contentDisposition = backendResponse.headers.get("content-disposition");
    const fileName = contentDisposition
      ? (contentDisposition.split("filename=")[1]?.replace(/"/g, "") ?? `invoice-${invoiceId}.pdf`)
      : `invoice-${invoiceId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
