"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Printer, Receipt } from "lucide-react";

import { recordInvoicePaymentAction } from "@/lib/actions/billing";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import { QuickPaymentModal } from "@/components/billing/quick-payment-modal";
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

type PrintDocumentType = "invoice" | "receipt";

export function InvoiceList({ entries }: { entries: InvoiceListEntry[] }) {
  const [printState, setPrintState] = useState<{
    entry: InvoiceListEntry;
    docType: PrintDocumentType;
  } | null>(null);

  const [paymentEntry, setPaymentEntry] = useState<InvoiceListEntry | null>(null);

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
                  onPay={(item) => setPaymentEntry(item)}
                  onPrint={(docType) => setPrintState({ entry, docType })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {printState ? (
        <InvoicePrintView
          entry={printState.entry}
          initialDocType={printState.docType}
          onClose={() => setPrintState(null)}
        />
      ) : null}

      {paymentEntry ? (
        <QuickPaymentModal
          entry={paymentEntry}
          onClose={() => setPaymentEntry(null)}
        />
      ) : null}
    </section>
  );
}

function InvoiceRow({
  entry,
  onPay,
  onPrint,
}: {
  entry: InvoiceListEntry;
  onPay: (entry: InvoiceListEntry) => void;
  onPrint: (docType: PrintDocumentType) => void;
}) {
  const { invoice, roomNumber, tenantName } = entry;
  const outstanding = Math.max(0, invoice.total - invoice.paidAmount);

  return (
    <tr className="align-middle">
      <th scope="row" className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
        {invoice.invoiceNumber}
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
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {outstanding > 0 ? (
            <button
              type="button"
              onClick={() => onPay(entry)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500"
            >
              <CreditCard className="size-3.5" aria-hidden="true" />
              ຮັບຊຳລະເງິນ
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onPrint("invoice")}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="size-3.5" aria-hidden="true" />
            {t.billing.invoice.list.print}
          </button>
          {invoice.paidAmount > 0 ? (
            <button
              type="button"
              onClick={() => onPrint("receipt")}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <Receipt className="size-3.5" aria-hidden="true" />
              {t.billing.invoice.list.printReceipt}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function InvoicePrintView({
  entry,
  initialDocType = "invoice",
  onClose,
}: {
  entry: InvoiceListEntry;
  initialDocType?: PrintDocumentType;
  onClose: () => void;
}) {
  const { invoice, roomNumber, tenantName } = entry;
  const [docType, setDocType] = useState<PrintDocumentType>(initialDocType);
  const outstanding = Math.max(0, invoice.total - invoice.paidAmount);
  const isReceipt = docType === "receipt";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 print:bg-white print:p-0">
      <section
        id="billing-print-view"
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-print-title"
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl print:max-w-none print:rounded-none print:p-0 print:shadow-none"
      >
        <div className="print-hidden mb-5 flex flex-wrap items-center justify-between gap-2">
          {invoice.paidAmount > 0 ? (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setDocType("invoice")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition",
                  !isReceipt
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                {t.billing.invoice.list.printTitle}
              </button>
              <button
                type="button"
                onClick={() => setDocType("receipt")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition",
                  isReceipt
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                {t.billing.invoice.list.receiptTitle}
              </button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
              {isReceipt
                ? t.billing.invoice.list.printReceipt
                : t.billing.invoice.list.printInvoice}
            </button>
          </div>
        </div>
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-lg font-bold text-indigo-700">DormHub</p>
            <h2
              id="billing-print-title"
              className="mt-2 text-xl font-semibold text-slate-900"
            >
              {isReceipt
                ? t.billing.invoice.list.receiptTitle
                : t.billing.invoice.list.printTitle}
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
          <PrintDetail
            label={t.billing.invoice.list.status}
            value={INVOICE_STATUS_LABELS[invoice.status]}
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
            <PrintAmount
              label={t.billing.invoice.list.paid}
              value={invoice.paidAmount}
              strong={isReceipt}
            />
            <PrintAmount label={t.billing.invoice.list.outstanding} value={outstanding} strong={!isReceipt} />
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
