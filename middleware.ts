import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Step A: No authentication check yet
// Step B will add Supabase Auth + Google OAuth + allowed_users check
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/tool/:path*"],
};
