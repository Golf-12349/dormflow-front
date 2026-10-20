import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login?reason=session-expired", request.url),
  );
  response.cookies.set(
    SESSION_COOKIE_NAME,
    "",
    sessionCookieOptions(0),
  );
  return response;
}
