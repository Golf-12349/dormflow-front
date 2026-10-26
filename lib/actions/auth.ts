"use server";

/**
 * Authentication Server Actions.
 *
 * Every export of a `'use server'` module must be an async function, so shared
 * values (like the initial form state) live with the form component instead.
 * `redirect()` throws a control-flow exception, therefore it is always called
 * outside of any `try/catch` block.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { t } from "@/lib/i18n";
import {
  ApiError,
  apiRequest,
  apiRequestAnonymous,
} from "@/lib/api/client";
import {
  SESSION_COOKIE_NAME,
  createSession,
  decodeSessionValue,
  sessionCookieOptions,
} from "@/lib/session";
import type { LoginFormState } from "@/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ApiLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    roles: string[];
    organizationId?: string | null;
  };
}

function frontendRole(roles: string[]): "admin" | "manager" | "staff" {
  const normalized = roles.map((role) => role.toLowerCase());
  if (
    normalized.some(
      (role) => role === "superadmin" || role === "owner" || role === "admin",
    )
  ) {
    return "admin";
  }
  if (
    normalized.some((role) => role === "manager" || role === "dormmanager")
  ) {
    return "manager";
  }
  return "staff";
}

export async function loginAction(
  prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  const fieldErrors: LoginFormState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = t.auth.errors.emailRequired;
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = t.auth.errors.emailInvalid;
  }

  if (!password) {
    fieldErrors.password = t.auth.errors.passwordRequired;
  } else if (password.length < 6) {
    fieldErrors.password = t.auth.errors.passwordTooShort;
  }

  if (fieldErrors.email || fieldErrors.password) {
    return {
      status: "error",
      message: t.auth.errors.fixFields,
      fieldErrors,
      email,
    };
  }

  let result: ApiLoginResponse;
  try {
    result = await apiRequestAnonymous<ApiLoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) {
      return {
        status: "error",
        message: t.auth.errors.invalidCredentials,
        fieldErrors: {},
        email,
      };
    }

    return {
      status: "error",
      message: error.message,
      fieldErrors: {
        ...(error.errors?.email ? { email: error.errors.email.join(" ") } : {}),
        ...(error.errors?.password
          ? { password: error.errors.password.join(" ") }
          : {}),
      },
      email,
    };
  }

  const normalizedRoles = result.user.roles.map((role) => role.toLowerCase());
  const isSuperAdmin = normalizedRoles.some((role) => role === "superadmin");

  const user = {
    id: result.user.id,
    name: `${result.user.firstName} ${result.user.lastName}`.trim(),
    email: result.user.email,
    phone: result.user.phone ?? "",
    role: frontendRole(result.user.roles),
    isSuperAdmin,
    organizationId: result.user.organizationId ?? null,
    avatarClass: "bg-indigo-500",
  };
  const { value, maxAge } = createSession(user, remember, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpiresAt: result.expiresAt,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, value, sessionCookieOptions(maxAge));

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const session = decodeSessionValue(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );

  if (session?.refreshToken) {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: { refreshToken: session.refreshToken },
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error("DormFlow API logout failed.", error);
      }
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
