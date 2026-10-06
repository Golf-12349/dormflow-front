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
import { authenticateAdmin } from "@/lib/mock-data";
import {
  SESSION_COOKIE_NAME,
  createSession,
  sessionCookieOptions,
} from "@/lib/session";
import type { LoginFormState } from "@/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const user = await authenticateAdmin(email, password);

  if (!user) {
    return {
      status: "error",
      message: t.auth.errors.invalidCredentials,
      fieldErrors: {},
      email,
    };
  }

  const { value, maxAge } = createSession(user, remember);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, value, sessionCookieOptions(maxAge));

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}