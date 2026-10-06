"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

import { t } from "@/lib/i18n";
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_LABELS,
  TENANT_STATUS_BADGE_CLASSES,
  TENANT_STATUS_LABELS,
  cn,
  formatCurrency,
  formatDate,
  formatPeriod,
} from "@/lib/utils";
import type { Invoice, Room, Tenant } from "@/types";

interface TenantDetailDrawerProps {
  tenant: Tenant;
  /** The tenant's assigned room, or `null` when none is assigned yet. */
  room: Room | null;
  /** This tenant's invoices, newest first (pre-sorted by the table). */
  invoices: Invoice[];
  /** Closes the drawer; the parent returns focus to the row that opened it. */
  onClose: () => void;
  /**
   * Wall-clock ms sampled by the row's click handler when the drawer opened
   * (event handlers may be impure; render itself must stay pure — see the
   * 6.4 computation below).
   */
  nowMs: number;
}

/** Derived 6.4 numbers: elapsed percent of the lease, days until it ends. */
interface LeaseProgress {
  percent: number;
  daysLeft: number;
}

/**
 * 6.4 — a lease gets the "expiring soon" highlight when it ends within this
 * many days of today. Single tuning point for that threshold.
 */
const LEASE_EXPIRING_SOON_DAYS = 30;

const DAY_MS = 86_400_000;

/** Section heading style, mirroring `rooms/room-detail-drawer.tsx`. */
const SECTION_TITLE =
  "text-xs font-semibold tracking-wide text-slate-500 uppercase";

/** Placeholder used when a list has nothing to show. */
const EMPTY_CLASSES =
  "mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500";

const ROW_CLASSES = "flex items-center justify-between gap-3";
const DT_CLASSES = "text-slate-500";
const DD_CLASSES = "font-medium text-slate-900";

/**
 * 6.3 & 6.4 — tenant profile drawer with the lease progress indicator.
 *
 * Structural clone of `rooms/room-detail-drawer.tsx`: same `z-40` overlay,
 * `bg-slate-900/50 backdrop-blur-sm` backdrop, focus moved into the panel on
 * open and handed back to the triggering row on close, Escape and backdrop
 * closing — so both drawers behave and feel alike.
 */
export function TenantDetailDrawer({
  tenant,
  room,
  invoices,
  onClose,
  nowMs,
}: TenantDetailDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  /** Focus moves into the drawer as soon as it opens. */
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  /** Escape closes the drawer, mirroring the room drawer. */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  /**
   * 6.4 — lease timing as of `nowMs` (sampled by the opening click handler):
   * elapsed fraction of the fixed move-in → lease-end window, clamped to
   * 0–100, plus whole days left (ceil, so a lease ending today reads as 0
   * days, not -1). Pure arithmetic over `Date.parse` of the prop strings —
   * the clock itself is never read during render (react-hooks/purity).
   */
  const startMs = Date.parse(tenant.moveInDate);
  const endMs = Date.parse(tenant.leaseEndDate);
  const totalMs = endMs - startMs;
  const leaseProgress: LeaseProgress = {
    percent:
      totalMs > 0
        ? Math.min(
            100,
            Math.max(0, Math.round(((nowMs - startMs) / totalMs) * 100)),
          )
        : 100,
    daysLeft: Math.ceil((endMs - nowMs) / DAY_MS),
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-40"
    >
      <button
        type="button"
        aria-label={t.tenants.profile.closeDetailsAria}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="scrollbar-thin absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl outline-none"
      >
        {/* Header: full name, status badge, close button */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2
              id={titleId}
              className="text-lg leading-snug font-semibold text-slate-900"
            >
              {tenant.fullName}
            </h2>
            <div className="mt-2">
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                  TENANT_STATUS_BADGE_CLASSES[tenant.status],
                )}
              >
                {TENANT_STATUS_LABELS[tenant.status]}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.tenants.profile.closeDetailsAria}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Contact */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.tenants.profile.sections.contact}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.tenants.profile.fields.email}</dt>
                <dd className={cn(DD_CLASSES, "truncate")}>{tenant.email}</dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.tenants.profile.fields.phone}</dt>
                <dd className={DD_CLASSES}>{tenant.phone}</dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>
                  {t.tenants.profile.fields.idCard}
                </dt>
                <dd className={DD_CLASSES}>{tenant.idCard}</dd>
              </div>
            </dl>
          </section>

          {/* Room info — number via the `rooms` prop, or 6.1's no-room placeholder */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.tenants.profile.sections.room}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.tenants.fields.room}</dt>
                <dd className={DD_CLASSES}>
                  {room ? room.number : t.tenants.noRoom}
                </dd>
              </div>
              {room ? (
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>
                    {t.tenants.profile.fields.monthlyRate}
                  </dt>
                  <dd className={DD_CLASSES}>
                    {formatCurrency(room.monthlyRate)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* Lease dates + 6.4 progress bar / "expiring soon" highlight */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.tenants.profile.sections.lease}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.tenants.fields.moveIn}</dt>
                <dd className={DD_CLASSES}>{formatDate(tenant.moveInDate)}</dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.tenants.fields.leaseEnd}</dt>
                <dd className={DD_CLASSES}>
                  {formatDate(tenant.leaseEndDate)}
                </dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>
                  {t.tenants.profile.fields.deposit}
                </dt>
                <dd className={DD_CLASSES}>{formatCurrency(tenant.deposit)}</dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>
                  {t.tenants.profile.fields.occupation}
                </dt>
                <dd className={cn(DD_CLASSES, "truncate")}>
                  {tenant.occupation}
                </dd>
              </div>
            </dl>

            {/*
              6.4 — only an "active" tenant has a running lease to measure; a
              pending/inactive record gets a plain notice instead, so the bar
              never implies a lease that isn't in force.
            */}
            {tenant.status !== "active" ? (
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                {t.tenants.profile.leaseProgress.noActiveLease}
              </p>
            ) : (
              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    {t.tenants.profile.leaseProgress.label}
                  </p>
                  {/* Percentage as text, so the value is never colour-only. */}
                  <p className="text-sm font-semibold text-slate-900">
                    {leaseProgress.percent}%
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-label={t.tenants.profile.leaseProgress.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={leaseProgress.percent}
                  aria-valuetext={`${leaseProgress.percent}%`}
                  className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className={cn(
                      "h-full rounded-full",
                      leaseProgress.daysLeft < 0
                        ? "bg-rose-500"
                        : "bg-indigo-500",
                    )}
                    style={{ width: `${leaseProgress.percent}%` }}
                  />
                </div>
                {leaseProgress.daysLeft < 0 ? (
                  <span className="mt-2 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20">
                    {t.tenants.profile.leaseProgress.leaseEnded}
                  </span>
                ) : leaseProgress.daysLeft <= LEASE_EXPIRING_SOON_DAYS ? (
                  <span className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                    {t.tenants.profile.leaseProgress.expiringSoon(
                      leaseProgress.daysLeft,
                    )}
                  </span>
                ) : null}
              </div>
            )}
          </section>

          {/* Emergency contact */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.tenants.profile.sections.emergency}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>
                  {t.tenants.profile.fields.contactName}
                </dt>
                <dd className={DD_CLASSES}>{tenant.emergencyContact.name}</dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>
                  {t.tenants.profile.fields.relationship}
                </dt>
                <dd className={DD_CLASSES}>
                  {tenant.emergencyContact.relationship}
                </dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>
                  {t.tenants.profile.fields.phone}
                </dt>
                <dd className={DD_CLASSES}>{tenant.emergencyContact.phone}</dd>
              </div>
            </dl>
          </section>

          {/* Invoice ledger — already filtered + sorted newest first by the table */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.tenants.profile.sections.invoices}
            </h3>
            {invoices.length === 0 ? (
              <p className={EMPTY_CLASSES}>{t.tenants.profile.noInvoices}</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        {t.tenants.profile.fields.period}
                      </th>
                      <th scope="col" className="px-3 py-2">
                        {t.tenants.fields.status}
                      </th>
                      <th scope="col" className="px-3 py-2 text-right">
                        {t.tenants.profile.fields.amount}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {formatPeriod(invoice.period)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                              INVOICE_STATUS_BADGE_CLASSES[invoice.status],
                            )}
                          >
                            {INVOICE_STATUS_LABELS[invoice.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {formatCurrency(invoice.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}