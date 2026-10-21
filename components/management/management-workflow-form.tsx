"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className={compact ? "inline-flex" : ""}>
      {(!compact && operation === "create") ||
      (compact && (operation === "update" || fields.length > 0)) ? (
        <>
          <div className={compact ? "inline-flex" : "flex justify-end"}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              onClick={() => setIsOpen(true)}
              className={compact
                ? "whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                : "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"}
            >
              {!compact ? <Plus className="size-4" aria-hidden="true" /> : null}
              {compact && operation === "update" ? t.management.workflows.edit : submitLabel}
            </button>
          </div>
          {isOpen ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <button
                type="button"
                aria-label={t.common.close}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              />
              <section
                ref={dialogRef}
                tabIndex={-1}
                className={`relative z-10 max-h-[90vh] w-full ${compact ? "max-w-xl" : "max-w-3xl"} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl outline-none sm:p-6`}
              >
                <header className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                      {title ?? (operation === "update" ? t.management.workflows.edit : submitLabel)}
                    </h2>
                    {!compact ? <p className="mt-1 text-sm text-slate-500">{submitLabel}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label={t.common.close}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </header>
                <form
                  action={formAction}
                  className="space-y-5"
                >
                  <input type="hidden" name="resource" value={resource} />
                  <input type="hidden" name="operation" value={operation} />
                  {recordId ? <input type="hidden" name="recordId" value={recordId} /> : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map((field) => <InputField key={field.name} field={field} value={values?.[field.name]} />)}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      {t.common.close}
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      {pending ? t.common.loading : operation === "update" ? t.management.workflows.update : submitLabel}
                    </button>
                  </div>
                  {state.message ? (
                    <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-rose-700" : "text-sm text-emerald-700"}>
                      {state.message}
                    </p>
                  ) : null}
                </form>
              </section>
            </div>
          ) : null}
        </>
      ) : null}
      {compact && fields.length === 0 && operation !== "update" ? (
        <div>
          <form
            action={formAction}
            className="inline-flex"
            onSubmit={(event) => {
              if (operation === "delete" && !window.confirm(t.management.workflows.confirmDelete)) event.preventDefault();
            }}
          >
            <input type="hidden" name="resource" value={resource} />
            <input type="hidden" name="operation" value={operation} />
            {recordId ? <input type="hidden" name="recordId" value={recordId} /> : null}
            <button
              type="submit"
              disabled={pending}
              className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? t.common.loading : submitLabel}
            </button>
          </form>
          {state.message ? (
            <p role={state.status === "error" ? "alert" : "status"} className="mt-1 text-xs text-slate-600">
              {state.message}
            </p>
          ) : null}
        </div>
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
