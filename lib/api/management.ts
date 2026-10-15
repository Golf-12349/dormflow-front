import "server-only";

import { apiRequest } from "@/lib/api/client";
import type { ManagementModule } from "@/lib/management";

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

export async function getManagementRecords(
  module: ManagementModule,
): Promise<ManagementRecords> {
  const query = queryFor(module);
  const first = await apiRequest<unknown>(module.endpoint, {
    query: { page: 1, pageSize: 100, ...query },
    cache: "no-store",
  });

  if (Array.isArray(first) || !isRecord(first) || !Array.isArray(first.items)) {
    const items = toRecords(first);
    return { items, totalCount: items.length };
  }

  const firstPage = first as PagedResponse;
  const items = toRecords(firstPage.items);
  const totalPages = Math.max(1, firstPage.totalPages ?? 1);
  const totalCount = firstPage.totalCount ?? items.length;

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await apiRequest<PagedResponse>(module.endpoint, {
      query: { page, pageSize: 100, ...query },
      cache: "no-store",
    });
    items.push(...toRecords(result.items));
  }

  return { items, totalCount };
}
