// admin/src/app/route.ts
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_ADMIN_BASE_URL || 'http://localhost:3000'), 302);
}
