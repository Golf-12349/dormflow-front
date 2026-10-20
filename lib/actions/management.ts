"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { API_BASE_URL, ApiError, apiRequest } from "@/lib/api/client";
import { MANAGEMENT_CREATE_FIELDS, MANAGEMENT_OPERATION_FIELDS, MANAGEMENT_UPDATE_FIELDS, type ManagementField } from "@/lib/management-workflows";
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
  contracts: ["activate", "terminate"],
  reservations: ["cancel"],
  payments: ["confirm", "refund"],
  deposits: ["refund"],
  "maintenance-requests": ["assign", "status"],
  parcels: ["pickup"],
  visitors: ["checkout"],
  parking: ["release"],
  announcements: ["publish", "archive"],
  notifications: ["read"],
  users: ["status", "roles"],
  roles: ["permissions", "delete"],
};

const RESOURCE_GROUPS: Record<string, string> = {
  organizations: "properties",
  dormitories: "properties",
  buildings: "properties",
  floors: "properties",
  "room-types": "properties",
  contracts: "residents",
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
  await verifySession();
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
        await apiRequest(endpoint, { method: "POST", body });
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
      } else if (operation === "activate" || operation === "cancel" || operation === "confirm" || operation === "checkout" || operation === "release" || operation === "publish" || operation === "archive" || operation === "read") {
        await apiRequest(`${itemPath}/${operation === "read" ? "read" : operation}`, { method: "POST" });
      } else if (operation === "terminate") {
        await apiRequest(`${itemPath}/terminate`, { method: "POST", body: { reason: String(formData.get("reason") ?? "").trim() || null } });
      } else if (operation === "refund") {
        if (resource === "deposits") {
          const refundAmount = Number(formData.get("refundAmount"));
          if (!Number.isFinite(refundAmount) || refundAmount <= 0) throw new Error(t.management.workflows.required);
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
    if (resource === "users") revalidatePath("/settings");
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
