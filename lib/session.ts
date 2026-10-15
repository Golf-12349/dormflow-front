/**
 * Session layer for the admin console.
 *
 * The backend does not exist yet, so the "session" is an httpOnly cookie that
 * carries a base64url-encoded JSON payload. Everything the UI needs is behind
 * the helpers below, which means swapping in a real session provider (or an
 * encrypted JWT) later is a change to this file only.
 *
 * Only import this module from Server Components, Server Actions, Route
 * Handlers or Proxy — it reads and writes cookies through `next/headers`.
 */

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AdminUser, AuthSession } from "@/types";

export const SESSION_COOKIE_NAME = "dms_session";

/** 12 hours for a normal shift, 30 days when "remember me" is ticked. */
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 12;
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  } as const;
}

/** Builds the cookie value + max age for a freshly authenticated user. */
export function createSession(
  user: AdminUser,
  remember: boolean,
): { value: string; maxAge: number } {
  const maxAge = remember ? REMEMBER_MAX_AGE_SECONDS : DEFAULT_MAX_AGE_SECONDS;
  const issuedAt = new Date();
  const session: AuthSession = {
    user,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + maxAge * 1000).toISOString(),
  };

  return { value: encodeSessionValue(session), maxAge };
}

/** base64url-encodes a session payload for the `dms_session` cookie. */
export function encodeSessionValue(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

/**
 * Decodes a cookie value defensively: anything malformed or expired is treated
 * as "not signed in" instead of throwing.
 */
export function decodeSessionValue(raw: string | undefined): AuthSession | null {
  if (!raw) return null;

  try {
    const session = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as AuthSession;

    if (!session?.user?.id || !session.expiresAt) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

/** Reads the current session, memoised for one render pass. */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  const cookieStore = await cookies();
  return decodeSessionValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
});

/* -------------------------------------------------------------------------- */
/* API tokens                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The Bearer pair the real backend issues. It rides inside the same
 * `dms_session` cookie as the rest of the session — no second storage
 * mechanism — and stays absent while the mock login is in use.
 */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Reads the token pair from the existing session cookie, when it has one. */
export const getSessionTokens = cache(
  async (): Promise<SessionTokens | null> => {
    const session = await getSession();
    if (!session?.accessToken || !session.refreshToken) return null;

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  },
);

/**
 * Writes a rotated token pair back into the same cookie, keeping the original
 * expiry so a refresh never extends the session.
 *
 * Next only allows cookie writes from a Server Action or a Route Handler, so
 * this throws when it runs during a render. `lib/api/client.ts` therefore treats
 * persistence as best-effort: the retry still uses the fresh in-memory token.
 */
export async function saveSessionTokens(tokens: SessionTokens): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const remainingSeconds = Math.max(
    Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
    0,
  );

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    encodeSessionValue({ ...session, ...tokens }),
    sessionCookieOptions(remainingSeconds),
  );
}

/** Guard for layouts/pages: returns the session or redirects to `/login`. */
export const verifySession = cache(async (): Promise<AuthSession> => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});