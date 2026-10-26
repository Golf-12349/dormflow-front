import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";

import type { ManagementGroup, ManagementModule } from "@/lib/management";
import type { ManagementRecords } from "@/lib/api/management";
import { t } from "@/lib/i18n";
import {
  MANAGEMENT_CREATE_FIELDS,
  MANAGEMENT_OPERATIONS,
  MANAGEMENT_UPDATE_FIELDS,
  managementFieldList,
  type ManagementField,
  type ManagementSelectOption,
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

const RESOLVABLE_FK_KEYS = new Set([
  "roomId",
  "tenantId",
  "dormitoryId",
  "buildingId",
  "floorId",
  "roomTypeId",
  "contractId",
  "invoiceId",
  "paymentId",
  "assignedToUserId",
  "assignedTechnicianId",
]);

function resolveLookupOption(
  key: string,
  value: string,
  lookupOptions?: Record<string, ManagementSelectOption[]>,
): string | null {
  if (!lookupOptions) return null;
  const list =
    lookupOptions[key] ??
    (key === "assignedTechnicianId" ? lookupOptions.assignedToUserId : undefined);
  if (!list) return null;
  return list.find((opt) => opt.value === value)?.label ?? null;
}

function displayValue(
  value: unknown,
  key?: string,
  lookupOptions?: Record<string, ManagementSelectOption[]>,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") {
    return value ? t.management.table.yes : t.management.table.no;
  }
  if (typeof value === "string") {
    if (key) {
      const resolved = resolveLookupOption(key, value, lookupOptions);
      if (resolved) return resolved;
    }
    return value.length > 80 ? `${value.slice(0, 77)}...` : value;
  }
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (Array.isArray(value)) return t.management.table.itemCount(value.length);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isInternalField(
  key: string,
  items: Record<string, unknown>[],
  lookupOptions?: Record<string, ManagementSelectOption[]>,
): boolean {
  if (["id", "organizationId", "createdAt", "updatedAt"].includes(key)) return true;
  if (RESOLVABLE_FK_KEYS.has(key) && lookupOptions) {
    const hasLookup =
      (lookupOptions[key]?.length ?? 0) > 0 ||
      (key === "assignedTechnicianId" &&
        (lookupOptions.assignedToUserId?.length ?? 0) > 0);
    if (hasLookup) return false;
  }
  return items.some((item) => {
    const value = item[key];
    return (
      typeof value === "string" &&
      /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu.test(value)
    );
  });
}

function enrichFields(
  fields: ManagementField[] | undefined,
  lookupOptions?: Record<string, ManagementSelectOption[]>,
): ManagementField[] | undefined {
  if (!fields || !lookupOptions) return fields;
  return fields.map((field) => {
    const selectOptions = lookupOptions[field.name];
    return selectOptions && selectOptions.length > 0
      ? { ...field, selectOptions }
      : field;
  });
}

export function ManagementRecordsTable({
  group,
  module,
  records,
  relatedRecords,
  reportPeriod,
  lookupOptions,
}: {
  group: ManagementGroup;
  module: ManagementModule;
  records: ManagementRecords;
  relatedRecords?: ManagementRecords;
  reportPeriod?: { periodFrom: string; periodTo: string };
  lookupOptions?: Record<string, ManagementSelectOption[]>;
}) {
  const createFields = enrichFields(
    MANAGEMENT_CREATE_FIELDS[module.slug],
    lookupOptions,
  );
  const operations = MANAGEMENT_OPERATIONS[module.slug] ?? [];
  const operationLabels = t.management.workflows as unknown as Record<string, string>;
  const reportToDefault = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  const reportFromDefault = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1)).toISOString().slice(0, 10);
  const periodFrom = reportPeriod?.periodFrom || reportFromDefault;
  const periodTo = reportPeriod?.periodTo || reportToDefault;
  const outstandingColumns = relatedRecords
    ? [...new Set(relatedRecords.items.flatMap((item) => Object.keys(item)))]
        .filter((key) => !isInternalField(key, relatedRecords.items, lookupOptions))
        .slice(0, 8)
    : [];
  const keys = [...new Set(records.items.flatMap((item) => Object.keys(item)))]
    .filter((key) => !isInternalField(key, records.items, lookupOptions))
    .slice(0, 8);
  const columns = keys.length > 0 ? keys : Object.keys(records.items[0] ?? {})
    .filter((key) => !isInternalField(key, records.items, lookupOptions))
    .slice(0, 8);

  return (
    <section className="space-y-4">
      <Link
        href={`/management/${group.slug}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {group.title}
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl leading-snug font-semibold tracking-tight text-slate-900">
            {module.title}
          </h2>
          <p className="max-w-2xl text-sm text-slate-500">{module.description}</p>
        </div>
        <p className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
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
        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
          <Database className="size-6 text-slate-300" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-800">
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
                    <th key={key} scope="col" className="whitespace-nowrap px-3 py-2.5">
                      {labelFor(key)}
                    </th>
                  ))}
                  {operations.length > 0 || MANAGEMENT_UPDATE_FIELDS[module.slug] ? (
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5">
                      {t.management.workflows.actions}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {records.items.map((item, index) => {
                  const recordId =
                    typeof item.id === "string" || typeof item.id === "number"
                      ? String(item.id)
                      : "";
                  return (
                    <tr key={recordId || index} className="transition hover:bg-slate-50/70">
                      {columns.map((key) => (
                        <td key={key} className="max-w-72 px-3 py-2.5 text-slate-700">
                          <span
                            className="block truncate"
                            title={displayValue(item[key], key, lookupOptions)}
                          >
                            {displayValue(item[key], key, lookupOptions)}
                          </span>
                        </td>
                      ))}
                      {operations.length > 0 || MANAGEMENT_UPDATE_FIELDS[module.slug] ? (
                        <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                          {recordId ? (
                            <div className="flex flex-nowrap items-center gap-1.5">
                              {MANAGEMENT_UPDATE_FIELDS[module.slug] ? (
                                <ManagementWorkflowForm
                                  compact
                                  resource={module.slug}
                                  operation="update"
                                  fields={
                                    enrichFields(
                                      MANAGEMENT_UPDATE_FIELDS[module.slug],
                                      lookupOptions,
                                    ) ?? []
                                  }
                                  recordId={recordId}
                                  values={item}
                                  submitLabel={t.management.workflows.update}
                                />
                              ) : null}
                              {operations.map((operation) => {
                                let fields =
                                  enrichFields(
                                    managementFieldList(module.slug, operation),
                                    lookupOptions,
                                  ) ?? [];
                                if (operation === "status" && module.slug === "maintenance-requests") {
                                  fields = [
                                    {
                                      name: "status",
                                      type: "select",
                                      required: true,
                                      options: [
                                        "Reported",
                                        "Assigned",
                                        "InProgress",
                                        "Completed",
                                        "Cancelled",
                                      ],
                                    } satisfies ManagementField,
                                  ];
                                } else if (operation === "status") {
                                  fields = [
                                    {
                                      name: "status",
                                      type: "select",
                                      required: true,
                                      options:
                                        module.slug === "organizations"
                                          ? ["Active", "Inactive", "Suspended"]
                                          : ["Active", "Inactive"],
                                    } satisfies ManagementField,
                                  ];
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
            <p className="border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500">
              {t.management.table.showing(
                records.items.length.toLocaleString(),
                records.totalCount.toLocaleString(),
              )}
            </p>
          ) : null}
        </div>
      )}
      {relatedRecords ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">{t.management.modules.invoices.title}</h3>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {t.management.table.itemCount(relatedRecords.totalCount.toLocaleString())}
            </span>
          </div>
          {relatedRecords.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
              {t.management.table.emptyTitle}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    {outstandingColumns.map((key) => (
                      <th key={key} scope="col" className="whitespace-nowrap px-3 py-2.5">{labelFor(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedRecords.items.map((item, index) => {
                    return (
                      <tr key={String(item.id ?? index)}>
                        {outstandingColumns.map((key) => (
                          <td key={key} className="max-w-72 px-3 py-2.5 text-slate-700">
                            {displayValue(item[key], key, lookupOptions)}
                          </td>
                        ))}
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
