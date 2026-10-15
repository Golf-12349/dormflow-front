/**
 * Shared fetch client for the real Dormitory Management API.
 *
 * **Not wired into the app yet.** Every screen still reads from
 * `lib/mock-data.ts`; the cross-cutting backlog entry in `workflow.md`
 * ("Replace the mock layer with real fetch calls through `lib/api/client.ts`
 * and delete `lib/mock-data.ts`") is what will move the pages onto this client.
 *
 * Conventions baked into this file:
 *  - Base URL from `NEXT_PUBLIC_API_BASE_URL`, falling back to
 *    `http://localhost:5080/api/v1` for local dev.
 *  - Responses are `{ success, message, data?, errors?, traceId? }`. `apiRequest`
 *    unwraps them, so callers receive the payload itself and never touch the
 *    envelope. `data` is legitimately absent on action endpoints
 *    (publish/pickup) and then resolves to `undefined` instead of throwing.
 *  - Failures throw `ApiError`; check `error.errors` for the camelCase
 *    field-level messages a 400 returns.
 *  - `Authorization: Bearer <accessToken>` comes from the existing
 *    `dms_session` cookie (`lib/session.ts`), not from a new store.
 *  - A 401 triggers exactly one silent `POST /auth/refresh-token`, the original
 *    request is retried once with the new access token, and the rotated tokens
 *    are written back through `saveSessionTokens()`. If the refresh fails the
 *    original 401 surfaces, so the Phase 2 guard (`verifySession`) sends the
 *    user to `/login`.
 *  - No 2FA paths: the backend does not support them yet.
 *
 * Native `fetch` on purpose: it is built into the runtime and Next.js extends it
 * with caching/revalidation, so a separate HTTP dependency buys nothing here.
 * Callers still pass the usual `RequestInit` extras (`cache`, `next`, `signal`,
 * …) straight through `ApiRequestOptions`.
 *
 * Server-only: the token lives in an httpOnly cookie that browser JavaScript
 * cannot read, and this module pulls in `next/headers` through `lib/session.ts`,
 * so it must never be imported by a Client Component.
 */

import { getSessionTokens, saveSessionTokens } from "@/lib/session";

/** Default local backend; override it with `NEXT_PUBLIC_API_BASE_URL`. */
const FALLBACK_API_BASE_URL = "http://localhost:5080/api/v1";

/** Refresh endpoint; the only path that is silently retried after a 401. */
const REFRESH_PATH = "/auth/refresh-token";

const DEFAULT_ERROR_MESSAGE = "The API request failed.";
const UNREACHABLE_MESSAGE = "Unable to reach the API.";

/**
 * Every backend response: `{ success, message, data?, errors?, traceId? }`.
 * `data` may be absent on action endpoints, while `null` stays a real payload
 * (e.g. "no such record").
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  /** Field-level validation messages, keyed by camelCase field name. */
  errors?: Record<string, string[]>;
  /** Server-side correlation id, surfaced on `ApiError` for support. */
  traceId?: string;
}

/** Thrown for envelope failures, HTTP errors and transport errors alike. */
export class ApiError extends Error {
  /** HTTP status; `0` means the request never reached the server. */
  readonly status: number;
  /** Field-level validation messages, when the backend sent any. */
  readonly errors?: Record<string, string[]>;
  readonly traceId?: string;

  constructor(
    message: string,
    options: {
      status: number;
      errors?: Record<string, string[]>;
      traceId?: string;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.errors = options.errors;
    this.traceId = options.traceId;
  }
}

/**
 * Payload of `POST /auth/refresh-token`. The server rotates both tokens and
 * invalidates the pair it was given, so the expiries come back with it; only the
 * two tokens are persisted today, through the session cookie.
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
  /** ISO timestamp the new access token expires at. */
  expiresAt: string;
  /** ISO timestamp the new refresh token expires at. */
  refreshTokenExpiresAt: string;
}

/** HTTP methods the API uses. */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** `undefined` query values are skipped entirely. */
type QueryValue = string | number | boolean | undefined;

/**
 * Request options: the HTTP essentials plus whatever `RequestInit` offers
 * (`cache`, `next`, `signal`, `credentials`, …), which passes straight through.
 */
export interface ApiRequestOptions
  extends Omit<RequestInit, "method" | "body" | "headers"> {
  /** Defaults to `GET`. */
  method?: HttpMethod;
  /** Serializable body; sent as JSON. */
  body?: unknown;
  /** Query string values. */
  query?: Record<string, QueryValue>;
  /** Extra headers, merged over the defaults. */
  headers?: Record<string, string>;
}

/** Base URL every request is resolved against. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || FALLBACK_API_BASE_URL;

/** Narrows an unknown payload to the shared response envelope. */
function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { success?: unknown }).success === "boolean"
  );
}

/** Resolves `path` against the base URL, skipping `undefined` query values. */
function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = /^https?:\/\//u.test(path)
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) search.append(key, String(value));
  }

  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/** Reads a body defensively: empty (204) or non-JSON bodies never throw. */
async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Non-JSON (e.g. an HTML error page) — only ever surfaces in the message.
    return text;
  }
}

/** Builds the typed error for a failing response. */
async function toApiError(response: Response): Promise<ApiError> {
  const payload = await readPayload(response);
  const envelope = isEnvelope(payload) ? payload : undefined;
  const fallback =
    typeof payload === "string" && payload.trim()
      ? payload.trim()
      : `Request failed with status ${response.status}.`;

  return new ApiError(envelope?.message || fallback, {
    status: response.status,
    errors: envelope?.errors,
    traceId: envelope?.traceId,
  });
}

/** Returns the payload the caller asked for, or throws the typed `ApiError`. */
async function unwrapResponse<T>(response: Response): Promise<T> {
  const payload = await readPayload(response);

  if (isEnvelope(payload)) {
    if (!payload.success) {
      throw new ApiError(payload.message || DEFAULT_ERROR_MESSAGE, {
        status: response.status,
        errors: payload.errors,
        traceId: payload.traceId,
      });
    }

    // Absent `data` (publish/pickup) resolves to `undefined`, not an error.
    return payload.data as T;
  }

  // Non-enveloped 2xx payloads (files, plain text) pass through untouched.
  return payload as T;
}

/** Sends one request, attaching the session's Bearer token when there is one. */
async function sendRequest(
  path: string,
  options: ApiRequestOptions,
  accessTokenOverride?: string,
): Promise<Response> {
  const { method = "GET", body, query, headers, ...init } = options;

  const requestHeaders: Record<string, string> = { ...headers };

  if (body !== undefined && requestHeaders["Content-Type"] === undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (requestHeaders.Authorization === undefined) {
    // A retried call already carries the token that replaced the expired one:
    // the memoised cookie read can still hand back the stale pair.
    const accessToken =
      accessTokenOverride ?? (await getSessionTokens())?.accessToken;
    if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  try {
    return await fetch(buildUrl(path, query), {
      ...init,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    // An abort stays an abort so callers can tell it from an outage.
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(UNREACHABLE_MESSAGE, { status: 0 });
  }
}

/**
 * Single-flight refresh: concurrent 401s share one rotation, so the backend
 * sees the refresh token exactly once (it invalidates the previous one on use).
 */
let refreshInFlight: Promise<string | null> | null = null;

/** Rotates the token pair; resolves with the new access token, or `null`. */
function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refresh = (async (): Promise<string | null> => {
    const tokens = await getSessionTokens();
    if (!tokens?.refreshToken) return null;

    try {
      // Plain fetch on purpose: this call must not run the 401 handling again.
      const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        cache: "no-store",
      });

      if (!response.ok) return null;

      const payload = await readPayload(response);
      const rotated =
        isEnvelope(payload) && payload.success
          ? (payload.data as RefreshTokenResponse | undefined)
          : undefined;

      // The server rotates the pair, so both tokens must come back.
      if (!rotated?.accessToken || !rotated.refreshToken) return null;

      // Best-effort: Next only allows cookie writes from a Server Action or a
      // Route Handler, so a refresh during a page render still retries the
      // request but cannot persist the rotated pair.
      await saveSessionTokens({
        accessToken: rotated.accessToken,
        refreshToken: rotated.refreshToken,
      }).catch(() => undefined);

      return rotated.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  refreshInFlight = refresh;
  return refresh;
}

/**
 * Makes one API call and resolves with the unwrapped envelope `data`.
 *
 *     const rooms = await apiRequest<Room[]>("/rooms", { query: { floor: 2 } });
 *
 * Every failure is an `ApiError`: `success: false` envelopes, non-2xx responses
 * and transport failures (`status: 0`). A 401 is retried exactly once behind a
 * silent single-flight refresh; when that refresh fails, the original 401 is
 * thrown so the Phase 2 guard can turn it into the `/login` redirect.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await sendRequest(path, options);

  if (response.ok) return unwrapResponse<T>(response);

  if (response.status === 401 && !path.includes(REFRESH_PATH)) {
    const accessToken = await refreshAccessToken();

    if (accessToken) {
      // Exactly one retry, with the token that replaced the expired one.
      const retried = await sendRequest(path, options, accessToken);
      if (retried.ok) return unwrapResponse<T>(retried);
      throw await toApiError(retried);
    }
  }

  throw await toApiError(response);
}
