import { NextResponse, type NextRequest } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: invoiceId } = await params;

  if (!invoiceId || typeof invoiceId !== "string") {
    return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
  }

  return NextResponse.redirect(
    new URL(`/billing/invoices/${invoiceId}/download`, request.url),
    307
  );
}
