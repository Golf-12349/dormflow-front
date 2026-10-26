"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { API_BASE_URL, ApiError, apiRequest } from "@/lib/api/client";
import { resolveDefaultOrganizationId } from "@/lib/api/dormflow";
import {
  MANAGEMENT_CREATE_FIELDS,
  MANAGEMENT_OPERATION_FIELDS,
  MANAGEMENT_UPDATE_FIELDS,
  type ManagementField,
} from "@/lib/management-workflows";
import { verifySession } from "@/lib/session";
import { t } from "@/lib/i18n";

export type ManagementActionState = { status: "idle" | "success" | "error"; message: string | null };

const RESOURCE_PATHS: Record<string, string> = {
  organizations: "/organizations",
  dormitories: "/dormitories",
  buildings: "/buildings",
  floors: "/floors",
  "room-types": "/room-types",
  contracts: "/contracts",
  invoices: "/invoices",
  reservations: "/reservations",
  payments: "/payments",
  deposits: "/deposits",
  expenses: "/expenses",
  receipts: "/receipts",
  "maintenance-requests": "/maintenance-requests",
  parcels: "/parcels",
  visitors: "/visitors",
  parking: "/parking",
  announcements: "/announcements",
  notifications: "/notifications",
  users: "/users",
  roles: "/roles",
};

const OPERATION_ALLOWLIST: Record<string, string[]> = {
  organizations: ["status", "delete"],
  dormitories: ["status", "delete"],
  buildings: ["status", "delete"],
  floors: ["status", "delete"],
  "room-types": ["status", "delete"],
  contracts: ["activate", "terminate", "renew"],
  invoices: ["issue", "cancel"],
  reservations: ["confirm", "cancel"],
  payments: ["confirm", "refund"],
  deposits: ["refund"],
  "maintenance-requests": ["assign", "status", "timeline", "cost"],
  parcels: ["pickup", "return"],
  visitors: ["checkout"],
  parking: ["release"],
  announcements: ["publish", "archive", "cancel"],
  notifications: ["read"],
  users: ["status", "roles", "dormitories"],
  roles: ["permissions", "delete"],
};

const RESOURCE_GROUPS: Record<string, string> = {
  organizations: "properties",
  dormitories: "properties",
  buildings: "properties",
  floors: "properties",
  "room-types": "properties",
  contracts: "residents",
  invoices: "finance",
  reservations: "residents",
  payments: "finance",
  deposits: "finance",
  expenses: "finance",
  receipts: "finance",
  "maintenance-requests": "services",
  parcels: "services",
  visitors: "services",
  parking: "services",
  announcements: "services",
  notifications: "services",
  users: "administration",
  roles: "administration",
};

function fieldValue(formData: FormData, field: ManagementField): unknown {
  const raw = String(formData.get(field.name) ?? "").trim();
  if (!raw) return undefined;
  if (field.type === "number") {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) throw new Error(t.management.workflows.required);
    return parsed;
  }
  if (field.array || field.name === "roles" || field.name === "permissions" || field.name === "targetRoles") {
    return raw.split(/[,\n]/u).map((item) => item.trim()).filter(Boolean);
  }
  if (field.name === "paymentDate" || field.name === "expiresAt") {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) throw new Error(t.management.workflows.required);
    return parsed.toISOString();
  }
  return raw;
}

function createBody(formData: FormData, fields: ManagementField[]) {
  const body: Record<string, unknown> = {};
  for (const field of fields) {
    const value = fieldValue(formData, field);
    if (field.required && (value === undefined || value === "")) {
      throw new Error(t.management.workflows.required);
    }
    if (value !== undefined) {
      const key = field.name[0].toLowerCase() + field.name.slice(1);
      body[key] = value;
    }
  }
  return body;
}

function apiMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || t.management.workflows.failure;
  if (error instanceof Error) return error.message;
  return t.management.workflows.failure;
}

function errorState(error: unknown): ManagementActionState {
  return { status: "error", message: apiMessage(error) };
}

export async function managementAction(
  _previous: ManagementActionState,
  formData: FormData,
): Promise<ManagementActionState> {
  const session = await verifySession();
  const resource = String(formData.get("resource") ?? "");
  const operation = String(formData.get("operation") ?? "");
  const endpoint = RESOURCE_PATHS[resource];
  if (!endpoint) return { status: "error", message: t.management.workflows.failure };

  try {
    if (operation === "create" || operation === "update") {
      const fields = operation === "create"
        ? MANAGEMENT_CREATE_FIELDS[resource]
        : MANAGEMENT_UPDATE_FIELDS[resource];
      if (!fields) return { status: "error", message: t.management.workflows.failure };
      const body = createBody(formData, fields);
      if (operation === "create") {
        if (
          fields.some((field) => field.name === "organizationId") &&
          !body.organizationId
        ) {
          const fallbackOrgId = await resolveDefaultOrganizationId(
            session.user.organizationId,
          );
          if (fallbackOrgId) {
            body.organizationId = fallbackOrgId;
          }
        }
        const created = await apiRequest<{ id?: string; organizationId?: string }>(endpoint, {
          method: "POST",
          body,
        });
        if (resource === "users" && created?.id) {
          try {
            const dormPage = await apiRequest<{ items?: Array<{ id: string; organizationId: string }> }>(
              "/dormitories",
              { query: { page: 1, pageSize: 50 }, cache: "no-store" },
            );
            const matchingDorms = (dormPage?.items ?? []).filter(
              (dorm) => !created.organizationId || dorm.organizationId === created.organizationId,
            );
            for (const [index, dorm] of matchingDorms.entries()) {
              await apiRequest(`/users/${encodeURIComponent(created.id)}/dormitories`, {
                method: "POST",
                body: { dormitoryId: dorm.id, isPrimary: index === 0 },
              });
            }
          } catch {
            // Best-effort dormitory assignment for new user.
          }
        }
      } else {
        const id = String(formData.get("recordId") ?? "");
        if (!/^[0-9a-f-]{36}$/iu.test(id)) throw new Error(t.management.workflows.failure);
        await apiRequest(`${endpoint}/${encodeURIComponent(id)}`, { method: "PUT", body });
      }
    } else {
      if (!OPERATION_ALLOWLIST[resource]?.includes(operation)) {
        return { status: "error", message: t.management.workflows.failure };
      }
      const id = String(formData.get("recordId") ?? "");
      if (!/^[0-9a-f-]{36}$/iu.test(id)) throw new Error(t.management.workflows.failure);
      const itemPath = `${endpoint}/${encodeURIComponent(id)}`;

      if (operation === "delete") {
        await apiRequest(itemPath, { method: "DELETE" });
      } else if (operation === "status") {
        const status = String(formData.get("status") ?? "");
        const allowed = resource === "maintenance-requests"
          ? ["Reported", "Assigned", "InProgress", "Completed", "Cancelled"]
          : resource === "organizations"
            ? ["Active", "Inactive", "Suspended"]
            : ["Active", "Inactive"];
        if (!allowed.includes(status)) throw new Error(t.management.workflows.failure);
        await apiRequest(`${itemPath}/status`, { method: "PATCH", body: { status } });
      } else if (
        operation === "activate" ||
        operation === "cancel" ||
        operation === "confirm" ||
        operation === "checkout" ||
        operation === "release" ||
        operation === "publish" ||
        operation === "archive" ||
        operation === "read" ||
        operation === "return" ||
        operation === "issue"
      ) {
        await apiRequest(`${itemPath}/${operation === "read" ? "read" : operation}`, { method: "POST" });
      } else if (operation === "renew") {
        const endDate = String(formData.get("endDate") ?? "").trim();
        const monthlyRent = formData.get("monthlyRent") ? Number(formData.get("monthlyRent")) : null;
        const waterRatePerUnit = formData.get("waterRatePerUnit") ? Number(formData.get("waterRatePerUnit")) : null;
        const electricityRatePerUnit = formData.get("electricityRatePerUnit") ? Number(formData.get("electricityRatePerUnit")) : null;
        await apiRequest(`${itemPath}/renew`, {
          method: "POST",
          body: {
            endDate,
            monthlyRent,
            waterRatePerUnit,
            electricityRatePerUnit,
          },
        });
      } else if (operation === "timeline") {
        const note = String(formData.get("note") ?? "").trim();
        if (!note) throw new Error(t.management.workflows.required);
        await apiRequest(`${itemPath}/timeline`, {
          method: "POST",
          body: { note },
        });
      } else if (operation === "cost") {
        const amount = Number(formData.get("amount"));
        const description = String(formData.get("description") ?? "").trim();
        if (!Number.isFinite(amount) || amount <= 0 || !description) {
          throw new Error(t.management.workflows.required);
        }
        await apiRequest(`${itemPath}/costs`, {
          method: "POST",
          body: { amount, description },
        });
      } else if (operation === "terminate") {
        await apiRequest(`${itemPath}/terminate`, { method: "POST", body: { reason: String(formData.get("reason") ?? "").trim() || null } });
      } else if (operation === "refund") {
        if (resource === "deposits") {
          const rawRefund = String(formData.get("refundAmount") ?? "").trim();
          const refundAmount = rawRefund === "" ? 0 : Number(rawRefund);
          if (!Number.isFinite(refundAmount) || refundAmount < 0) throw new Error(t.management.workflows.required);
          await apiRequest(`${itemPath}/refund`, {
            method: "POST",
            body: {
              refundAmount,
              deductionReason: String(formData.get("deductionReason") ?? "").trim() || null,
            },
          });
        } else {
          await apiRequest(`${itemPath}/refund`, {
            method: "POST",
            body: { reason: String(formData.get("reason") ?? "").trim() || null },
          });
        }
      } else if (operation === "assign") {
        await apiRequest(`${itemPath}/assign`, { method: "POST", body: createBody(formData, MANAGEMENT_OPERATION_FIELDS.assign) });
      } else if (operation === "dormitories") {
        const dormitoryId = String(formData.get("dormitoryId") ?? "").trim();
        if (!dormitoryId) throw new Error(t.management.workflows.required);
        await apiRequest(`${itemPath}/dormitories`, {
          method: "POST",
          body: { dormitoryId, isPrimary: true },
        });
      } else if (operation === "pickup") {
        await apiRequest(`${itemPath}/pickup`, { method: "POST", body: { pickedUpByName: String(formData.get("pickedUpByName") ?? "").trim() || null } });
      } else if (operation === "roles" || operation === "permissions") {
        const values = String(formData.get(operation) ?? "").split(/[,\n]/u).map((value) => value.trim()).filter(Boolean);
        if (values.length === 0) throw new Error(t.management.workflows.required);
        const suffix = operation === "roles" ? "roles" : "permissions";
        await apiRequest(`${itemPath}/${suffix}`, {
          method: "POST",
          body: { [operation]: values },
        });
      }
    }

    revalidatePath(`/management/${RESOURCE_GROUPS[resource]}/${resource}`);
    revalidatePath("/management");
    revalidatePath("/dashboard");
    revalidatePath("/rooms");
    revalidatePath("/tenants");
    revalidatePath("/billing");
    revalidatePath("/settings");
    return { status: "success", message: t.management.workflows.success };
  } catch (error) {
    unstable_rethrow(error);
    return errorState(error);
  }
}

export async function exportManagementReportAction(
  _previous: ManagementActionState,
  formData: FormData,
): Promise<ManagementActionState> {
  const session = await verifySession();
  const report = String(formData.get("report") ?? "");
  const periodFrom = String(formData.get("periodFrom") ?? "");
  const periodTo = String(formData.get("periodTo") ?? "");
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  };
  if (
    !["revenue", "outstanding-invoices"].includes(report) ||
    !validDate(periodFrom) ||
    !validDate(periodTo) ||
    periodFrom > periodTo
  ) {
    return { status: "error", message: t.management.workflows.required };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${report}/export?periodFrom=${encodeURIComponent(periodFrom)}&periodTo=${encodeURIComponent(periodTo)}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(t.management.workflows.failure);
    const csv = await response.text();
    return { status: "success", message: csv };
  } catch (error) {
    unstable_rethrow(error);
    return errorState(error);
  }
}
