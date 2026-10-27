"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Save,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import {
  changeRoomStatusAction,
  deleteRoomAction,
  updateRoomDetailsAction,
} from "@/lib/actions/rooms";
import { ActionResultToast } from "@/components/providers/action-result-toast";
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

  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [statusState, formAction, isPending] = useActionState(
    changeRoomStatusAction,
    INITIAL_ROOM_STATUS_STATE,
  );

  const [editState, editFormAction, isEditPending] = useActionState(
    updateRoomDetailsAction,
    INITIAL_ROOM_STATUS_STATE,
  );

  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteRoomAction,
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
      <ActionResultToast state={statusState} />
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
            <div className="flex items-center justify-between gap-2">
              <h3 className={SECTION_TITLE}>
                {t.rooms.sections.rentAndUtilities}
              </h3>
              {!isEditingRoom ? (
                <button
                  type="button"
                  onClick={() => setIsEditingRoom(true)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  {t.rooms.edit.trigger}
                </button>
              ) : null}
            </div>

            {isEditingRoom ? (
              <form
                action={editFormAction}
                className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                noValidate
              >
                <input type="hidden" name="roomId" value={room.id} />
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    {t.rooms.add.roomNumber} *
                  </label>
                  <input
                    required
                    type="text"
                    name="roomNumber"
                    defaultValue={room.number}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    {t.rooms.fields.monthlyRent} (LAK) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    name="monthlyRent"
                    defaultValue={room.monthlyRate}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    {t.rooms.add.description}
                  </label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={room.note ?? ""}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingRoom(false)}
                    className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    {t.rooms.edit.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isEditPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {isEditPending ? (
                      <>
                        <Loader2
                          className="size-3.5 animate-spin"
                          aria-hidden="true"
                        />
                        <span>{t.rooms.edit.saving}</span>
                      </>
                    ) : (
                      <>
                        <Save className="size-3.5" aria-hidden="true" />
                        <span>{t.rooms.edit.submit}</span>
                      </>
                    )}
                  </button>
                </div>
                {editState.status !== "idle" && editState.message ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-3 text-xs",
                      editState.status === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    )}
                  >
                    {editState.status === "success" ? (
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
                    <p>{editState.message}</p>
                  </div>
                ) : null}
              </form>
            ) : (
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
            )}
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

          {room.status === "vacant" || room.status === "maintenance" ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
              <h3 className={cn(SECTION_TITLE, "text-rose-700")}>
                {t.rooms.delete.sectionTitle}
              </h3>
              {!isConfirmingDelete ? (
                <>
                  <p className="mt-2 text-xs text-slate-600">
                    {t.rooms.delete.hint}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    {t.rooms.delete.trigger}
                  </button>
                </>
              ) : (
                <form action={deleteFormAction} className="mt-3 space-y-3">
                  <input type="hidden" name="roomId" value={room.id} />
                  <p className="text-sm text-slate-700">
                    {t.rooms.delete.confirmPrompt(room.number)}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white"
                    >
                      {t.rooms.edit.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isDeletePending}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-60"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span>
                        {isDeletePending
                          ? t.rooms.delete.deleting
                          : t.rooms.delete.confirm}
                      </span>
                    </button>
                  </div>
                  {deleteState.message ? (
                    <p
                      className={cn(
                        "text-xs font-medium",
                        deleteState.status === "error"
                          ? "text-rose-600"
                          : "text-emerald-700",
                      )}
                    >
                      {deleteState.message}
                    </p>
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