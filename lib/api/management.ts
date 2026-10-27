import "server-only";

import { apiRequest } from "@/lib/api/client";
import type { ManagementModule } from "@/lib/management";
import {
  MANAGEMENT_CREATE_FIELDS,
  MANAGEMENT_OPERATIONS,
  MANAGEMENT_OPERATION_FIELDS,
  type ManagementSelectOption,
} from "@/lib/management-workflows";

interface PagedResponse {
  items?: unknown[];
  page?: number;
  totalPages?: number;
  totalCount?: number;
}

export interface ManagementRecords {
  items: Record<string, unknown>[];
  totalCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) return [value];
  return [];
}

function queryFor(module: ManagementModule): Record<string, string | number> {
  if (module.slug !== "reports") return module.query ?? {};

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const from = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 11, 1));
  return {
    periodFrom: from.toISOString().slice(0, 10),
    periodTo: monthStart.toISOString().slice(0, 10),
  };
}

async function enrichSubResourceItems(
  resourceSlug: string,
  items: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  if (items.length === 0) return items;

  if (resourceSlug === "contracts") {
    const settled = await Promise.allSettled(
      items.map(async (item) => {
        const id = str(item.id);
        if (!id) return item;
        const renewals = await apiRequest<
          Array<{
            id: string;
            previousEndDate: string;
            newEndDate: string;
            previousRent: number;
            newRent: number;
          }>
        >(`/contracts/${encodeURIComponent(id)}/renewals`, {
          cache: "no-store",
        });
        const summary = Array.isArray(renewals) && renewals.length > 0
          ? renewals
              .map((r) => `${r.previousEndDate} → ${r.newEndDate}`)
              .join(", ")
          : "—";
        return { ...item, renewals: summary };
      }),
    );
    return settled.map((result, idx) =>
      result.status === "fulfilled" ? result.value : items[idx],
    );
  }

  if (resourceSlug === "invoices") {
    const settled = await Promise.allSettled(
      items.map(async (item) => {
        const id = str(item.id);
        if (!id) return item;
        const charges = await apiRequest<
          Array<{ id: string; description: string; amount: number }>
        >(`/invoices/${encodeURIComponent(id)}/charges`, {
          cache: "no-store",
        });
        const summary = Array.isArray(charges) && charges.length > 0
          ? charges.map((c) => `${c.description} (${c.amount})`).join(", ")
          : "—";
        return { ...item, charges: summary };
      }),
    );
    return settled.map((result, idx) =>
      result.status === "fulfilled" ? result.value : items[idx],
    );
  }

  if (resourceSlug === "maintenance-requests") {
    const settled = await Promise.allSettled(
      items.map(async (item) => {
        const id = str(item.id);
        if (!id) return item;
        const timeline = await apiRequest<
          Array<{ id: string; status: string; note: string; createdAt: string }>
        >(`/maintenance-requests/${encodeURIComponent(id)}/timeline`, {
          cache: "no-store",
        });
        const summary = Array.isArray(timeline) && timeline.length > 0
          ? timeline
              .map((entry) =>
                entry.note ? `${entry.status}: ${entry.note}` : entry.status,
              )
              .join(" | ")
          : "—";
        return { ...item, timelineHistory: summary };
      }),
    );
    return settled.map((result, idx) =>
      result.status === "fulfilled" ? result.value : items[idx],
    );
  }

  return items;
}

export async function getManagementRecords(
  module: ManagementModule,
  queryOverrides: Record<string, string> = {},
): Promise<ManagementRecords> {
  const query = { ...queryFor(module), ...(module.slug === "reports" ? queryOverrides : {}) };
  const first = await apiRequest<unknown>(module.endpoint, {
    query: { page: 1, pageSize: 100, ...query },
    cache: "no-store",
  });

  if (Array.isArray(first) || !isRecord(first) || !Array.isArray(first.items)) {
    const rawItems = toRecords(first);
    const items = await enrichSubResourceItems(module.slug, rawItems);
    return { items, totalCount: items.length };
  }

  const firstPage = first as PagedResponse;
  const rawItems = toRecords(firstPage.items);
  const totalPages = Math.max(1, firstPage.totalPages ?? 1);
  const totalCount = firstPage.totalCount ?? rawItems.length;

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await apiRequest<PagedResponse>(module.endpoint, {
      query: { page, pageSize: 100, ...query },
      cache: "no-store",
    });
    rawItems.push(...toRecords(result.items));
  }

  const items = await enrichSubResourceItems(module.slug, rawItems);
  return { items, totalCount };
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await apiRequest<{ unreadCount?: number }>(
      "/notifications/unread-count",
      { cache: "no-store" },
    );
    return typeof response?.unreadCount === "number" ? response.unreadCount : 0;
  } catch {
    return 0;
  }
}

export interface AnalyticsOverview {
  revenue: number;
  expenses: number;
  netOperatingCash: number;
  outstanding: number;
  expiringContracts: number;
}

export async function getAnalyticsOverview(
  from: string,
  to: string,
): Promise<AnalyticsOverview | null> {
  try {
    return await apiRequest<AnalyticsOverview>("/analytics", {
      query: { from, to },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function getDetailReportRecords(
  report: string,
  from: string,
  to: string,
): Promise<ManagementRecords> {
  const allowed = ["revenue", "expenses", "occupancy", "payments", "aging"];
  const safeReport = allowed.includes(report) ? report : "revenue";
  try {
    const payload = await apiRequest<unknown>(
      `/reports/detail/${encodeURIComponent(safeReport)}`,
      {
        query: { from, to },
        cache: "no-store",
      },
    );
    const items = toRecords(payload);
    return { items, totalCount: items.length };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

export async function getOutstandingInvoiceRecords(): Promise<ManagementRecords> {
  const first = await apiRequest<unknown>("/reports/outstanding-invoices", {
    query: { page: 1, pageSize: 100 },
    cache: "no-store",
  });
  if (Array.isArray(first) || !isRecord(first) || !Array.isArray(first.items)) {
    const items = toRecords(first);
    return { items, totalCount: items.length };
  }

  const page = first as PagedResponse;
  const items = toRecords(page.items);
  const totalPages = Math.max(1, page.totalPages ?? 1);
  for (let current = 2; current <= totalPages; current += 1) {
    const result = await apiRequest<PagedResponse>("/reports/outstanding-invoices", {
      query: { page: current, pageSize: 100 },
      cache: "no-store",
    });
    items.push(...toRecords(result.items));
  }
  return { items, totalCount: page.totalCount ?? items.length };
}

async function fetchLookupItems(endpoint: string): Promise<Record<string, unknown>[]> {
  try {
    const payload = await apiRequest<unknown>(endpoint, {
      query: { page: 1, pageSize: 200 },
      cache: "no-store",
    });
    if (Array.isArray(payload)) return toRecords(payload);
    if (isRecord(payload) && Array.isArray(payload.items)) {
      return toRecords(payload.items);
    }
    return [];
  } catch {
    return [];
  }
}

function str(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

const LOOKUP_RESOLVERS: Record<
  string,
  () => Promise<ManagementSelectOption[]>
> = {
  organizationId: async () => {
    const items = await fetchLookupItems("/organizations");
    return items
      .filter((item) => str(item.id))
      .map((item) => ({
        value: str(item.id),
        label: [str(item.code), str(item.name)].filter(Boolean).join(" — ") || str(item.id),
      }));
  },
  dormitoryId: async () => {
    const items = await fetchLookupItems("/dormitories");
    return items
      .filter((item) => str(item.id))
      .map((item) => ({
        value: str(item.id),
        label: [str(item.code), str(item.name)].filter(Boolean).join(" — ") || str(item.id),
      }));
  },
  buildingId: async () => {
    const items = await fetchLookupItems("/buildings");
    return items
      .filter((item) => str(item.id))
      .map((item) => ({
        value: str(item.id),
        label: [str(item.code), str(item.name)].filter(Boolean).join(" — ") || str(item.id),
      }));
  },
  roomId: async () => {
    const items = await fetchLookupItems("/rooms");
    return items
      .filter((item) => str(item.id))
      .map((item) => {
        const meta = [str(item.floorName), str(item.roomTypeName)].filter(Boolean).join(" · ");
        return {
          value: str(item.id),
          label: meta ? `${str(item.roomNumber)} (${meta})` : str(item.roomNumber) || str(item.id),
        };
      });
  },
  tenantId: async () => {
    const items = await fetchLookupItems("/tenants");
    return items
      .filter((item) => str(item.id))
      .map((item) => {
        const name = `${str(item.firstName)} ${str(item.lastName)}`.trim();
        const phone = str(item.phone);
        return {
          value: str(item.id),
          label: phone ? `${name} (${phone})` : name || str(item.id),
        };
      });
  },
  contractId: async () => {
    const items = await fetchLookupItems("/contracts");
    return items
      .filter((item) => str(item.id))
      .map((item) => {
        const num = str(item.contractNumber) || str(item.id).slice(0, 8);
        const dates = [str(item.startDate), str(item.endDate)].filter(Boolean).join(" → ");
        return {
          value: str(item.id),
          label: dates ? `${num} (${dates})` : num,
        };
      });
  },
  invoiceId: async () => {
    const items = await fetchLookupItems("/invoices");
    return items
      .filter((item) => str(item.id))
      .map((item) => {
        const inv = str(item.invoiceNumber) || str(item.id).slice(0, 8);
        const period = str(item.periodMonth).slice(0, 7);
        return {
          value: str(item.id),
          label: period ? `${inv} (${period})` : inv,
        };
      });
  },
  paymentId: async () => {
    const items = await fetchLookupItems("/payments");
    return items
      .filter((item) => str(item.id))
      .map((item) => {
        const ref = str(item.referenceNumber) || str(item.id).slice(0, 8);
        const amount = str(item.amount);
        return {
          value: str(item.id),
          label: amount ? `${ref} (${amount})` : ref,
        };
      });
  },
  reservationId: async () => {
    const items = await fetchLookupItems("/reservations");
    return items
      .filter((item) => str(item.id))
      .map((item) => ({
        value: str(item.id),
        label: `${str(item.id).slice(0, 8)} (${str(item.moveInDate) || str(item.status)})`,
      }));
  },
  maintenanceRequestId: async () => {
    const items = await fetchLookupItems("/maintenance-requests");
    return items
      .filter((item) => str(item.id))
      .map((item) => ({
        value: str(item.id),
        label: [str(item.title), str(item.status)].filter(Boolean).join(" — ") || str(item.id),
      }));
  },
  recipientUserId: async () => {
    const items = await fetchLookupItems("/users");
    return items
      .filter((item) => str(item.id))
      .map((item) => {
        const name = `${str(item.firstName)} ${str(item.lastName)}`.trim();
        const email = str(item.email);
        return {
          value: str(item.id),
          label: email ? `${name} (${email})` : name || str(item.id),
        };
      });
  },
  technicianId: async () => {
    const items = await fetchLookupItems("/users");
    const technicians = items.filter(
      (item) =>
        Array.isArray(item.roles) &&
        item.roles.some((role) => String(role).toLowerCase() === "technician"),
    );
    const source = technicians.length > 0 ? technicians : items;
    return source
      .filter((item) => str(item.id))
      .map((item) => {
        const name = `${str(item.firstName)} ${str(item.lastName)}`.trim();
        const email = str(item.email);
        return {
          value: str(item.id),
          label: email ? `${name} (${email})` : name || str(item.id),
        };
      });
  },
};

export async function getManagementLookupOptions(
  resource: string,
): Promise<Record<string, ManagementSelectOption[]>> {
  const createFields = MANAGEMENT_CREATE_FIELDS[resource] ?? [];
  const operations = MANAGEMENT_OPERATIONS[resource] ?? [];
  const operationFields = operations.flatMap(
    (op) => MANAGEMENT_OPERATION_FIELDS[op] ?? [],
  );
  const neededFieldNames = [
    ...new Set(
      [...createFields, ...operationFields]
        .map((field) => field.name)
        .filter((name) => name in LOOKUP_RESOLVERS),
    ),
  ];

  const entries = await Promise.all(
    neededFieldNames.map(async (fieldName) => {
      const options = await LOOKUP_RESOLVERS[fieldName]();
      return [fieldName, options] as const;
    }),
  );

  return Object.fromEntries(entries);
}
