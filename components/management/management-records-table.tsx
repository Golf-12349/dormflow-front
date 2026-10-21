import Link from "next/link";
import { ArrowLeft, Database, ExternalLink } from "lucide-react";

import type { ManagementGroup, ManagementModule } from "@/lib/management";
import type { ManagementRecords } from "@/lib/api/management";
import { t } from "@/lib/i18n";
import {
  MANAGEMENT_CREATE_FIELDS,
  MANAGEMENT_OPERATIONS,
  MANAGEMENT_UPDATE_FIELDS,
  managementFieldList,
  type ManagementField,
} from "@/lib/management-workflows";
import {
  ManagementReportExportForm,
  ManagementWorkflowForm,
} from "@/components/management/management-workflow-form";

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
  relatedRecords,
  reportPeriod,
}: {
  group: ManagementGroup;
  module: ManagementModule;
  records: ManagementRecords;
  relatedRecords?: ManagementRecords;
  reportPeriod?: { periodFrom: string; periodTo: string };
}) {
  const createFields = MANAGEMENT_CREATE_FIELDS[module.slug];
  const operations = MANAGEMENT_OPERATIONS[module.slug] ?? [];
  const operationLabels = t.management.workflows as unknown as Record<string, string>;
  const reportToDefault = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  const reportFromDefault = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1)).toISOString().slice(0, 10);
  const periodFrom = reportPeriod?.periodFrom || reportFromDefault;
  const periodTo = reportPeriod?.periodTo || reportToDefault;
  const outstandingColumns = relatedRecords
    ? [...new Set(relatedRecords.items.flatMap((item) => Object.keys(item)))].slice(0, 7)
    : [];
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

      {createFields ? (
        <ManagementWorkflowForm
          resource={module.slug}
          operation="create"
          fields={createFields}
          submitLabel={t.management.workflows.create}
          title={t.management.workflows.formTitle}
        />
      ) : null}
      {module.slug === "reports" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            {t.management.workflows.filter}
          </h3>
          <form
            method="get"
            action={`/management/${group.slug}/${module.slug}`}
            className="mb-5 flex flex-wrap items-end gap-3"
          >
            <label className="text-sm text-slate-700">
              {t.management.workflows.reportFrom}
              <input
                required
                name="periodFrom"
                type="date"
                defaultValue={periodFrom}
                className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              {t.management.workflows.reportTo}
              <input
                required
                name="periodTo"
                type="date"
                defaultValue={periodTo}
                className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              {t.management.workflows.filter}
            </button>
          </form>
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            {t.management.workflows.export}
          </h3>
          <ManagementReportExportForm
            periodFrom={periodFrom}
            periodTo={periodTo}
          />
        </div>
      ) : null}

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
                  <th scope="col" className="px-4 py-3">{t.management.table.reference}</th>
                  {operations.length > 0 || MANAGEMENT_UPDATE_FIELDS[module.slug] ? (
                  <th scope="col" className="px-4 py-3">{t.management.workflows.actions}</th>
                  ) : null}
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
                      {operations.length > 0 || MANAGEMENT_UPDATE_FIELDS[module.slug] ? (
                        <td className="max-w-80 px-4 py-3 align-top">
                          {recordId ? (
                            <div className="flex flex-wrap gap-2">
                              {MANAGEMENT_UPDATE_FIELDS[module.slug] ? (
                                <ManagementWorkflowForm
                                  compact
                                  resource={module.slug}
                                  operation="update"
                                  fields={MANAGEMENT_UPDATE_FIELDS[module.slug]}
                                  recordId={recordId}
                                  values={item}
                                  submitLabel={t.management.workflows.update}
                                />
                              ) : null}
                              {operations.map((operation) => {
                                let fields = managementFieldList(module.slug, operation);
                                if (operation === "status" && module.slug === "maintenance-requests") {
                                  fields = [{
                                    name: "status",
                                    type: "select",
                                    required: true,
                                    options: ["Reported", "Assigned", "InProgress", "Completed", "Cancelled"],
                                  } satisfies ManagementField];
                                } else if (operation === "status") {
                                  fields = [{
                                    name: "status",
                                    type: "select",
                                    required: true,
                                    options: module.slug === "organizations" ? ["Active", "Inactive", "Suspended"] : ["Active", "Inactive"],
                                  } satisfies ManagementField];
                                } else if (operation === "refund" && module.slug === "deposits") {
                                  fields = fields.map((field) => field.name === "refundAmount" ? { ...field, required: true } : field);
                                }
                                return (
                                  <ManagementWorkflowForm
                                    key={operation}
                                    compact
                                    resource={module.slug}
                                    operation={operation}
                                    fields={fields}
                                    recordId={recordId}
                                    submitLabel={operationLabels[operation] ?? operation}
                                  />
                                );
                              })}
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                      ) : null}
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
      {relatedRecords ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{t.management.modules.invoices.title}</h3>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
              {t.management.table.itemCount(relatedRecords.totalCount.toLocaleString())}
            </span>
          </div>
          {relatedRecords.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              {t.management.table.emptyTitle}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    {outstandingColumns.map((key) => (
                      <th key={key} scope="col" className="whitespace-nowrap px-4 py-3">{labelFor(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedRecords.items.map((item, index) => {
                    return (
                      <tr key={String(item.id ?? index)}>
                        {outstandingColumns.map((key) => <td key={key} className="max-w-72 px-4 py-3 text-slate-700">{displayValue(item[key])}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
