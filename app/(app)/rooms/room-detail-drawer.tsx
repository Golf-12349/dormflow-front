"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Wrench,
  X,
} from "lucide-react";

import { changeRoomStatusAction } from "@/lib/actions/rooms";
import { t } from "@/lib/i18n";
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPeriod,
  formatUnitPrice,
  roomTypeLabel,
} from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import type {
  Room,
  RoomStatusFormState,
  Tenant,
  UtilityReading,
} from "@/types";

/** Current utility pricing, as returned by `getUtilityRates()`. */
export interface UtilityRates {
  electricPerKwh: number;
  waterPerCubicMeter: number;
}

interface RoomDetailDrawerProps {
  room: Room;
  /** The tenant renting this room, or `null` when nobody is assigned. */
  tenant: Tenant | null;
  /** Meter history for this room, newest period first. */
  readings: UtilityReading[];
  rates: UtilityRates;
  /** Closes the drawer; the parent returns focus to the room that opened it. */
  onClose: () => void;
}

const INITIAL_ROOM_STATUS_STATE: RoomStatusFormState = {
  status: "idle",
  message: null,
};

/** Section heading style, shared with the dashboard's cards. */
const SECTION_TITLE =
  "text-xs font-semibold tracking-wide text-slate-500 uppercase";

/** Placeholder used when a list/table has nothing to show. */
const EMPTY_CLASSES =
  "mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500";

const ROW_CLASSES = "flex items-center justify-between gap-3";
const DT_CLASSES = "text-slate-500";
const DD_CLASSES = "font-medium text-slate-900";

/**
 * 5.6 & 5.7 — room detail drawer with status mutation action.
 *
 * Follows the overlay pattern already used by the mobile navigation drawer in
 * `components/layout/app-shell.tsx`: same `z-40`, the same
 * `bg-slate-900/50 backdrop-blur-sm` backdrop and a `shadow-xl` panel, so both
 * drawers behave and feel alike. Status mutation is driven by
 * `changeRoomStatusAction` via `useActionState`.
 */
export function RoomDetailDrawer({
  room,
  tenant,
  readings,
  rates,
  onClose,
}: RoomDetailDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [statusState, formAction, isPending] = useActionState(
    changeRoomStatusAction,
    INITIAL_ROOM_STATUS_STATE,
  );

  /** Focus moves into the drawer as soon as it opens. */
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  /** Escape closes the drawer, mirroring the navigation drawer. */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-40"
    >
      <button
        type="button"
        aria-label={t.rooms.closeDetailsAria}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="scrollbar-thin absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2
              id={titleId}
              className="text-lg leading-snug font-semibold text-slate-900"
            >
              {t.rooms.roomTitle(room.number)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t.rooms.types[room.type] ?? roomTypeLabel(room.type)} ·{" "}
              {t.rooms.floorLabel(room.floor)}
            </p>
            <div className="mt-2">
              <StatusBadge status={room.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.rooms.closeDetailsAria}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Tenant snapshot */}
          <section>
            <h3 className={SECTION_TITLE}>{t.rooms.sections.tenant}</h3>
            {tenant ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>{t.rooms.fields.name}</dt>
                  <dd className={DD_CLASSES}>{tenant.fullName}</dd>
                </div>
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>{t.rooms.fields.phone}</dt>
                  <dd className={DD_CLASSES}>{tenant.phone}</dd>
                </div>
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>{t.rooms.fields.email}</dt>
                  <dd className={cn(DD_CLASSES, "truncate")}>{tenant.email}</dd>
                </div>
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>{t.rooms.fields.moveIn}</dt>
                  <dd className={DD_CLASSES}>
                    {formatDate(tenant.moveInDate)}
                  </dd>
                </div>
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>{t.rooms.fields.leaseEnds}</dt>
                  <dd className={DD_CLASSES}>
                    {formatDate(tenant.leaseEndDate)}
                  </dd>
                </div>
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>{t.rooms.fields.deposit}</dt>
                  <dd className={DD_CLASSES}>
                    {formatCurrency(tenant.deposit)}
                  </dd>
                </div>
                <div className={ROW_CLASSES}>
                  <dt className={DT_CLASSES}>{t.rooms.fields.balance}</dt>
                  <dd
                    className={cn(
                      "font-medium",
                      tenant.balance > 0 ? "text-rose-700" : "text-slate-900",
                    )}
                  >
                    {formatCurrency(Math.max(tenant.balance, 0))}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className={EMPTY_CLASSES}>{t.rooms.noTenantNotice}</p>
            )}
          </section>

          {/* Rent, size and the rates in use */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.rooms.sections.rentAndUtilities}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.rooms.fields.monthlyRent}</dt>
                <dd className={DD_CLASSES}>
                  {formatCurrency(room.monthlyRate)}
                </dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.rooms.fields.size}</dt>
                <dd className={DD_CLASSES}>{room.sizeSqm} m²</dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.rooms.fields.electricity}</dt>
                <dd className={DD_CLASSES}>
                  {formatUnitPrice(rates.electricPerKwh)} / kWh
                </dd>
              </div>
              <div className={ROW_CLASSES}>
                <dt className={DT_CLASSES}>{t.rooms.fields.water}</dt>
                <dd className={DD_CLASSES}>
                  {formatUnitPrice(rates.waterPerCubicMeter)} / m³
                </dd>
              </div>
            </dl>
          </section>

          {/* Amenities */}
          <section>
            <h3 className={SECTION_TITLE}>{t.rooms.sections.amenities}</h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {room.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          </section>

          {/* Meter history — already newest period first */}
          <section>
            <h3 className={SECTION_TITLE}>{t.rooms.sections.meterHistory}</h3>
            {readings.length === 0 ? (
              <p className={EMPTY_CLASSES}>{t.rooms.noReadings}</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        {t.rooms.fields.period}
                      </th>
                      <th scope="col" className="px-3 py-2">
                        {t.rooms.fields.electricity}
                      </th>
                      <th scope="col" className="px-3 py-2">
                        {t.rooms.fields.water}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readings.map((reading) => (
                      <tr key={reading.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {formatPeriod(reading.period)}
                        </td>
                        <td className="px-3 py-2">
                          {formatNumber(
                            reading.electricCurrent - reading.electricPrevious,
                          )}{" "}
                          kWh
                        </td>
                        <td className="px-3 py-2">
                          {formatNumber(
                            reading.waterCurrent - reading.waterPrevious,
                          )}{" "}
                          m³
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Housekeeping note, only when the room has one */}
          {room.note ? (
            <section>
              <h3 className={SECTION_TITLE}>{t.rooms.sections.note}</h3>
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {room.note}
              </p>
            </section>
          ) : null}

          {/* 5.7 — Status mutation action */}
          <section>
            <h3 className={SECTION_TITLE}>
              {t.rooms.sections.changeStatus}
            </h3>
            <div className="mt-3 space-y-3">
              {room.status === "vacant" || room.status === "maintenance" ? (
                <form action={formAction} className="space-y-3">
                  <input type="hidden" name="roomId" value={room.id} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={room.status === "vacant" ? "maintenance" : "vacant"}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                      room.status === "vacant"
                        ? "bg-amber-600 hover:bg-amber-500 disabled:bg-amber-400"
                        : "bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400",
                    )}
                  >
                    {isPending ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        <span>{t.rooms.actions.updating}</span>
                      </>
                    ) : room.status === "vacant" ? (
                      <>
                        <Wrench className="size-4" aria-hidden="true" />
                        <span>{t.rooms.actions.markAsMaintenance}</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-4" aria-hidden="true" />
                        <span>{t.rooms.actions.markAsVacant}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                  {room.status === "occupied"
                    ? t.rooms.actions.statusManagedByLease
                    : t.rooms.actions.statusManagedByReservation}
                </p>
              )}

              {statusState.status !== "idle" && statusState.message ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "flex items-start gap-2 rounded-xl border p-3 text-xs",
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}