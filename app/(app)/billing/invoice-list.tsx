"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Printer } from "lucide-react";

import { recordInvoicePaymentAction } from "@/lib/actions/billing";
import { t } from "@/lib/i18n";
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_LABELS,
  cn,
  formatDate,
  formatPeriod,
  formatUnitPrice,
} from "@/lib/utils";
import type { Invoice, InvoicePaymentFormState } from "@/types";

export interface InvoiceListEntry {
  invoice: Invoice;
  roomNumber: string;
  tenantName: string;
}

const INITIAL_PAYMENT_STATE: InvoicePaymentFormState = {
  status: "idle",
  message: null,
};

export function InvoiceList({ entries }: { entries: InvoiceListEntry[] }) {
  const [printEntry, setPrintEntry] = useState<InvoiceListEntry | null>(null);

  return (
    <section aria-labelledby="invoice-list-title" className="mt-6 space-y-4">
      <h2
        id="invoice-list-title"
        className="text-base font-semibold text-slate-900"
      >
        {t.billing.invoice.list.sectionTitle}
      </h2>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          {t.billing.invoice.list.empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <caption className="sr-only">
              {t.billing.invoice.list.sectionTitle}
            </caption>
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t.billing.invoice.list.invoiceNumber}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t.billing.invoice.list.room}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t.billing.invoice.list.tenant}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t.billing.invoice.list.dueDate}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t.billing.invoice.list.total}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t.billing.invoice.list.paid}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t.billing.invoice.list.outstanding}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t.billing.invoice.list.status}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t.billing.invoice.list.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <InvoiceRow
                  key={entry.invoice.id}
                  entry={entry}
                  onPrint={() => setPrintEntry(entry)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {printEntry ? (
        <InvoicePrintView
          entry={printEntry}
          onClose={() => setPrintEntry(null)}
        />
      ) : null}
    </section>
  );
}

function InvoiceRow({
  entry,
  onPrint,
}: {
  entry: InvoiceListEntry;
  onPrint: () => void;
}) {
  const { invoice, roomNumber, tenantName } = entry;
  const outstanding = Math.max(0, invoice.total - invoice.paidAmount);
  const [state, formAction, isPending] = useActionState(
    recordInvoicePaymentAction,
    INITIAL_PAYMENT_STATE,
  );

  return (
    <tr className="align-top">
      <th scope="row" className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
        {invoice.invoiceNumber}
        {state.status !== "idle" && state.message ? (
          <span
            role="status"
            aria-live="polite"
            className={cn(
              "mt-2 flex items-start gap-1 text-xs font-normal",
              state.status === "success" ? "text-emerald-700" : "text-rose-700",
            )}
          >
            {state.status === "success" ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            )}
            {state.message}
          </span>
        ) : null}
      </th>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
        {t.rooms.roomTitle(roomNumber)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
        {tenantName}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
        {formatDate(invoice.dueDate)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-900">
        {formatUnitPrice(invoice.total)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">
        {formatUnitPrice(invoice.paidAmount)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
        {formatUnitPrice(outstanding)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            INVOICE_STATUS_BADGE_CLASSES[invoice.status],
          )}
        >
          {INVOICE_STATUS_LABELS[invoice.status]}
        </span>
      </td>
      <td className="min-w-56 px-4 py-3">
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Printer className="size-3.5" aria-hidden="true" />
          {t.billing.invoice.list.print}
        </button>
        {outstanding > 0 ? (
          <form action={formAction} className="mt-2 space-y-1.5">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <label
              htmlFor={`${invoice.id}-payment`}
              className="block text-xs font-medium text-slate-600"
            >
              {t.billing.invoice.payment.amount}
            </label>
            <div className="flex items-start gap-1.5">
              <input
                id={`${invoice.id}-payment`}
                name="paymentAmount"
                type="number"
                min="0.01"
                max={outstanding}
                step="0.01"
                inputMode="decimal"
                required
                aria-invalid={state.fieldErrors?.paymentAmount ? true : undefined}
                aria-describedby={
                  state.fieldErrors?.paymentAmount
                    ? `${invoice.id}-payment-error`
                    : undefined
                }
                className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? t.billing.invoice.payment.saving
                  : t.billing.invoice.payment.record}
              </button>
            </div>
            {state.fieldErrors?.paymentAmount ? (
              <p
                id={`${invoice.id}-payment-error`}
                className="text-xs text-rose-600"
              >
                {state.fieldErrors.paymentAmount}
              </p>
            ) : null}
          </form>
        ) : null}
      </td>
    </tr>
  );
}

function InvoicePrintView({
  entry,
  onClose,
}: {
  entry: InvoiceListEntry;
  onClose: () => void;
}) {
  const { invoice, roomNumber, tenantName } = entry;
  const outstanding = Math.max(0, invoice.total - invoice.paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 print:bg-white print:p-0">
      <section
        id="billing-print-view"
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-print-title"
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl print:max-w-none print:rounded-none print:p-0 print:shadow-none"
      >
        <div className="print-hidden mb-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t.billing.invoice.list.close}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <Printer className="size-4" aria-hidden="true" />
            {t.billing.invoice.list.printInvoice}
          </button>
        </div>
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-lg font-bold text-indigo-700">DormHub</p>
            <h2
              id="billing-print-title"
              className="mt-2 text-xl font-semibold text-slate-900"
            >
              {t.billing.invoice.list.printTitle}
            </h2>
          </div>
          <p className="text-base font-semibold text-slate-900">
            {invoice.invoiceNumber}
          </p>
        </header>
        <dl className="grid gap-3 border-b border-slate-200 py-5 sm:grid-cols-2">
          <PrintDetail label={t.billing.invoice.list.tenant} value={tenantName} />
          <PrintDetail
            label={t.billing.invoice.list.room}
            value={t.rooms.roomTitle(roomNumber)}
          />
          <PrintDetail
            label={t.billing.invoice.list.issuedDate}
            value={formatDate(invoice.issuedDate)}
          />
          <PrintDetail
            label={t.billing.invoice.list.dueDate}
            value={formatDate(invoice.dueDate)}
          />
          <PrintDetail
            label={t.billing.invoice.list.period}
            value={formatPeriod(invoice.period)}
          />
        </dl>
        <div className="py-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            {t.billing.invoice.list.description}
          </h3>
          <dl className="space-y-2 text-sm">
            <PrintAmount label={t.billing.invoice.generate.roomFee} value={invoice.roomFee} />
            <PrintAmount label={t.billing.invoice.generate.electricFee} value={invoice.electricFee} />
            <PrintAmount label={t.billing.invoice.generate.waterFee} value={invoice.waterFee} />
            <PrintAmount label={t.billing.invoice.generate.otherFee} value={invoice.otherFee} />
            <PrintAmount label={t.billing.invoice.list.total} value={invoice.total} strong />
            <PrintAmount label={t.billing.invoice.list.paid} value={invoice.paidAmount} />
            <PrintAmount label={t.billing.invoice.list.outstanding} value={outstanding} strong />
          </dl>
        </div>
      </section>
    </div>
  );
}

function PrintDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function PrintAmount({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3",
        strong && "border-t border-slate-200 pt-2 font-semibold text-slate-900",
      )}
    >
      <dt className={strong ? undefined : "text-slate-600"}>{label}</dt>
      <dd>{formatUnitPrice(value)}</dd>
    </div>
  );
}
