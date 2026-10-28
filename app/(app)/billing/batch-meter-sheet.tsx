"use client";

import { useTransition, useState, useMemo } from "react";
import { AlertCircle, CheckCircle2, Copy, Loader2, Save, TableProperties } from "lucide-react";
import { useRouter } from "next/navigation";

import { batchSaveMeterReadingsAction, type BatchMeterEntryItem } from "@/lib/actions/billing";
import { t } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";
import type { MeterRoom } from "./meter-entry";

interface BatchMeterSheetProps {
  rooms: MeterRoom[];
  period: string;
  periodLabel: string;
  canRecord: boolean;
  rates: { electricPerKwh: number; waterPerCubicMeter: number };
}

interface RowState {
  electricCurrent: string;
  waterCurrent: string;
}

export function BatchMeterSheet({
  rooms,
  period,
  periodLabel,
  canRecord,
  rates,
}: BatchMeterSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);

  // Extract floors
  const floors = useMemo(() => {
    return [...new Set(rooms.map((r) => r.room.floor))].sort((a, b) => a - b);
  }, [rooms]);

  // Initial input state for each room
  const [rowInputs, setRowInputs] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    for (const r of rooms) {
      if (r.kind.kind === "recorded") {
        initial[r.room.id] = {
          electricCurrent: String(r.kind.reading.electricCurrent),
          waterCurrent: String(r.kind.reading.waterCurrent),
        };
      } else {
        initial[r.room.id] = {
          electricCurrent: "",
          waterCurrent: "",
        };
      }
    }
    return initial;
  });

  const handleInputChange = (
    roomId: string,
    field: "electricCurrent" | "waterCurrent",
    val: string,
  ) => {
    setRowInputs((prev) => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] ?? { electricCurrent: "", waterCurrent: "" }),
        [field]: val,
      },
    }));
  };

  // Helper: auto-fill previous readings for all rooms that don't have inputs yet
  const handleFillPreviousAll = () => {
    setRowInputs((prev) => {
      const updated = { ...prev };
      for (const r of rooms) {
        if (r.kind.kind === "editable") {
          const prevE = r.kind.previous?.electric ?? 0;
          const prevW = r.kind.previous?.water ?? 0;
          updated[r.room.id] = {
            electricCurrent: updated[r.room.id]?.electricCurrent || String(prevE),
            waterCurrent: updated[r.room.id]?.waterCurrent || String(prevW),
          };
        }
      }
      return updated;
    });
  };

  // Filter visible rooms by floor
  const visibleRooms = useMemo(() => {
    return rooms.filter((r) => selectedFloor === "all" || r.room.floor === selectedFloor);
  }, [rooms, selectedFloor]);

  // Determine which rooms have complete inputs ready to be saved
  const pendingToSave = useMemo(() => {
    const list: BatchMeterEntryItem[] = [];
    for (const r of visibleRooms) {
      if (r.kind.kind === "editable") {
        const inp = rowInputs[r.room.id];
        if (inp && inp.electricCurrent.trim() !== "" && inp.waterCurrent.trim() !== "") {
          const ec = Number(inp.electricCurrent);
          const wc = Number(inp.waterCurrent);
          const ep = r.kind.previous?.electric ?? 0;
          const wp = r.kind.previous?.water ?? 0;
          if (Number.isFinite(ec) && Number.isFinite(wc)) {
            list.push({
              roomId: r.room.id,
              roomNumber: r.room.number,
              electricPrevious: ep,
              electricCurrent: ec,
              waterPrevious: wp,
              waterCurrent: wc,
            });
          }
        }
      }
    }
    return list;
  }, [visibleRooms, rowInputs]);

  // Save all ready rows
  const handleSaveAll = () => {
    if (pendingToSave.length === 0) return;
    setBatchErrors([]);
    setBatchSuccess(null);

    startTransition(async () => {
      const res = await batchSaveMeterReadingsAction(period, pendingToSave);
      if (res.savedCount > 0) {
        setBatchSuccess(`ບັນທຶກສຳເລັດ ${res.savedCount} ຫ້ອງ`);
        router.refresh();
      }
      if (res.errors.length > 0) {
        setBatchErrors(res.errors);
      }
    });
  };

  // Save single room
  const handleSaveRow = (entry: BatchMeterEntryItem) => {
    setBatchErrors([]);
    setBatchSuccess(null);

    startTransition(async () => {
      const res = await batchSaveMeterReadingsAction(period, [entry]);
      if (res.savedCount > 0) {
        setBatchSuccess(`ບັນທຶກຫ້ອງ ${entry.roomNumber} ສຳເລັດ`);
        router.refresh();
      }
      if (res.errors.length > 0) {
        setBatchErrors(res.errors);
      }
    });
  };

  const recordedCount = rooms.filter((r) => r.kind.kind === "recorded").length;
  const editableCount = rooms.filter((r) => r.kind.kind === "editable").length;

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {batchSuccess ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{batchSuccess}</span>
        </div>
      ) : null}

      {batchErrors.length > 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ ({batchErrors.length} ລາຍການ)</span>
          </div>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-rose-700">
            {batchErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Control bar: Floor filter & Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Floor filters */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setSelectedFloor("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition",
              selectedFloor === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            ທຸກຊັ້ນ ({rooms.length})
          </button>
          {floors.map((fl) => {
            const count = rooms.filter((r) => r.room.floor === fl).length;
            return (
              <button
                key={fl}
                type="button"
                onClick={() => setSelectedFloor(fl)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                  selectedFloor === fl
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                ຊັ້ນ {fl} ({count})
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canRecord && editableCount > 0 ? (
            <button
              type="button"
              onClick={handleFillPreviousAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Copy className="size-3.5 text-slate-500" />
              ໃສ່ຄ່າເກົ່າທັງໝົດ
            </button>
          ) : null}

          {canRecord ? (
            <button
              type="button"
              disabled={isPending || pendingToSave.length === 0}
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              ບັນທຶກທັງໝົດ ({pendingToSave.length})
            </button>
          ) : null}
        </div>
      </div>

      {/* Batch Sheet Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[55rem] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">ຫ້ອງ</th>
              <th scope="col" className="px-4 py-3">ໄຟຟ້າເກົ່າ</th>
              <th scope="col" className="px-4 py-3 min-w-[8rem]">ໄຟຟ້າໃໝ່</th>
              <th scope="col" className="px-4 py-3">ໜ່ວຍໄຟ</th>
              <th scope="col" className="px-4 py-3">ນ້ຳເກົ່າ</th>
              <th scope="col" className="px-4 py-3 min-w-[8rem]">ນ້ຳໃໝ່</th>
              <th scope="col" className="px-4 py-3">ໜ່ວຍນ້ຳ</th>
              <th scope="col" className="px-4 py-3 text-right">ປະມານການຄ່າໃຊ້ຈ່າຍ</th>
              <th scope="col" className="px-4 py-3 text-center">ສະຖານະ</th>
              <th scope="col" className="px-4 py-3 text-right">ຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRooms.map((entry) => {
              const { room, kind } = entry;
              const isRecorded = kind.kind === "recorded";
              const isBlocked = kind.kind === "blocked";

              const prevE = isRecorded
                ? kind.reading.electricPrevious
                : kind.kind === "editable"
                  ? (kind.previous?.electric ?? 0)
                  : 0;

              const prevW = isRecorded
                ? kind.reading.waterPrevious
                : kind.kind === "editable"
                  ? (kind.previous?.water ?? 0)
                  : 0;

              const currentInputs = rowInputs[room.id] ?? {
                electricCurrent: "",
                waterCurrent: "",
              };

              const currE = isRecorded
                ? kind.reading.electricCurrent
                : Number(currentInputs.electricCurrent);

              const currW = isRecorded
                ? kind.reading.waterCurrent
                : Number(currentInputs.waterCurrent);

              const unitsE = Number.isFinite(currE) && currE >= prevE ? currE - prevE : null;
              const unitsW = Number.isFinite(currW) && currW >= prevW ? currW - prevW : null;

              const costE = unitsE !== null ? unitsE * rates.electricPerKwh : 0;
              const costW = unitsW !== null ? unitsW * rates.waterPerCubicMeter : 0;
              const totalEst = costE + costW;

              const isRowReady =
                !isRecorded &&
                !isBlocked &&
                unitsE !== null &&
                unitsW !== null &&
                currentInputs.electricCurrent.trim() !== "" &&
                currentInputs.waterCurrent.trim() !== "";

              return (
                <tr
                  key={room.id}
                  className={cn(
                    "transition hover:bg-slate-50/70",
                    isRecorded && "bg-slate-50/40",
                  )}
                >
                  {/* Room number */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-semibold text-slate-900">{room.number}</div>
                    <div className="text-xs text-slate-400">ຊັ້ນ {room.floor}</div>
                  </td>

                  {/* Electric Previous */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                    {prevE.toLocaleString()}
                  </td>

                  {/* Electric Current Input */}
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {isRecorded ? (
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {kind.reading.electricCurrent.toLocaleString()}
                      </span>
                    ) : isBlocked ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <input
                        type="number"
                        min={prevE}
                        step="any"
                        disabled={!canRecord || isPending}
                        value={currentInputs.electricCurrent}
                        onChange={(e) =>
                          handleInputChange(room.id, "electricCurrent", e.target.value)
                        }
                        placeholder={`>= ${prevE}`}
                        className={cn(
                          "w-28 rounded-lg border px-2.5 py-1.5 font-mono text-xs text-slate-900 shadow-sm outline-none transition",
                          unitsE === null && currentInputs.electricCurrent !== ""
                            ? "border-rose-400 bg-rose-50"
                            : "border-slate-200 bg-white focus:border-indigo-500",
                        )}
                      />
                    )}
                  </td>

                  {/* Electric Units Used */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {unitsE !== null ? (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                        +{unitsE.toLocaleString()} kWh
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Water Previous */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                    {prevW.toLocaleString()}
                  </td>

                  {/* Water Current Input */}
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {isRecorded ? (
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {kind.reading.waterCurrent.toLocaleString()}
                      </span>
                    ) : isBlocked ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <input
                        type="number"
                        min={prevW}
                        step="any"
                        disabled={!canRecord || isPending}
                        value={currentInputs.waterCurrent}
                        onChange={(e) =>
                          handleInputChange(room.id, "waterCurrent", e.target.value)
                        }
                        placeholder={`>= ${prevW}`}
                        className={cn(
                          "w-28 rounded-lg border px-2.5 py-1.5 font-mono text-xs text-slate-900 shadow-sm outline-none transition",
                          unitsW === null && currentInputs.waterCurrent !== ""
                            ? "border-rose-400 bg-rose-50"
                            : "border-slate-200 bg-white focus:border-indigo-500",
                        )}
                      />
                    )}
                  </td>

                  {/* Water Units Used */}
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {unitsW !== null ? (
                      <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
                        +{unitsW.toLocaleString()} m³
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Estimated Cost */}
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800">
                    {totalEst > 0 ? (
                      <span>{formatCurrency(totalEst)}</span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    {isRecorded ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                        <CheckCircle2 className="size-3" />
                        ບັນທຶກແລ້ວ
                      </span>
                    ) : isBlocked ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        ຖືກລັອກ
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                        ລໍຖ້າຈົດ
                      </span>
                    )}
                  </td>

                  {/* Row Save Action */}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {!isRecorded && !isBlocked && isRowReady ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleSaveRow({
                            roomId: room.id,
                            roomNumber: room.number,
                            electricPrevious: prevE,
                            electricCurrent: currE,
                            waterPrevious: prevW,
                            waterCurrent: currW,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
                      >
                        <Save className="size-3" />
                        ບັນທຶກ
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
