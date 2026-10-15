import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { ManagementRecordsTable } from "@/components/management/management-records-table";
import { getManagementRecords } from "@/lib/api/management";
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
}: {
  params: Promise<{ group: string; resource: string }>;
}) {
  const { group: groupSlug, resource } = await params;
  const result = getManagementModule(groupSlug, resource);
  if (!result) notFound();

  let records;
  let apiError: ApiError | undefined;
  try {
    records = await getManagementRecords(result.module);
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
      group={result.group}
      module={result.module}
      records={records}
    />
  );
}
