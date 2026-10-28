import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { ManagementRecordsTable } from "@/components/management/management-records-table";
import {
  getAnalyticsOverview,
  getDetailReportRecords,
  getManagementLookupOptions,
  getManagementRecords,
  getOutstandingInvoiceRecords,
  getUnreadNotificationCount,
} from "@/lib/api/management";
import { ApiError } from "@/lib/api/client";
import { t } from "@/lib/i18n";
import {
  MANAGEMENT_GROUPS,
  getManagementModule,
} from "@/lib/management";

export function generateStaticParams() {
  return MANAGEMENT_GROUPS.flatMap((group) =>
    group.modules
      .filter((module) => !module.href)
      .map((module) => ({ group: group.slug, resource: module.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string; resource: string }>;
}): Promise<Metadata> {
  const { group, resource } = await params;
  const result = getManagementModule(group, resource);
  return { title: result?.module.title ?? "Management" };
}

export default async function ManagementModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ group: string; resource: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { group: groupSlug, resource } = await params;
  const result = getManagementModule(groupSlug, resource);
  if (!result) notFound();

  let records;
  let outstandingRecords;
  let detailReportRecords;
  let analyticsOverview;
  let unreadNotificationCount: number | undefined;
  let lookupOptions;
  const filters = await searchParams;
  const fromValue = filters?.periodFrom;
  const toValue = filters?.periodTo;
  const detailReportParam = typeof filters?.detailReport === "string"
    ? filters.detailReport
    : "expenses";
  const validDate = (value: string | string[] | undefined): value is string =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
    (() => {
      const [year, month, day] = value.split("-").map(Number);
      const parsed = new Date(Date.UTC(year, month - 1, day));
      return parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day;
    })();
  const now = new Date();
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)).toISOString().slice(0, 10);
  const reportPeriod = {
    periodFrom: validDate(fromValue) ? fromValue : defaultFrom,
    periodTo: validDate(toValue) ? toValue : defaultTo,
    detailReport: ["revenue", "expenses", "occupancy", "payments", "aging"].includes(detailReportParam)
      ? detailReportParam
      : "expenses",
  };
  let apiError: ApiError | undefined;
  try {
    if (result.module.slug === "reports") {
      [records, outstandingRecords, analyticsOverview, detailReportRecords] = await Promise.all([
        getManagementRecords(result.module, {
          periodFrom: reportPeriod.periodFrom,
          periodTo: reportPeriod.periodTo,
        }),
        getOutstandingInvoiceRecords(),
        getAnalyticsOverview(reportPeriod.periodFrom, reportPeriod.periodTo),
        getDetailReportRecords(
          reportPeriod.detailReport,
          reportPeriod.periodFrom,
          reportPeriod.periodTo,
        ),
      ]);
    } else if (result.module.slug === "notifications") {
      [records, lookupOptions, unreadNotificationCount] = await Promise.all([
        getManagementRecords(result.module),
        getManagementLookupOptions(result.module.slug),
        getUnreadNotificationCount(),
      ]);
    } else {
      [records, lookupOptions] = await Promise.all([
        getManagementRecords(result.module),
        getManagementLookupOptions(result.module.slug),
      ]);
    }
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    apiError = error;
  }

  if (apiError) {
    return (
      <section className="space-y-6">
        <Link
          href={`/management/${result.group.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {result.group.title}
        </Link>
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">
              {t.management.table.unableToLoad(result.module.title)}
            </h2>
            <p className="mt-1 text-sm">{apiError.message}</p>
            {apiError.traceId ? (
              <p className="mt-2 font-mono text-xs text-rose-700">
                {t.management.table.errorReference}: {apiError.traceId}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (!records) throw new Error("Management records were not loaded.");

  return (
    <ManagementRecordsTable
      group={{
        slug: result.group.slug,
        title: result.group.title,
      }}
      module={{
        slug: result.module.slug,
        title: result.module.title,
        description: result.module.description,
      }}
      records={records}
      relatedRecords={outstandingRecords}
      detailReportRecords={detailReportRecords}
      analyticsOverview={analyticsOverview}
      unreadNotificationCount={unreadNotificationCount}
      reportPeriod={reportPeriod}
      lookupOptions={lookupOptions}
    />
  );
}
