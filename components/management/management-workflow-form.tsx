"use client";

import { useActionState, useEffect, useState } from "react";

import { exportManagementReportAction, managementAction, type ManagementActionState } from "@/lib/actions/management";
import type { ManagementField } from "@/lib/management-workflows";
import { t } from "@/lib/i18n";

const initialState: ManagementActionState = { status: "idle", message: null };

function fieldLabel(name: string): string {
  const fields = t.management.table.fields as Record<string, string>;
  return fields[name] ?? name.replace(/([a-z0-9])([A-Z])/gu, "$1 $2");
}

function InputField({
  field,
  value,
}: {
  field: ManagementField;
  value?: unknown;
}) {
  const label = fieldLabel(field.name);
  const currentValue = value === null || value === undefined ? "" : String(value);
  const className = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {field.type === "textarea" ? (
        <textarea
          name={field.name}
          required={field.required}
          defaultValue={currentValue}
          rows={3}
          className={className}
        />
      ) : field.type === "select" ? (
        <select name={field.name} required={field.required} defaultValue={currentValue} className={className}>
          <option value="" disabled={field.required}>—</option>
          {field.options?.map((option) => {
            const values = t.management.workflows.statusValues as Record<string, string>;
            return <option key={option} value={option}>{values[option] ?? option}</option>;
          })}
        </select>
      ) : (
        <input
          name={field.name}
          type={field.type ?? "text"}
          required={field.required}
          step={field.type === "number" ? "any" : undefined}
          defaultValue={currentValue}
          className={className}
        />
      )}
    </label>
  );
}

export function ManagementWorkflowForm({
  resource,
  operation,
  fields,
  recordId,
  values,
  submitLabel,
  title,
  compact = false,
}: {
  resource: string;
  operation: string;
  fields: ManagementField[];
  recordId?: string;
  values?: Record<string, unknown>;
  submitLabel: string;
  title?: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(managementAction, initialState);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={compact ? "min-w-56" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      {title ? <h3 className="mb-3 text-base font-semibold text-slate-900">{title}</h3> : null}
      {compact && operation === "update" ? (
        <button type="button" className="text-xs font-semibold text-indigo-700 hover:text-indigo-900" onClick={() => setExpanded(!expanded)}>
          {expanded ? t.common.close : t.management.workflows.edit}
        </button>
      ) : null}
      {(!compact || operation !== "update" || expanded) ? (
        <form
          action={formAction}
          className={compact ? "mt-3 space-y-2" : "space-y-4"}
          onSubmit={(event) => {
            if (operation === "delete" && !window.confirm(t.management.workflows.confirmDelete)) event.preventDefault();
          }}
        >
          <input type="hidden" name="resource" value={resource} />
          <input type="hidden" name="operation" value={operation} />
          {recordId ? <input type="hidden" name="recordId" value={recordId} /> : null}
          <div className={compact ? "space-y-2" : "grid gap-4 sm:grid-cols-2"}>
            {fields.map((field) => <InputField key={field.name} field={field} value={values?.[field.name]} />)}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? t.common.loading : submitLabel}
          </button>
          {state.message ? (
            <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-rose-700" : "text-sm text-emerald-700"}>
              {state.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

export function ManagementReportExportForm({
  periodFrom,
  periodTo,
}: {
  periodFrom: string;
  periodTo: string;
}) {
  const [state, formAction, pending] = useActionState(
    exportManagementReportAction,
    initialState,
  );
  const [filename, setFilename] = useState("revenue-report.csv");

  useEffect(() => {
    if (state.status !== "success" || !state.message) return;
    const blob = new Blob([state.message], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filename, state]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-slate-700">
        {t.management.workflows.reportFrom}
        <input required name="periodFrom" type="date" defaultValue={periodFrom} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="text-sm text-slate-700">
        {t.management.workflows.reportTo}
        <input required name="periodTo" type="date" defaultValue={periodTo} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <select
        name="report"
        aria-label={t.management.modules.reports.title}
        className="rounded-lg border border-slate-300 px-3 py-2"
        onChange={(event) => setFilename(event.target.value === "revenue" ? "revenue-report.csv" : "outstanding-invoices.csv")}
      >
        <option value="revenue">{t.management.modules.reports.title}</option>
        <option value="outstanding-invoices">{t.management.modules.invoices.title}</option>
      </select>
      <button disabled={pending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? t.common.loading : t.management.workflows.export}
      </button>
      {state.status === "error" && state.message ? <p role="alert" className="w-full text-sm text-rose-700">{state.message}</p> : null}
    </form>
  );
}
