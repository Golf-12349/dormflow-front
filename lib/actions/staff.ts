"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { ApiError, apiRequest } from "@/lib/api/client";
import { resolveDefaultOrganizationId } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";
import { verifySession } from "@/lib/session";

const MANAGEABLE_ROLES = [
  "Owner",
  "DormManager",
  "Accountant",
  "Staff",
  "Technician",
] as const;

type StaffRole = (typeof MANAGEABLE_ROLES)[number];
type StaffActionState = { status: "idle" | "success" | "error"; message: string | null };

function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function apiFailureMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return t.settings.staff.sessionExpired;
  }
  if (error instanceof ApiError && error.status === 403) {
    return t.settings.staff.permissionError;
  }

  if (error instanceof Error && error.message) return error.message;
  return t.settings.staff.loadError;
}

function actionError(error: unknown): StaffActionState {
  return { status: "error", message: apiFailureMessage(error) };
}

function selectedRoles(formData: FormData): StaffRole[] | null {
  const roles = formData.getAll("roles").map(String);
  if (roles.length === 0 || roles.some((role) => !MANAGEABLE_ROLES.includes(role as StaffRole))) {
    return null;
  }
  return [...new Set(roles)] as StaffRole[];
}

export async function createStaffAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await verifySession();

  const firstName = readField(formData, "firstName");
  const lastName = readField(formData, "lastName");
  const email = readField(formData, "email").toLowerCase();
  const phone = readField(formData, "phone") || null;
  const password = String(formData.get("password") ?? "");
  const role = readField(formData, "role");

  if (!firstName || !lastName || !email || !password || !role) {
    return { status: "error", message: t.settings.staff.validationError };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    return { status: "error", message: t.auth.errors.emailInvalid };
  }
  if (
    password.length < 8 ||
    !/[a-z]/u.test(password) ||
    !/[A-Z]/u.test(password) ||
    !/\d/u.test(password)
  ) {
    return { status: "error", message: t.settings.staff.passwordHint };
  }
  if (!MANAGEABLE_ROLES.includes(role as StaffRole)) {
    return { status: "error", message: t.settings.staff.permissionError };
  }

  const organizationId = await resolveDefaultOrganizationId(
    readField(formData, "organizationId") || session.user.organizationId,
  );

  let user: { id: string; organizationId?: string };
  try {
    const body: Record<string, unknown> = {
      firstName,
      lastName,
      email,
      password,
      phone,
    };
    if (organizationId) {
      body.organizationId = organizationId;
    }
    user = await apiRequest<{ id: string; organizationId?: string }>("/users", {
      method: "POST",
      body,
    });
  } catch (error) {
    unstable_rethrow(error);
    return actionError(error);
  }

  try {
    await apiRequest(`/users/${encodeURIComponent(user.id)}/roles`, {
      method: "POST",
      body: { roles: [role] },
    });
  } catch (error) {
    unstable_rethrow(error);
    revalidatePath("/settings");
    return { status: "error", message: t.settings.staff.partialRoleFailure };
  }

  try {
    const dormPage = await apiRequest<{ items?: Array<{ id: string; organizationId: string }> }>(
      "/dormitories",
      { query: { page: 1, pageSize: 50 }, cache: "no-store" },
    );
    const targetOrgId = user.organizationId ?? organizationId;
    const matchingDorms = (dormPage?.items ?? []).filter(
      (dorm) => !targetOrgId || dorm.organizationId === targetOrgId,
    );
    for (const [index, dorm] of matchingDorms.entries()) {
      await apiRequest(`/users/${encodeURIComponent(user.id)}/dormitories`, {
        method: "POST",
        body: { dormitoryId: dorm.id, isPrimary: index === 0 },
      });
    }
  } catch {
    // Best-effort dormitory assignment so staff/technicians can access their dorms immediately.
  }

  revalidatePath("/settings");
  return { status: "success", message: t.settings.staff.createSuccess };
}

export async function assignStaffRolesAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await verifySession();
  const userId = readField(formData, "userId");
  const roles = selectedRoles(formData);
  if (!userId || !roles) {
    return { status: "error", message: t.settings.staff.permissionError };
  }
  if (userId === session.user.id) {
    return { status: "error", message: t.settings.staff.cannotModifySelf };
  }

  try {
    await apiRequest(`/users/${encodeURIComponent(userId)}/roles`, {
      method: "POST",
      body: { roles },
    });
    revalidatePath("/settings");
    return { status: "success", message: t.settings.staff.updateSuccess };
  } catch (error) {
    unstable_rethrow(error);
    return actionError(error);
  }
}

export async function updateStaffProfileAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await verifySession();
  const userId = readField(formData, "userId");
  const firstName = readField(formData, "firstName");
  const lastName = readField(formData, "lastName");
  const phone = readField(formData, "phone") || null;

  if (!userId || !firstName || !lastName) {
    return { status: "error", message: t.settings.staff.validationError };
  }

  try {
    await apiRequest(`/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      body: { firstName, lastName, phone },
    });
    revalidatePath("/settings");
    return { status: "success", message: t.settings.staff.updateSuccess };
  } catch (error) {
    unstable_rethrow(error);
    return actionError(error);
  }
}

export async function changeStaffStatusAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await verifySession();
  const userId = readField(formData, "userId");
  const status = readField(formData, "status");
  if (!userId || (status !== "Active" && status !== "Inactive")) {
    return { status: "error", message: t.settings.staff.permissionError };
  }
  if (userId === session.user.id) {
    return { status: "error", message: t.settings.staff.cannotModifySelf };
  }

  try {
    await apiRequest(`/users/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      body: { status },
    });
    revalidatePath("/settings");
    return { status: "success", message: t.settings.staff.statusSuccess };
  } catch (error) {
    unstable_rethrow(error);
    return actionError(error);
  }
}
