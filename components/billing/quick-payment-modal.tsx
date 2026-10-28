"use client";

import { useActionState, useEffect } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, X } from "lucide-react";

import { recordInvoicePaymentAction } from "@/lib/actions/billing";
import { t } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceListEntry } from "@/app/(app)/billing/invoice-list";
import type { InvoicePaymentFormState } from "@/types";

interface QuickPaymentModalProps {
  entry: InvoiceListEntry;
  onClose: () => void;
}

const INITIAL_PAYMENT_STATE: InvoicePaymentFormState = {
  status: "idle",
  message: null,
};

export function QuickPaymentModal({ entry, onClose }: QuickPaymentModalProps) {
  const [state, formAction, isPending] = useActionState(
    recordInvoicePaymentAction,
    INITIAL_PAYMENT_STATE,
  );

  const { invoice, roomNumber, tenantName } = entry;
  const outstanding = invoice.total - invoice.paidAmount;

  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CreditCard className="size-3.5" />
              ຮັບຊຳລະເງິນ (Receive Payment)
            </div>
            <h2
              id="payment-modal-title"
              className="mt-2 text-xl font-bold text-slate-900"
            >
              ໃບບິນ #{invoice.invoiceNumber}
            </h2>
            <p className="text-sm text-slate-500">
              ຫ້ອງ <span className="font-semibold text-slate-700">{roomNumber}</span> • ຜູ້ເຊົ່າ:{" "}
              <span className="font-semibold text-slate-700">{tenantName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* State Banner */}
        {state.status === "success" ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{state.message ?? "ບັນທຶກການຊຳລະເງິນສຳເລັດ!"}</span>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{state.message}</span>
          </div>
        ) : null}

        {/* Invoice Summary Box */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3.5 text-center">
          <div>
            <p className="text-xs text-slate-500 font-medium">ຍອດລວມທັງໝົດ</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(invoice.total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">ຊຳລະແລ້ວ</p>
            <p className="mt-1 text-sm font-semibold text-emerald-600">
              {formatCurrency(invoice.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">ຍອດຄ້າງຊຳລະ</p>
            <p className="mt-1 text-base font-bold text-rose-600">
              {formatCurrency(outstanding)}
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />

          {/* Amount field */}
          <div>
            <label
              htmlFor="paymentAmount"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {t.billing.invoice.payment.amount} (LAK) *
            </label>
            <div className="mt-1.5 relative">
              <input
                id="paymentAmount"
                name="paymentAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={outstanding}
                defaultValue={outstanding}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                LAK
              </span>
            </div>
            {state.fieldErrors?.paymentAmount ? (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.paymentAmount}
              </p>
            ) : null}
          </div>

          {/* Payment Method */}
          <div>
            <label
              htmlFor="paymentMethod"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {t.billing.invoice.payment.method} *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              defaultValue="Cash"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="Cash">{t.billing.invoice.payment.methods.Cash} (ເງິນສົດ)</option>
              <option value="BankTransfer">{t.billing.invoice.payment.methods.BankTransfer} (ໂອນຜ່ານທະນາຄານ)</option>
              <option value="QrCode">{t.billing.invoice.payment.methods.QrCode} (QR Code / BCEL One)</option>
              <option value="Other">{t.billing.invoice.payment.methods.Other} (ອື່ນໆ)</option>
            </select>
          </div>

          {/* Reference / Slip Notes */}
          <div>
            <label
              htmlFor="referenceNumber"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {t.billing.invoice.payment.referenceNumber} / ໝາຍເຫດ
            </label>
            <input
              id="referenceNumber"
              name="referenceNumber"
              type="text"
              placeholder="ເລກອ້າງອີງສະລິບ, ໝາຍເລກທຸລະກຳ ຫຼື ບັນທຶກ"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Due date note */}
          <p className="text-xs text-slate-400">
            ກຳນົດຊຳລະ: {formatDate(invoice.dueDate)}
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isPending || state.status === "success"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CreditCard className="size-3.5" />
              )}
              {isPending ? "ກຳລັງບັນທຶກ..." : "ຢືນຢັນການຮັບເງິນ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
