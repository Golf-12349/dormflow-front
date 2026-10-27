"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Pencil,
  Save,
  X,
} from "lucide-react";

import {
  assignTenantRoomAction,
  checkOutTenantAction,
  updateTenantContactAction,
  updateTenantStatusAction,
} from "@/lib/actions/tenants";
import type { TenantLeaseHistoryItem } from "@/lib/api/dormflow";
import { ActionResultToast } from "@/components/providers/action-result-toast";
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
import type {
  CheckOutTenantFormState,
  EditContactFormState,
  Invoice,
  Room,
  Tenant,
} from "@/types";
import { TenantFormField } from "./tenant-form-field";

interface TenantDetailDrawerProps {
  tenant: Tenant;
  /** The tenant's assigned room, or `null` when none is assigned yet. */
  room: Room | null;
  /** All rooms so lease history can resolve `roomId` -> room number. */
  rooms?: Room[];
  /** Vacant rooms available for check-in when the tenant has no active room. */
  vacantRooms?: Room[];
  /** This tenant's invoices, newest first (pre-sorted by the table). */
  invoices: Invoice[];
  /** Lease history from GET /tenants/{id}/history. */
  history?: TenantLeaseHistoryItem[];
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

/** 6.5 — "edit contact" action state (same shape as `RoomStatusFormState`). */
const INITIAL_EDIT_CONTACT_STATE: EditContactFormState = {
  status: "idle",
  message: null,
};

/** 6.5 — "check out tenant" action state. */
const INITIAL_CHECK_OUT_STATE: CheckOutTenantFormState = {
  status: "idle",
  message: null,
};

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
 * closing — so both drawers behave and feel alike. The contact section doubles
 * as the 6.5 "edit contact" form (same `useActionState` pattern as 5.7).
 */
export function TenantDetailDrawer({
  tenant,
  room,
  rooms = [],
  vacantRooms = [],
  invoices,
  history = [],
  onClose,
  nowMs,
}: TenantDetailDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  /** 6.5 — the contact section flips into an inline edit form. */
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactState, contactFormAction, contactPending] = useActionState(
    updateTenantContactAction,
    INITIAL_EDIT_CONTACT_STATE,
  );

  /** 6.5 — destructive check-out: destructive button → confirmation step. */
  const [isConfirmingCheckOut, setIsConfirmingCheckOut] = useState(false);
  const [checkOutState, checkOutFormAction, checkOutPending] =
    useActionState(checkOutTenantAction, INITIAL_CHECK_OUT_STATE);

  /** Check-in / Assign Room for tenants without an active room. */
  const [isAssigningRoom, setIsAssigningRoom] = useState(false);
  const [assignState, assignFormAction, assignPending] = useActionState(
    assignTenantRoomAction,
    INITIAL_CHECK_OUT_STATE,
  );

  /** PATCH /tenants/{id}/status */
  const [statusState, statusFormAction, statusPending] = useActionState(
    updateTenantStatusAction,
    INITIAL_CHECK_OUT_STATE,
  );

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

  /** 6.5 — only an active tenant occupying a room can be checked out. */
  const canCheckOut = tenant.status === "active" && tenant.roomId !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-40"
    >
      <ActionResultToast state={contactState} />
      <ActionResultToast state={checkOutState} />
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
          {/* Contact — 6.5: flips into an inline edit form (emergency fields included) */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className={SECTION_TITLE}>
                {t.tenants.profile.sections.contact}
              </h3>
              {!isEditingContact ? (
                <button
                  type="button"
                  onClick={() => setIsEditingContact(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  {t.tenants.editContact.trigger}
                </button>
              ) : null}
            </div>

            {isEditingContact ? (
              <form
                action={contactFormAction}
                className="mt-3 space-y-3"
                noValidate
              >
                <input type="hidden" name="tenantId" value={tenant.id} />

                <TenantFormField
                  id="contact-email"
                  name="email"
                  label={t.tenants.profile.fields.email}
                  type="email"
                  defaultValue={tenant.email}
                  autoComplete="email"
                />
                <TenantFormField
                  id="contact-phone"
                  name="phone"
                  label={t.tenants.profile.fields.phone}
                  type="tel"
                  defaultValue={tenant.phone}
                  autoComplete="tel"
                />

                <p className="pt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t.tenants.profile.sections.emergency}
                </p>
                <TenantFormField
                  id="contact-ec-name"
                  name="emergencyName"
                  label={t.tenants.profile.fields.contactName}
                  defaultValue={tenant.emergencyContact.name}
                />
                <TenantFormField
                  id="contact-ec-phone"
                  name="emergencyPhone"
                  label={t.tenants.profile.fields.phone}
                  type="tel"
                  defaultValue={tenant.emergencyContact.phone}
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingContact(false)}
                    className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    {t.tenants.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={contactPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {contactPending ? (
                      <>
                        <Loader2
                          className="size-3.5 animate-spin"
                          aria-hidden="true"
                        />
                        <span>{t.tenants.editContact.saving}</span>
                      </>
                    ) : (
                      <>
                        <Save className="size-3.5" aria-hidden="true" />
                        <span>{t.tenants.editContact.submit}</span>
                      </>
                    )}
                  </button>
                </div>

                {contactState.status !== "idle" && contactState.message ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-3 text-xs",
                      contactState.status === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    )}
                  >
                    {contactState.status === "success" ? (
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
                    <p>{contactState.message}</p>
                  </div>
                ) : null}
              </form>
            ) : (
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
            )}
          </section>

          {/* Room info — number via the `rooms` prop, or 6.1's no-room placeholder */}
          <section>
            <div className="flex items-center justify-between gap-2">
              <h3 className={SECTION_TITLE}>
                {t.tenants.profile.sections.room}
              </h3>
              {!room && !isAssigningRoom ? (
                <button
                  type="button"
                  onClick={() => setIsAssigningRoom(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  {t.tenants.assignRoom.trigger}
                </button>
              ) : null}
            </div>
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

            {!room && isAssigningRoom ? (
              vacantRooms.length === 0 ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {t.tenants.assignRoom.noVacantRooms}
                </p>
              ) : (
                <form
                  action={assignFormAction}
                  className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  noValidate
                >
                  <input type="hidden" name="tenantId" value={tenant.id} />
                  <p className="text-xs text-slate-600">
                    {t.tenants.assignRoom.hint}
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      {t.tenants.fields.room} *
                    </label>
                    <select
                      required
                      name="roomId"
                      defaultValue={vacantRooms[0]?.id ?? ""}
                      className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      {vacantRooms.map((vacantRoom) => (
                        <option key={vacantRoom.id} value={vacantRoom.id}>
                          {t.rooms.roomTitle(vacantRoom.number)} ·{" "}
                          {formatCurrency(vacantRoom.monthlyRate)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        {t.tenants.add.startDate}
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={new Date(nowMs).toISOString().slice(0, 10)}
                        className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        {t.tenants.add.endDate}
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        defaultValue={new Date(nowMs + 364 * DAY_MS)
                          .toISOString()
                          .slice(0, 10)}
                        className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      {t.tenants.add.depositAmount} (LAK)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="depositAmount"
                      placeholder="0"
                      className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAssigningRoom(false)}
                      className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      {t.tenants.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={assignPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {assignPending ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          <span>{t.tenants.assignRoom.saving}</span>
                        </>
                      ) : (
                        <span>{t.tenants.assignRoom.submit}</span>
                      )}
                    </button>
                  </div>
                  {assignState.status !== "idle" && assignState.message ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "flex items-start gap-2 rounded-xl border p-3 text-xs",
                        assignState.status === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-rose-200 bg-rose-50 text-rose-700",
                      )}
                    >
                      {assignState.status === "success" ? (
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
                      <p>{assignState.message}</p>
                    </div>
                  ) : null}
                </form>
              )
            ) : null}
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

          {/* Emergency contact — its fields live in the edit form above, so the
              read-only rows step aside while the contact form is open. */}
          {!isEditingContact ? (
            <section>
              <h3 className={SECTION_TITLE}>
                {t.tenants.profile.sections.emergency}
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>
                    {t.tenants.profile.fields.contactName}
                  </dt>
                  <dd className={DD_CLASSES}>
                    {tenant.emergencyContact.name}
                  </dd>
                </div>
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>
                    {t.tenants.profile.fields.phone}
                  </dt>
                  <dd className={DD_CLASSES}>
                    {tenant.emergencyContact.phone}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

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

          {/* Lease History — GET /tenants/{id}/history */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.tenants.profile.sections.history}
            </h3>
            {history.length === 0 ? (
              <p className={EMPTY_CLASSES}>{t.tenants.profile.noHistory}</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        {t.management.table.fields.contractNumber}
                      </th>
                      <th scope="col" className="px-3 py-2">
                        {t.tenants.fields.room}
                      </th>
                      <th scope="col" className="px-3 py-2">
                        {t.tenants.fields.moveIn} → {t.tenants.fields.leaseEnd}
                      </th>
                      <th scope="col" className="px-3 py-2 text-right">
                        {t.tenants.fields.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((item) => {
                      const matchedRoom = rooms.find(
                        (candidate) => candidate.id === item.roomId,
                      );
                      return (
                        <tr key={item.contractId}>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {item.contractNumber}
                          </td>
                          <td className="px-3 py-2">
                            {matchedRoom ? matchedRoom.number : item.roomId.slice(0, 8)}
                          </td>
                          <td className="px-3 py-2">
                            {formatDate(item.startDate)} – {formatDate(item.endDate)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700">
                            {item.status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Tenant Status — PATCH /tenants/{id}/status */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className={SECTION_TITLE}>
              {t.tenants.profile.statusAction.sectionTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {t.tenants.profile.statusAction.hint}
            </p>
            <form
              action={statusFormAction}
              className="mt-3 flex flex-wrap items-center gap-2"
              noValidate
            >
              <input type="hidden" name="tenantId" value={tenant.id} />
              <select
                name="status"
                defaultValue={tenant.status === "inactive" ? "Inactive" : "Active"}
                aria-label={t.tenants.profile.statusAction.sectionTitle}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none focus:border-indigo-400"
              >
                <option value="Active">
                  {t.tenants.profile.statusAction.active}
                </option>
                <option value="Inactive">
                  {t.tenants.profile.statusAction.inactive}
                </option>
                <option value="Blacklisted">
                  {t.tenants.profile.statusAction.blacklisted}
                </option>
              </select>
              <button
                type="submit"
                disabled={statusPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {statusPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    <span>{t.tenants.profile.statusAction.saving}</span>
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" aria-hidden="true" />
                    <span>{t.tenants.profile.statusAction.submit}</span>
                  </>
                )}
              </button>
            </form>
            {statusState.status !== "idle" && statusState.message ? (
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs",
                  statusState.status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700",
                )}
              >
                {statusState.status === "success" ? (
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
                <p>{statusState.message}</p>
              </div>
            ) : null}
          </section>

          {/* 6.5 — check-out: destructive, confirmation required (two records
              move at once: tenant → inactive, room → vacant). Only offered to
              active tenants with a room; a successful result is shown even
              once the tenant's status flip hides the button again. */}
          {canCheckOut || checkOutState.status === "success" ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
              <h3 className={cn(SECTION_TITLE, "text-rose-700")}>
                {t.tenants.checkOut.sectionTitle}
              </h3>

              {checkOutState.status === "success" ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
                >
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <p>{checkOutState.message}</p>
                </div>
              ) : !isConfirmingCheckOut ? (
                <>
                  <p className="mt-2 text-xs text-slate-600">
                    {t.tenants.checkOut.hint}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingCheckOut(true)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
                  >
                    <LogOut className="size-3.5" aria-hidden="true" />
                    {t.tenants.checkOut.trigger}
                  </button>
                </>
              ) : (
                <form
                  action={checkOutFormAction}
                  className="mt-3 space-y-3"
                  noValidate
                >
                  <input
                    type="hidden"
                    name="tenantId"
                    value={tenant.id}
                  />

                  <p className="text-sm text-slate-700">
                    {t.tenants.checkOut.confirmPrompt(tenant.fullName)}
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingCheckOut(false)}
                      className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white"
                    >
                      {t.tenants.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={checkOutPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {checkOutPending ? (
                        <>
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          <span>{t.tenants.checkOut.saving}</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="size-3.5" aria-hidden="true" />
                          <span>{t.tenants.checkOut.confirm}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {checkOutState.status !== "idle" && checkOutState.message ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "flex items-start gap-2 rounded-xl border p-3 text-xs",
                        "border-rose-200 bg-rose-50 text-rose-700",
                      )}
                    >
                      <AlertCircle
                        className="mt-0.5 size-4 shrink-0 text-rose-500"
                        aria-hidden="true"
                      />
                      <p>{checkOutState.message}</p>
                    </div>
                  ) : null}
                </form>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}