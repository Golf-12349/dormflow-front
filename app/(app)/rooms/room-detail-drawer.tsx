"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Gauge,
  Loader2,
  Pencil,
  Receipt,
  Save,
  Trash2,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import {
  changeRoomStatusAction,
  deleteRoomAction,
  updateRoomDetailsAction,
} from "@/lib/actions/rooms";
import type { RoomCreationOptions } from "@/lib/api/dormflow";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import { t } from "@/lib/i18n";
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_LABELS,
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
  Invoice,
  MaintenanceItem,
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
  invoices?: Invoice[];
  maintenanceRequests?: MaintenanceItem[];
  rates: UtilityRates;
  options?: RoomCreationOptions;
  /** Closes the drawer; the parent returns focus to the room that opened it. */
  onClose: () => void;
}

const INITIAL_ROOM_STATUS_STATE: RoomStatusFormState = {
  status: "idle",
  message: null,
};

const SECTION_TITLE =
  "text-xs font-semibold tracking-wide text-slate-500 uppercase";

const ROW_CLASSES = "flex items-center justify-between gap-3";
const DT_CLASSES = "text-slate-500";
const DD_CLASSES = "font-medium text-slate-900";

export function RoomDetailDrawer({
  room,
  tenant,
  readings,
  invoices = [],
  maintenanceRequests = [],
  rates,
  options,
  onClose,
}: RoomDetailDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<
    "tenant" | "billing" | "meter" | "maintenance"
  >("tenant");
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

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

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
        className="scrollbar-thin absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl outline-none"
      >
        {/* Header: Room title, floor/building and close button */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2
              id={titleId}
              className="text-lg leading-snug font-semibold text-slate-900"
            >
              {t.rooms.roomTitle(room.number)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {room.roomTypeName || (t.rooms.types[room.type] ?? roomTypeLabel(room.type))}
              {room.buildingName || room.floorName ? (
                <>
                  {" · "}
                  {[room.buildingName, room.floorName || t.rooms.floorLabel(room.floor)].filter(Boolean).join(" · ")}
                </>
              ) : (
                <> · {t.rooms.floorLabel(room.floor)}</>
              )}
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

        {/* Roomie-style 4-Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4">
          <button
            type="button"
            onClick={() => setActiveTab("tenant")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition",
              activeTab === "tenant"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <UserRound className="size-3.5" />
            <span>ຜູ້ເຊົ່າ & ສັນຍາ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition",
              activeTab === "billing"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <Receipt className="size-3.5" />
            <span>ໃບບິນ ({invoices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("meter")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition",
              activeTab === "meter"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <Gauge className="size-3.5" />
            <span>ມິເຕີ ({readings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-semibold transition",
              activeTab === "maintenance"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <Wrench className="size-3.5" />
            <span>ແຈ້ງສ້ອມ ({maintenanceRequests.length})</span>
          </button>
        </div>

        <div className="space-y-6 p-5">
          {activeTab === "tenant" && (
            <>
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
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
                    <p className="text-sm font-medium text-slate-700">{t.rooms.noTenantNotice}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      ທ່ານສາມາດມອບໝາຍຜູ້ເຊົ່າ ຫຼື ສ້າງສັນຍາເຊົ່າໃໝ່ໄດ້ທີ່ເມນູ ຜູ້ເຊົ່າ
                    </p>
                    <Link
                      href="/tenants"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                    >
                      <UserRound className="size-3.5" />
                      <span>ໄປທີ່ໜ້າຜູ້ເຊົ່າ</span>
                    </Link>
                  </div>
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
                    {options ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-700">
                            {t.rooms.add.building}
                          </label>
                          <select
                            disabled
                            defaultValue={room.buildingId ?? ""}
                            className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500"
                          >
                            <option value={room.buildingId ?? ""}>
                              {room.buildingName || "ອາຄານຫຼັກ"}
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700">
                            {t.rooms.add.floor}
                          </label>
                          <select
                            name="floorId"
                            defaultValue={room.floorId ?? ""}
                            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                          >
                            {options.floors.map((floor) => (
                              <option key={floor.id} value={floor.id}>
                                {floor.name || `ຊັ້ນ ${floor.floorNumber}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}
                    {options ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          {t.rooms.add.roomType}
                        </label>
                        <select
                          name="roomTypeId"
                          defaultValue={room.roomTypeId ?? ""}
                          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                        >
                          {options.roomTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name} ({formatCurrency(type.monthlyRent)})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        {t.rooms.fields.number} *
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
                    {typeof room.depositAmount === "number" && room.depositAmount > 0 ? (
                      <div className={ROW_CLASSES}>
                        <dt className={DT_CLASSES}>{t.rooms.fields.deposit}</dt>
                        <dd className={DD_CLASSES}>
                          {formatCurrency(room.depositAmount)}
                        </dd>
                      </div>
                    ) : null}
                    {typeof room.maximumOccupants === "number" && room.maximumOccupants > 0 ? (
                      <div className={ROW_CLASSES}>
                        <dt className={DT_CLASSES}>ຈຳນວນພັກສູງສຸດ</dt>
                        <dd className={DD_CLASSES}>{room.maximumOccupants} ຄົນ</dd>
                      </div>
                    ) : null}
                    {typeof room.sizeSqm === "number" && room.sizeSqm > 0 ? (
                      <div className={ROW_CLASSES}>
                        <dt className={DT_CLASSES}>{t.rooms.fields.size}</dt>
                        <dd className={DD_CLASSES}>{room.sizeSqm} m²</dd>
                      </div>
                    ) : null}
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
              {room.amenities && room.amenities.length > 0 ? (
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
              ) : null}

              {/* Housekeeping note */}
              {room.note ? (
                <section>
                  <h3 className={SECTION_TITLE}>{t.rooms.sections.note}</h3>
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {room.note}
                  </p>
                </section>
              ) : null}

              {/* Status mutation action */}
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
            </>
          )}

          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">ປະຫວັດໃບບິນ ແລະ ການຊຳລະ</h3>
                  <p className="text-xs text-slate-500">ລາຍການໃບບິນທັງໝົດຂອງຫ້ອງ {room.number}</p>
                </div>
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  <span>ຈັດການບິນ</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              {invoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
                  <Receipt className="mx-auto size-8 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">ຍັງບໍ່ມີໃບບິນສຳລັບຫ້ອງນີ້</p>
                  <p className="mt-1 text-xs text-slate-500">ໃບບິນຈະສະແດງຢູ່ນີ້ເມື່ອມີການອອກໃບບິນປະຈຳເດືອນ</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                      <tr>
                        <th className="px-3.5 py-2.5">ເລກບິນ</th>
                        <th className="px-3.5 py-2.5">ຮອບບິນ</th>
                        <th className="px-3.5 py-2.5 text-right">ຍອດລວມ</th>
                        <th className="px-3.5 py-2.5 text-right">ຄ້າງຊຳລະ</th>
                        <th className="px-3.5 py-2.5">ສະຖານະ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">{inv.invoiceNumber}</td>
                          <td className="px-3.5 py-2.5">{inv.period}</td>
                          <td className="px-3.5 py-2.5 text-right font-medium text-slate-900">
                            {formatCurrency(inv.total)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-medium text-rose-600">
                            {formatCurrency(Math.max(inv.total - inv.paidAmount, 0))}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                INVOICE_STATUS_BADGE_CLASSES[inv.status],
                              )}
                            >
                              {INVOICE_STATUS_LABELS[inv.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "meter" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">ປະຫວັດການອ່ານມິເຕີ</h3>
                <p className="text-xs text-slate-500">ອັດຕາຄ່ານ້ຳ-ໄຟ ແລະ ປະຫວັດການບັນທຶກມິເຕີ</p>
              </div>

              {/* Utility Pricing Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                  <p className="text-xs font-medium text-amber-800">ຄ່າໄຟຟ້າຕໍ່ໜ່ວຍ</p>
                  <p className="mt-1 text-base font-bold text-amber-900">
                    {formatUnitPrice(rates.electricPerKwh)} LAK / kWh
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3">
                  <p className="text-xs font-medium text-sky-800">ຄ່ານ້ຳປະປາຕໍ່ໜ່ວຍ</p>
                  <p className="mt-1 text-base font-bold text-sky-900">
                    {formatUnitPrice(rates.waterPerCubicMeter)} LAK / m³
                  </p>
                </div>
              </div>

              {/* Meter history table */}
              {readings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
                  <Gauge className="mx-auto size-8 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">{t.rooms.noReadings}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                      <tr>
                        <th scope="col" className="px-3.5 py-2.5">
                          {t.rooms.fields.period}
                        </th>
                        <th scope="col" className="px-3.5 py-2.5 text-right">
                          ໄຟຟ້າ (ເກົ່າ → ໃໝ່)
                        </th>
                        <th scope="col" className="px-3.5 py-2.5 text-right">
                          ໜ່ວຍໄຟທີ່ໃຊ້
                        </th>
                        <th scope="col" className="px-3.5 py-2.5 text-right">
                          ນ້ຳປະປາ (ເກົ່າ → ໃໝ່)
                        </th>
                        <th scope="col" className="px-3.5 py-2.5 text-right">
                          ໜ່ວຍນ້ຳທີ່ໃຊ້
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {readings.map((reading) => (
                        <tr key={reading.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">
                            {formatPeriod(reading.period)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-500">
                            {reading.electricPrevious} → {reading.electricCurrent}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-amber-700">
                            {formatNumber(reading.electricCurrent - reading.electricPrevious)} kWh
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-500">
                            {reading.waterPrevious} → {reading.waterCurrent}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-sky-700">
                            {formatNumber(reading.waterCurrent - reading.waterPrevious)} m³
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">ລາຍການແຈ້ງສ້ອມແປງ</h3>
                  <p className="text-xs text-slate-500">ບັນຫາ ແລະ ປະຫວັດການສ້ອມແປງຂອງຫ້ອງ {room.number}</p>
                </div>
                <Link
                  href="/management/services/maintenance-requests"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  <span>ຈັດການແຈ້ງສ້ອມ</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              {maintenanceRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
                  <Wrench className="mx-auto size-8 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">ບໍ່ມີລາຍການແຈ້ງສ້ອມແປງຄ້າງ</p>
                  <p className="mt-1 text-xs text-slate-500">ຫ້ອງນີ້ຢູ່ໃນສະພາບປົກກະຕິ ບໍ່ມີບັນຫາແຈ້ງເຂົ້າມາ</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {maintenanceRequests.map((req) => (
                    <article
                      key={req.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">{req.title}</h4>
                          <p className="mt-0.5 text-xs text-slate-500">{req.category} • ບຸລິມະສິດ: {req.priority}</p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            req.status.toLowerCase() === "completed"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : req.status.toLowerCase() === "inprogress"
                                ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                                : "bg-amber-50 text-amber-700 ring-amber-600/20",
                          )}
                        >
                          {req.status}
                        </span>
                      </div>
                      {req.description ? (
                        <p className="mt-2 text-xs text-slate-600">{req.description}</p>
                      ) : null}
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          <time>{req.createdAt.slice(0, 10)}</time>
                        </span>
                        {typeof req.cost === "number" && req.cost > 0 ? (
                          <span className="font-semibold text-slate-700">ຄ່າໃຊ້ຈ່າຍ: {formatCurrency(req.cost)}</span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
