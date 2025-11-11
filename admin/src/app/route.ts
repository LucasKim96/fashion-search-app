import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  // Redirect nội bộ, không cần biến môi trường
  return NextResponse.redirect(new URL("/login", request.url));
}
