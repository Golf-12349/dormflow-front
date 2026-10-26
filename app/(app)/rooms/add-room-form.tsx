"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, X } from "lucide-react";

import { createRoomAction } from "@/lib/actions/rooms";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import type { RoomCreationOptions } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { RoomStatusFormState } from "@/types";

const INITIAL_CREATE_STATE: RoomStatusFormState = {
  status: "idle",
  message: null,
};

const LABEL_CLASSES = "block text-sm font-medium text-slate-700";
const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none focus:border-indigo-400";

interface AddRoomFormProps {
  options: RoomCreationOptions;
}

export function AddRoomForm({ options }: AddRoomFormProps) {
  const { buildings, floors, roomTypes } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createRoomAction,
    INITIAL_CREATE_STATE,
  );
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    buildings[0]?.id ?? "",
  );

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId],
  );

  const filteredFloors = useMemo(() => {
    if (!selectedBuilding) return floors;
    return floors
      .filter((floor) => floor.buildingId === selectedBuilding.id)
      .sort((a, b) => a.floorNumber - b.floorNumber);
  }, [floors, selectedBuilding]);

  const filteredRoomTypes = useMemo(() => {
    if (!selectedBuilding) return roomTypes;
    return roomTypes.filter(
      (roomType) => roomType.dormitoryId === selectedBuilding.dormitoryId,
    );
  }, [roomTypes, selectedBuilding]);

  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    filteredFloors[0]?.id ?? "",
  );
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>(
    filteredRoomTypes[0]?.id ?? "",
  );
  const [monthlyRent, setMonthlyRent] = useState<string>(() => {
    const first = filteredRoomTypes[0];
    return first ? String(first.monthlyRent) : "";
  });
  const [depositAmount, setDepositAmount] = useState<string>(() => {
    const first = filteredRoomTypes[0];
    return first ? String(first.depositAmount) : "0";
  });
  const [maximumOccupants, setMaximumOccupants] = useState<string>(() => {
    const first = filteredRoomTypes[0];
    return first ? String(first.maximumOccupants) : "2";
  });

  function handleBuildingChange(buildingId: string) {
    setSelectedBuildingId(buildingId);
    const nextBuilding = buildings.find((item) => item.id === buildingId);
    const nextFloors = nextBuilding
      ? floors
          .filter((floor) => floor.buildingId === nextBuilding.id)
          .sort((a, b) => a.floorNumber - b.floorNumber)
      : floors;
    const nextRoomTypes = nextBuilding
      ? roomTypes.filter(
          (roomType) => roomType.dormitoryId === nextBuilding.dormitoryId,
        )
      : roomTypes;
    setSelectedFloorId(nextFloors[0]?.id ?? "");
    const firstType = nextRoomTypes[0];
    setSelectedRoomTypeId(firstType?.id ?? "");
    if (firstType) {
      setMonthlyRent(String(firstType.monthlyRent));
      setDepositAmount(String(firstType.depositAmount));
      setMaximumOccupants(String(firstType.maximumOccupants));
    }
  }

  function handleRoomTypeChange(roomTypeId: string) {
    setSelectedRoomTypeId(roomTypeId);
    const matched = roomTypes.find((item) => item.id === roomTypeId);
    if (matched) {
      setMonthlyRent(String(matched.monthlyRent));
      setDepositAmount(String(matched.depositAmount));
      setMaximumOccupants(String(matched.maximumOccupants));
    }
  }

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  return (
    <div>
      <ActionResultToast state={state} />
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
      >
        <Plus className="size-4" aria-hidden="true" />
        {t.rooms.add.trigger}
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
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl outline-none sm:p-6"
          >
            <header className="mb-5 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {t.rooms.add.title}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t.common.close}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            {buildings.length === 0 ? (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                {t.rooms.add.noBuildingsHint}
              </p>
            ) : null}

            <form action={formAction} className="space-y-5" noValidate>
              {state.status !== "idle" && state.message ? (
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
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="add-room-building" className={LABEL_CLASSES}>
                    {t.rooms.add.building}
                  </label>
                  <select
                    id="add-room-building"
                    name="buildingId"
                    value={selectedBuildingId}
                    onChange={(event) => handleBuildingChange(event.target.value)}
                    required
                    className={INPUT_CLASSES}
                  >
                    {buildings.length === 0 ? (
                      <option value="">{t.rooms.add.selectBuilding}</option>
                    ) : null}
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.code} — {building.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="add-room-floor" className={LABEL_CLASSES}>
                    {t.rooms.add.floor}
                  </label>
                  <select
                    id="add-room-floor"
                    name="floorId"
                    value={selectedFloorId}
                    onChange={(event) => setSelectedFloorId(event.target.value)}
                    required
                    className={INPUT_CLASSES}
                  >
                    {filteredFloors.length === 0 ? (
                      <option value="">{t.rooms.add.selectFloor}</option>
                    ) : null}
                    {filteredFloors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.name || `ຊັ້ນ ${floor.floorNumber}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="add-room-type" className={LABEL_CLASSES}>
                    {t.rooms.add.roomType}
                  </label>
                  <select
                    id="add-room-type"
                    name="roomTypeId"
                    value={selectedRoomTypeId}
                    onChange={(event) => handleRoomTypeChange(event.target.value)}
                    required
                    className={INPUT_CLASSES}
                  >
                    {filteredRoomTypes.length === 0 ? (
                      <option value="">{t.rooms.add.selectRoomType}</option>
                    ) : null}
                    {filteredRoomTypes.map((roomType) => (
                      <option key={roomType.id} value={roomType.id}>
                        {roomType.code} — {roomType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="add-room-number" className={LABEL_CLASSES}>
                    {t.rooms.add.roomNumber}
                  </label>
                  <input
                    id="add-room-number"
                    name="roomNumber"
                    type="text"
                    required
                    placeholder="ເຊັ່ນ 101, A-201"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="add-room-rent" className={LABEL_CLASSES}>
                    {t.rooms.add.monthlyRent}
                  </label>
                  <input
                    id="add-room-rent"
                    name="monthlyRent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(event.target.value)}
                    required
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="add-room-deposit" className={LABEL_CLASSES}>
                    {t.rooms.add.depositAmount}
                  </label>
                  <input
                    id="add-room-deposit"
                    name="depositAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                    required
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="add-room-occupants" className={LABEL_CLASSES}>
                    {t.rooms.add.maximumOccupants}
                  </label>
                  <input
                    id="add-room-occupants"
                    name="maximumOccupants"
                    type="number"
                    min="1"
                    step="1"
                    value={maximumOccupants}
                    onChange={(event) => setMaximumOccupants(event.target.value)}
                    required
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="add-room-description" className={LABEL_CLASSES}>
                    {t.rooms.add.description}
                  </label>
                  <input
                    id="add-room-description"
                    name="description"
                    type="text"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending || buildings.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>{t.rooms.add.saving}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" aria-hidden="true" />
                      <span>{t.rooms.add.submit}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

