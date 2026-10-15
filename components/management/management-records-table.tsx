import Link from "next/link";
import { ArrowLeft, Database, ExternalLink } from "lucide-react";

import type { ManagementGroup, ManagementModule } from "@/lib/management";
import type { ManagementRecords } from "@/lib/api/management";
import { t } from "@/lib/i18n";

function labelFor(key: string): string {
  const localized = t.management.table.fields[
    key as keyof typeof t.management.table.fields
  ];
  if (localized) return localized;
  return key
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/[_-]/gu, " ")
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") {
    return value ? t.management.table.yes : t.management.table.no;
  }
  if (typeof value === "string") {
    return value.length > 80 ? `${value.slice(0, 77)}...` : value;
  }
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (Array.isArray(value)) return t.management.table.itemCount(value.length);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ManagementRecordsTable({
  group,
  module,
  records,
}: {
  group: ManagementGroup;
  module: ManagementModule;
  records: ManagementRecords;
}) {
  const keys = [...new Set(records.items.flatMap((item) => Object.keys(item)))]
    .filter((key) => !["id", "createdAt", "updatedAt"].includes(key))
    .slice(0, 7);
  const columns = keys.length > 0 ? keys : Object.keys(records.items[0] ?? {}).slice(0, 7);

  return (
    <section className="space-y-6">
      <Link
        href={`/management/${group.slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {group.title}
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
            {module.title}
          </h2>
          <p className="max-w-2xl text-sm text-slate-500">{module.description}</p>
        </div>
        <p className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
          {t.management.table.itemCount(records.totalCount.toLocaleString())}
        </p>
      </header>

      {records.items.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <Database className="size-8 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-800">
            {t.management.table.emptyTitle}
          </p>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {t.management.table.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  {columns.map((key) => (
                    <th key={key} scope="col" className="whitespace-nowrap px-4 py-3">
                      {labelFor(key)}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3">
                    {t.management.table.reference}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.items.map((item, index) => {
                  const recordId =
                    typeof item.id === "string" || typeof item.id === "number"
                      ? String(item.id)
                      : "";
                  return (
                    <tr key={recordId || index} className="transition hover:bg-slate-50/70">
                      {columns.map((key) => (
                        <td key={key} className="max-w-72 px-4 py-3 text-slate-700">
                          <span className="block truncate" title={displayValue(item[key])}>
                            {displayValue(item[key])}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        {recordId ? (
                          <span className="inline-flex max-w-44 items-center gap-1.5 truncate font-mono text-xs text-slate-400" title={recordId}>
                            <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                            {recordId}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {records.totalCount > records.items.length ? (
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              {t.management.table.showing(
                records.items.length.toLocaleString(),
                records.totalCount.toLocaleString(),
              )}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
