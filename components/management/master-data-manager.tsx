"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Home,
  Layers,
  Loader2,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  bulkCreateMasterFloorsAction,
  createMasterBuildingAction,
  createMasterDormitoryAction,
  createMasterFloorAction,
  createMasterRoomTypeAction,
  deleteMasterRecordAction,
  type MasterDataActionState,
} from "@/lib/actions/master-data";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import type { RoomCreationOptions } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

const INITIAL_STATE: MasterDataActionState = {
  status: "idle",
  message: null,
};

type TabKey = "dormitories" | "buildings" | "floors" | "roomTypes";

const LABEL_CLASSES = "block text-xs font-medium text-slate-700";
const INPUT_CLASSES =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400";

function StatusAlert({ state }: { state: MasterDataActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-xl border p-3 text-xs",
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
  );
}

function DeleteItemButton({
  resource,
  recordId,
}: {
  resource: "dormitories" | "buildings" | "floors" | "room-types";
  recordId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteMasterRecordAction,
    INITIAL_STATE,
  );

  return (
    <div className="inline-flex items-center gap-1.5">
      <ActionResultToast state={state} />
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          {t.masterData.actions.delete}
        </button>
      ) : (
        <form action={formAction} className="inline-flex items-center gap-1">
          <input type="hidden" name="resource" value={resource} />
          <input type="hidden" name="recordId" value={recordId} />
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            ) : null}
            {t.masterData.actions.confirmDelete}
          </button>
        </form>
      )}
    </div>
  );
}

function MasterDataContent({ options }: { options: RoomCreationOptions }) {
  const dormitories = options.dormitories ?? [];
  const { buildings, floors, roomTypes } = options;

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (dormitories.length === 0) return "dormitories";
    if (buildings.length === 0) return "buildings";
    if (floors.length === 0) return "floors";
    return "roomTypes";
  });

  const [dormState, dormFormAction, dormPending] = useActionState(
    createMasterDormitoryAction,
    INITIAL_STATE,
  );
  const [buildingState, buildingFormAction, buildingPending] = useActionState(
    createMasterBuildingAction,
    INITIAL_STATE,
  );
  const [floorState, floorFormAction, floorPending] = useActionState(
    createMasterFloorAction,
    INITIAL_STATE,
  );
  const [bulkFloorState, bulkFloorFormAction, bulkFloorPending] =
    useActionState(bulkCreateMasterFloorsAction, INITIAL_STATE);
  const [roomTypeState, roomTypeFormAction, roomTypePending] = useActionState(
    createMasterRoomTypeAction,
    INITIAL_STATE,
  );

  const dormNameById = new Map(
    dormitories.map((d) => [d.id, `${d.code} — ${d.name}`]),
  );
  const buildingNameById = new Map(
    buildings.map((b) => [b.id, `${b.code} — ${b.name}`]),
  );

  const tabs: Array<{
    key: TabKey;
    label: string;
    count: number;
    icon: typeof Building2;
  }> = [
    {
      key: "dormitories",
      label: t.masterData.tabs.dormitories,
      count: dormitories.length,
      icon: Building2,
    },
    {
      key: "buildings",
      label: t.masterData.tabs.buildings,
      count: buildings.length,
      icon: Home,
    },
    {
      key: "floors",
      label: t.masterData.tabs.floors,
      count: floors.length,
      icon: Layers,
    },
    {
      key: "roomTypes",
      label: t.masterData.tabs.roomTypes,
      count: roomTypes.length,
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-5">
      <ActionResultToast state={dormState} />
      <ActionResultToast state={buildingState} />
      <ActionResultToast state={floorState} />
      <ActionResultToast state={bulkFloorState} />
      <ActionResultToast state={roomTypeState} />

      {/* Step / Tab Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold transition",
                active
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-indigo-600" : "text-slate-400",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{tab.label}</span>
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. DORMITORIES TAB */}
      {activeTab === "dormitories" ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <form
            action={dormFormAction}
            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:col-span-5"
            noValidate
          >
            <h3 className="text-sm font-semibold text-slate-900">
              {t.masterData.dormitories.addTitle}
            </h3>
            <StatusAlert state={dormState} />
            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL_CLASSES}>
                {t.masterData.dormitories.code} *
                <input
                  name="code"
                  required
                  placeholder="DORM-01"
                  className={INPUT_CLASSES}
                />
              </label>
              <label className={LABEL_CLASSES}>
                {t.masterData.dormitories.name} *
                <input
                  name="name"
                  required
                  placeholder="ຫໍພັກສາຍໃຈ"
                  className={INPUT_CLASSES}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL_CLASSES}>
                {t.masterData.dormitories.billingDay}
                <input
                  name="billingDay"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={1}
                  className={INPUT_CLASSES}
                />
              </label>
              <label className={LABEL_CLASSES}>
                {t.masterData.dormitories.paymentDueDay}
                <input
                  name="paymentDueDay"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={5}
                  className={INPUT_CLASSES}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL_CLASSES}>
                {t.masterData.dormitories.waterRate}
                <input
                  name="waterRatePerUnit"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={5000}
                  className={INPUT_CLASSES}
                />
              </label>
              <label className={LABEL_CLASSES}>
                {t.masterData.dormitories.electricRate}
                <input
                  name="electricityRatePerUnit"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={1500}
                  className={INPUT_CLASSES}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={dormPending}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {dormPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              <span>
                {dormPending
                  ? t.masterData.actions.saving
                  : t.masterData.dormitories.submit}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7">
            {dormitories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                {t.masterData.dormitories.empty}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">{t.masterData.dormitories.code}</th>
                      <th className="px-3 py-2.5">{t.masterData.dormitories.name}</th>
                      <th className="px-3 py-2.5">{t.masterData.dormitories.waterRate}</th>
                      <th className="px-3 py-2.5">{t.masterData.dormitories.electricRate}</th>
                      <th className="px-3 py-2.5 text-right">{t.management.workflows.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dormitories.map((dorm) => (
                      <tr key={dorm.id}>
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                          {dorm.code}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          {dorm.name}
                        </td>
                        <td className="px-3 py-2.5">
                          {formatCurrency(dorm.waterRatePerUnit)}
                        </td>
                        <td className="px-3 py-2.5">
                          {formatCurrency(dorm.electricityRatePerUnit)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <DeleteItemButton resource="dormitories" recordId={dorm.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 2. BUILDINGS TAB */}
      {activeTab === "buildings" ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <form
            action={buildingFormAction}
            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:col-span-5"
            noValidate
          >
            <h3 className="text-sm font-semibold text-slate-900">
              {t.masterData.buildings.addTitle}
            </h3>
            <StatusAlert state={buildingState} />
            <label className={LABEL_CLASSES}>
              {t.masterData.buildings.dormitory} *
              <select
                name="dormitoryId"
                required
                defaultValue={dormitories[0]?.id ?? ""}
                className={INPUT_CLASSES}
              >
                {dormitories.map((dorm) => (
                  <option key={dorm.id} value={dorm.id}>
                    {dorm.code} — {dorm.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL_CLASSES}>
                {t.masterData.buildings.code} *
                <input
                  name="code"
                  required
                  placeholder="A"
                  className={INPUT_CLASSES}
                />
              </label>
              <label className={LABEL_CLASSES}>
                {t.masterData.buildings.name} *
                <input
                  name="name"
                  required
                  placeholder="ອາຄານ A"
                  className={INPUT_CLASSES}
                />
              </label>
            </div>
            <label className={LABEL_CLASSES}>
              {t.masterData.buildings.totalFloors} *
              <input
                name="totalFloors"
                type="number"
                min={1}
                max={50}
                defaultValue={3}
                required
                className={INPUT_CLASSES}
              />
            </label>
            <label className="flex items-center gap-2 pt-1 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                name="autoCreateFloors"
                defaultChecked
                className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{t.masterData.buildings.autoCreateFloors}</span>
            </label>
            <button
              type="submit"
              disabled={buildingPending || dormitories.length === 0}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {buildingPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              <span>
                {buildingPending
                  ? t.masterData.actions.saving
                  : t.masterData.buildings.submit}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7">
            {buildings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                {t.masterData.buildings.empty}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">{t.masterData.buildings.code}</th>
                      <th className="px-3 py-2.5">{t.masterData.buildings.name}</th>
                      <th className="px-3 py-2.5">{t.masterData.buildings.dormitory}</th>
                      <th className="px-3 py-2.5 text-right">{t.management.workflows.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {buildings.map((b) => (
                      <tr key={b.id}>
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                          {b.code}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          {b.name}
                        </td>
                        <td className="px-3 py-2.5">
                          {dormNameById.get(b.dormitoryId) ?? b.dormitoryId.slice(0, 8)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <DeleteItemButton resource="buildings" recordId={b.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 3. FLOORS TAB */}
      {activeTab === "floors" ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            {/* Bulk create floors 1..N */}
            <form
              action={bulkFloorFormAction}
              className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4"
              noValidate
            >
              <h3 className="text-sm font-semibold text-indigo-950">
                {t.masterData.floors.bulkTitle}
              </h3>
              <StatusAlert state={bulkFloorState} />
              <label className={LABEL_CLASSES}>
                {t.masterData.floors.building} *
                <select
                  name="buildingId"
                  required
                  defaultValue={buildings[0]?.id ?? ""}
                  className={INPUT_CLASSES}
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={LABEL_CLASSES}>
                  {t.masterData.floors.fromFloor}
                  <input
                    name="fromFloor"
                    type="number"
                    min={1}
                    max={50}
                    defaultValue={1}
                    required
                    className={INPUT_CLASSES}
                  />
                </label>
                <label className={LABEL_CLASSES}>
                  {t.masterData.floors.toFloor}
                  <input
                    name="toFloor"
                    type="number"
                    min={1}
                    max={50}
                    defaultValue={3}
                    required
                    className={INPUT_CLASSES}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={bulkFloorPending || buildings.length === 0}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {bulkFloorPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                <span>
                  {bulkFloorPending
                    ? t.masterData.actions.saving
                    : t.masterData.floors.bulkSubmit}
                </span>
              </button>
            </form>

            {/* Single floor creation */}
            <form
              action={floorFormAction}
              className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              noValidate
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {t.masterData.floors.addTitle}
              </h3>
              <StatusAlert state={floorState} />
              <label className={LABEL_CLASSES}>
                {t.masterData.floors.building} *
                <select
                  name="buildingId"
                  required
                  defaultValue={buildings[0]?.id ?? ""}
                  className={INPUT_CLASSES}
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={LABEL_CLASSES}>
                  {t.masterData.floors.floorNumber} *
                  <input
                    name="floorNumber"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={1}
                    required
                    className={INPUT_CLASSES}
                  />
                </label>
                <label className={LABEL_CLASSES}>
                  {t.masterData.floors.name}
                  <input
                    name="name"
                    placeholder="ຊັ້ນ 1"
                    className={INPUT_CLASSES}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={floorPending || buildings.length === 0}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {floorPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                <span>
                  {floorPending
                    ? t.masterData.actions.saving
                    : t.masterData.floors.submit}
                </span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7">
            {floors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                {t.masterData.floors.empty}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">{t.masterData.floors.floorNumber}</th>
                      <th className="px-3 py-2.5">{t.masterData.floors.name}</th>
                      <th className="px-3 py-2.5">{t.masterData.floors.building}</th>
                      <th className="px-3 py-2.5 text-right">{t.management.workflows.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...floors]
                      .sort((a, b) => a.floorNumber - b.floorNumber)
                      .map((f) => (
                        <tr key={f.id}>
                          <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                            {f.floorNumber}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            {f.name || `ຊັ້ນ ${f.floorNumber}`}
                          </td>
                          <td className="px-3 py-2.5">
                            {buildingNameById.get(f.buildingId) ??
                              f.buildingId.slice(0, 8)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <DeleteItemButton resource="floors" recordId={f.id} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 4. ROOM TYPES TAB */}
      {activeTab === "roomTypes" ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <form
            action={roomTypeFormAction}
            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:col-span-5"
            noValidate
          >
            <h3 className="text-sm font-semibold text-slate-900">
              {t.masterData.roomTypes.addTitle}
            </h3>
            <StatusAlert state={roomTypeState} />
            <label className={LABEL_CLASSES}>
              {t.masterData.roomTypes.dormitory} *
              <select
                name="dormitoryId"
                required
                defaultValue={dormitories[0]?.id ?? ""}
                className={INPUT_CLASSES}
              >
                {dormitories.map((dorm) => (
                  <option key={dorm.id} value={dorm.id}>
                    {dorm.code} — {dorm.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL_CLASSES}>
                {t.masterData.roomTypes.code} *
                <input
                  name="code"
                  required
                  placeholder="STD"
                  className={INPUT_CLASSES}
                />
              </label>
              <label className={LABEL_CLASSES}>
                {t.masterData.roomTypes.name} *
                <input
                  name="name"
                  required
                  placeholder="ຫ້ອງມາດຕະຖານ (Single)"
                  className={INPUT_CLASSES}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL_CLASSES}>
                {t.masterData.roomTypes.monthlyRent} *
                <input
                  name="monthlyRent"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={1500000}
                  required
                  className={INPUT_CLASSES}
                />
              </label>
              <label className={LABEL_CLASSES}>
                {t.masterData.roomTypes.depositAmount} *
                <input
                  name="depositAmount"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={1500000}
                  required
                  className={INPUT_CLASSES}
                />
              </label>
            </div>
            <label className={LABEL_CLASSES}>
              {t.masterData.roomTypes.maximumOccupants} *
              <input
                name="maximumOccupants"
                type="number"
                min={1}
                max={20}
                defaultValue={2}
                required
                className={INPUT_CLASSES}
              />
            </label>
            <button
              type="submit"
              disabled={roomTypePending || dormitories.length === 0}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {roomTypePending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              <span>
                {roomTypePending
                  ? t.masterData.actions.saving
                  : t.masterData.roomTypes.submit}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7">
            {roomTypes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                {t.masterData.roomTypes.empty}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">{t.masterData.roomTypes.code}</th>
                      <th className="px-3 py-2.5">{t.masterData.roomTypes.name}</th>
                      <th className="px-3 py-2.5">{t.masterData.roomTypes.monthlyRent}</th>
                      <th className="px-3 py-2.5">{t.masterData.roomTypes.depositAmount}</th>
                      <th className="px-3 py-2.5 text-right">{t.management.workflows.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roomTypes.map((rt) => (
                      <tr key={rt.id}>
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                          {rt.code}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          {rt.name}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-emerald-700">
                          {formatCurrency(rt.monthlyRent)}
                        </td>
                        <td className="px-3 py-2.5">
                          {formatCurrency(rt.depositAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <DeleteItemButton resource="room-types" recordId={rt.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MasterDataManager({
  options,
  embedded = false,
}: {
  options: RoomCreationOptions;
  embedded?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || embedded) return;
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
  }, [isOpen, embedded]);

  if (embedded) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <header className="mb-5 space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {t.masterData.title}
          </h3>
          <p className="text-sm text-slate-500">{t.masterData.subtitle}</p>
        </header>
        <MasterDataContent options={options} />
      </section>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        <Settings2 className="size-4" aria-hidden="true" />
        {t.masterData.trigger}
      </button>

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
            className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl outline-none sm:p-6"
          >
            <header className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                  {t.masterData.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t.masterData.subtitle}
                </p>
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

            <MasterDataContent options={options} />
          </section>
        </div>
      ) : null}
    </div>
  );
}
