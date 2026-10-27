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
  verifySession,
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

export type AuthMutationState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/u.test(password) &&
    /[A-Z]/u.test(password) &&
    /\d/u.test(password)
  );
}

export async function changePasswordAction(
  _prevState: AuthMutationState,
  formData: FormData,
): Promise<AuthMutationState> {
  await verifySession();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { status: "error", message: t.auth.errors.passwordRequired };
  }
  if (!isStrongPassword(newPassword)) {
    return { status: "error", message: t.settings.staff.passwordHint };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: t.settings.password.mismatch };
  }

  try {
    await apiRequest("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword, confirmPassword },
    });
    return { status: "success", message: t.settings.password.success };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function forgotPasswordAction(
  _prevState: AuthMutationState,
  formData: FormData,
): Promise<AuthMutationState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { status: "error", message: t.auth.errors.emailRequired };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: t.auth.errors.emailInvalid };
  }

  try {
    await apiRequestAnonymous("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
    return {
      status: "success",
      message:
        "ຫາກມີບັນຊີທີ່ໃຊ້ອີເມວນີ້ຢູ່ໃນລະບົບ ທ່ານຈະໄດ້ຮັບອີເມວສຳລັບຕັ້ງລະຫັດຜ່ານໃໝ່",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}

export async function resetPasswordAction(
  _prevState: AuthMutationState,
  formData: FormData,
): Promise<AuthMutationState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: t.auth.errors.emailInvalid };
  }
  if (!token) {
    return { status: "error", message: t.management.workflows.required };
  }
  if (!isStrongPassword(newPassword)) {
    return { status: "error", message: t.settings.staff.passwordHint };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: t.settings.password.mismatch };
  }

  try {
    await apiRequestAnonymous("/auth/reset-password", {
      method: "POST",
      body: { email, token, newPassword, confirmPassword },
    });
    return {
      status: "success",
      message:
        "ຕັ້ງລະຫັດຜ່ານໃໝ່ສຳເລັດ ກະລຸນາເຂົ້າສູ່ລະບົບດ້ວຍລະຫັດຜ່ານໃໝ່",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}
