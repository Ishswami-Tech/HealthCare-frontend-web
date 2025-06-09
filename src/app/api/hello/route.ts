import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello from the API!" });
}

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
