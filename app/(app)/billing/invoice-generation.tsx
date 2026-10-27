"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { ActionResultToast } from "@/components/providers/action-result-toast";
import { generateInvoiceAction } from "@/lib/actions/billing";
import { t } from "@/lib/i18n";
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_LABELS,
  cn,
  formatUnitPrice,
} from "@/lib/utils";
import type {
  InvoiceGenerationFormState,
  InvoiceStatus,
  Room,
} from "@/types";

export type InvoiceRoomKind =
  | {
      kind: "issued";
      invoiceNumber: string;
      total: number;
      status: InvoiceStatus;
    }
  | {
      kind: "ready";
      roomFee: number;
      electricFee: number;
      waterFee: number;
    };

export interface InvoiceRoom {
  room: Room;
  kind: InvoiceRoomKind;
}

interface InvoiceGenerationProps {
  rooms: InvoiceRoom[];
  period: string;
  periodLabel: string;
  canRecord: boolean;
}

const INITIAL_STATE: InvoiceGenerationFormState = {
  status: "idle",
  message: null,
};

const INPUT_CLS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none focus:border-indigo-400";

/** Empty string counts as 0 in the preview only; the server validates. */
function parseOtherFee(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Same rounding as createInvoice so the preview matches the server total. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function InvoiceGeneration({
  rooms,
  period,
  periodLabel,
  canRecord,
}: InvoiceGenerationProps) {
  const done = rooms.filter((entry) => entry.kind.kind === "issued").length;
  return (
    <section aria-labelledby="invoice-generation-title" className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="invoice-generation-title"
            className="text-base font-semibold text-slate-900"
          >
            {t.billing.invoice.generate.sectionTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t.billing.invoice.generate.sectionSubtitle(periodLabel)}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {t.billing.invoice.generate.progress(done, rooms.length)}
        </p>
      </div>
      {rooms.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          {t.billing.invoice.generate.empty}
        </p>
      ) : !canRecord ? (
        <p
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm"
        >
          {t.billing.invoice.generate.errors.futurePeriod}
        </p>
      ) : (
        <div className="grid gap-3">
          {rooms.map((entry) => (
            <InvoiceRow
              key={entry.room.id}
              room={entry.room}
              kind={entry.kind}
              period={period}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * One card per room. Exactly one `useActionState` hook lives here at the top
 * (never inside a branch), and `state.message` renders in `role="status"` for
 * ALL kinds, so the success message survives the row flipping to "issued"
 * after revalidation.
 */
function InvoiceRow({
  room,
  kind,
  period,
}: {
  room: Room;
  kind: InvoiceRoomKind;
  period: string;
}) {
  const [state, formAction, isPending] = useActionState(
    generateInvoiceAction,
    INITIAL_STATE,
  );
  const [otherFeeInput, setOtherFeeInput] = useState("");

  const isIssued = kind.kind === "issued";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <ActionResultToast state={state} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          {t.rooms.roomTitle(room.number)}
        </h3>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            isIssued
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-slate-100 text-slate-600 ring-slate-500/20",
          )}
        >
          {isIssued
            ? t.billing.invoice.generate.issued
            : t.billing.invoice.generate.ready}
        </span>
      </div>

      {state.status !== "idle" && state.message ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs",
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {state.status === "success" ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-rose-500"
              aria-hidden="true"
            />
          )}
          <p>{state.message}</p>
        </div>
      ) : null}

      {isIssued ? (
        <IssuedBody
          invoiceNumber={kind.invoiceNumber}
          total={kind.total}
          status={kind.status}
        />
      ) : (
        <ReadyForm
          roomId={room.id}
          roomLabel={t.rooms.roomTitle(room.number)}
          period={period}
          roomFee={kind.roomFee}
          electricFee={kind.electricFee}
          waterFee={kind.waterFee}
          state={state}
          formAction={formAction}
          isPending={isPending}
          otherFeeInput={otherFeeInput}
          setOtherFeeInput={setOtherFeeInput}
        />
      )}
    </article>
  );
}

/** Ready room: fee breakdown, controlled otherFee, live total, submit. */
function ReadyForm({
  roomId,
  roomLabel,
  period,
  roomFee,
  electricFee,
  waterFee,
  state,
  formAction,
  isPending,
  otherFeeInput,
  setOtherFeeInput,
}: {
  roomId: string;
  roomLabel: string;
  period: string;
  roomFee: number;
  electricFee: number;
  waterFee: number;
  state: InvoiceGenerationFormState;
  formAction: (payload: FormData) => void;
  isPending: boolean;
  otherFeeInput: string;
  setOtherFeeInput: (value: string) => void;
}) {
  const otherFee = parseOtherFee(otherFeeInput) ?? 0;
  const total = round2(roomFee + electricFee + waterFee + otherFee);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="period" value={period} />
      <dl className="space-y-1 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-2">
          <dt>{t.billing.invoice.generate.roomFee}</dt>
          <dd className="font-medium text-slate-900">
            {formatUnitPrice(roomFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>{t.billing.invoice.generate.electricFee}</dt>
          <dd className="font-medium text-slate-900">
            {formatUnitPrice(electricFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>{t.billing.invoice.generate.waterFee}</dt>
          <dd className="font-medium text-slate-900">
            {formatUnitPrice(waterFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt>{t.billing.invoice.generate.otherFee}</dt>
          <dd className="font-medium text-slate-900">
            {formatUnitPrice(otherFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <dt className="font-semibold text-slate-900">
            {t.billing.invoice.generate.total}
          </dt>
          <dd className="font-semibold text-slate-900">
            {formatUnitPrice(total)}
          </dd>
        </div>
      </dl>
      <div>
        <label
          htmlFor={`${roomId}-other-fee`}
          className="block text-sm font-medium text-slate-700"
        >
          {t.billing.invoice.generate.otherFee}
        </label>
        <input
          id={`${roomId}-other-fee`}
          name="otherFee"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={otherFeeInput}
          onChange={(event) => setOtherFeeInput(event.target.value)}
          aria-label={`${t.billing.invoice.generate.otherFee} ${roomLabel}`}
          aria-invalid={state.fieldErrors?.otherFee ? true : undefined}
          aria-describedby={
            state.fieldErrors?.otherFee
              ? `${roomId}-other-fee-error`
              : undefined
          }
          className={cn(
            INPUT_CLS,
            state.fieldErrors?.otherFee &&
              "border-rose-300 focus:border-rose-400",
          )}
        />
        {state.fieldErrors?.otherFee ? (
          <p
            id={`${roomId}-other-fee-error`}
            className="mt-1 text-xs text-rose-600"
          >
            {state.fieldErrors.otherFee}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>{t.billing.invoice.generate.submitting}</span>
            </>
          ) : (
            <span>{t.billing.invoice.generate.submit}</span>
          )}
        </button>
      </div>
    </form>
  );
}

/** Issued invoice: number, total and status badge. */
function IssuedBody({
  invoiceNumber,
  total,
  status,
}: {
  invoiceNumber: string;
  total: number;
  status: InvoiceStatus;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-slate-600">{invoiceNumber}</p>
      <p className="text-sm font-semibold text-slate-900">
        {formatUnitPrice(total)}
      </p>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
          INVOICE_STATUS_BADGE_CLASSES[status],
        )}
      >
        {INVOICE_STATUS_LABELS[status]}
      </span>
    </div>
  );
}