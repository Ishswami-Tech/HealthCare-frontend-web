// Next.js App Router API Route
// Proxies GET /billing/invoices/:id/pdf-download from the backend and streams the
// PDF file to the browser. This is the correct pattern for file downloads in
// Next.js App Router because server actions cannot stream binary responses.
//
// Usage: open `/api/billing/invoices/${invoiceId}/download` in a new tab.

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { APP_CONFIG } from '@/lib/config/config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: invoiceId } = await params;

  if (!invoiceId || typeof invoiceId !== 'string') {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
  }

  // Read session from httpOnly cookies (same pattern as getServerSession in auth.server.ts)
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const clinicId = cookieStore.get('clinic_id')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendBase = APP_CONFIG.API.BASE_URL;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    ...(clinicId ? { 'X-Clinic-ID': clinicId } : {}),
  };

  try {
    const backendResponse = await fetch(
      `${backendBase}/billing/invoices/${invoiceId}/pdf-download`,
      { headers, cache: 'no-store' }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: `Failed to fetch invoice PDF: ${errorText}` },
        { status: backendResponse.status }
      );
    }

    // Buffer the PDF body
    const pdfBuffer = await backendResponse.arrayBuffer();

    // Prefer Content-Disposition from backend; fall back to generic name
    const contentDisposition = backendResponse.headers.get('content-disposition');
    const fileName = contentDisposition
      ? (contentDisposition.split('filename=')[1]?.replace(/"/g, '') ?? `invoice-${invoiceId}.pdf`)
      : `invoice-${invoiceId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
