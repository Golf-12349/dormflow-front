import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "dms_session";
const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:8080/api/v1").replace(/\/+$/u, "");

interface ApiSession {
  user: Record<string, unknown> & { id: string };
  expiresAt: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  [key: string]: unknown;
}

interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasUserId(value: unknown): value is Record<string, unknown> & { id: string } {
  return isRecord(value) && typeof value.id === "string";
}

function decodeSession(value: string): ApiSession | null {
  try {
    const base64 = value.replace(/-/gu, "+").replace(/_/gu, "/");
    const bytes = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0),
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      !isRecord(parsed) ||
      !hasUserId(parsed.user) ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }
    return {
      ...parsed,
      user: parsed.user,
      expiresAt: parsed.expiresAt,
      ...(typeof parsed.accessToken === "string"
        ? { accessToken: parsed.accessToken }
        : {}),
      ...(typeof parsed.refreshToken === "string"
        ? { refreshToken: parsed.refreshToken }
        : {}),
      ...(typeof parsed.accessTokenExpiresAt === "string"
        ? { accessTokenExpiresAt: parsed.accessTokenExpiresAt }
        : {}),
    };
  } catch {
    return null;
  }
}

function encodeSession(session: ApiSession): string {
  const bytes = new TextEncoder().encode(JSON.stringify(session));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

function isRotatedTokens(value: unknown): value is RotatedTokens {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    typeof value.expiresAt === "string"
  );
}

async function rotateTokens(refreshToken: string): Promise<RotatedTokens | null> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return null;
  }

  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !isRotatedTokens(payload.data)
  ) {
    return null;
  }
  return payload.data;
}

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = cookie ? decodeSession(cookie.value) : null;
  const accessTokenExpiry = session?.accessTokenExpiresAt
    ? Date.parse(session.accessTokenExpiresAt)
    : Number.NaN;

  if (
    !session?.refreshToken ||
    !Number.isFinite(accessTokenExpiry) ||
    accessTokenExpiry > Date.now() + 60_000
  ) {
    return NextResponse.next();
  }

  try {
    const rotated = await rotateTokens(session.refreshToken);
    if (!rotated) return NextResponse.next();

    const updatedSession: ApiSession = {
      ...session,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      accessTokenExpiresAt: rotated.expiresAt,
    };
    const cookieValue = encodeSession(updatedSession);
    const requestHeaders = new Headers(request.headers);
    const cookies = request.cookies
      .getAll()
      .filter((item) => item.name !== SESSION_COOKIE_NAME)
      .map((item) => `${item.name}=${item.value}`);
    cookies.push(`${SESSION_COOKIE_NAME}=${cookieValue}`);
    requestHeaders.set("cookie", cookies.join("; "));

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    const maxAge = Math.max(
      Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000),
      0,
    );
    response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return response;
  } catch (error) {
    console.error("DormFlow API token refresh in proxy failed.", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
