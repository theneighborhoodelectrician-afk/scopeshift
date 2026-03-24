import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/practice/:path*", "/scenario/:path*", "/sessions/:path*", "/progress/:path*", "/leaderboard/:path*", "/team/:path*", "/presets/:path*", "/settings/:path*"]
};
