"use client";

import { useMemo, useState } from "react";
import { Car, Bike, Search, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ManagementRecords } from "@/lib/api/management";
import type { ManagementSelectOption } from "@/lib/management-workflows";
import { ManagementWorkflowForm } from "@/components/management/management-workflow-form";

interface ParkingViewProps {
  records: ManagementRecords;
  lookupOptions?: Record<string, ManagementSelectOption[]>;
}

export function ParkingView({ records, lookupOptions }: ParkingViewProps) {
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const resolveLookup = (key: string, val: unknown) => {
    if (!val || typeof val !== "string" || !lookupOptions?.[key]) return String(val ?? "—");
    return lookupOptions[key].find((opt) => opt.value === val)?.label ?? val;
  };

  const filteredItems = useMemo(() => {
    return records.items.filter((item) => {
      const type = String(item.vehicleType ?? "").toLowerCase();
      if (vehicleTypeFilter !== "all" && type !== vehicleTypeFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const plate = String(item.licensePlate ?? "").toLowerCase();
        const brand = String(item.brand ?? "").toLowerCase();
        const spot = String(item.parkingSpotLabel ?? "").toLowerCase();
        const room = resolveLookup("roomId", item.roomId).toLowerCase();
        const tenant = resolveLookup("tenantId", item.tenantId).toLowerCase();
        return (
          plate.includes(q) ||
          brand.includes(q) ||
          spot.includes(q) ||
          room.includes(q) ||
          tenant.includes(q)
        );
      }
      return true;
    });
  }, [records.items, vehicleTypeFilter, search, lookupOptions]);

  const carCount = records.items.filter(
    (i) => String(i.vehicleType ?? "").toLowerCase() === "car",
  ).length;
  const motoCount = records.items.filter(
    (i) => String(i.vehicleType ?? "").toLowerCase() === "motorcycle",
  ).length;

  return (
    <div className="space-y-4">
      {/* Top Metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setVehicleTypeFilter("all")}
          className={cn(
            "rounded-2xl border p-4 text-left transition shadow-sm",
            vehicleTypeFilter === "all"
              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            ຍານພາຫະນະທັງໝົດ
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{records.items.length}</p>
        </button>

        <button
          type="button"
          onClick={() => setVehicleTypeFilter("car")}
          className={cn(
            "rounded-2xl border p-4 text-left transition shadow-sm",
            vehicleTypeFilter === "car"
              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              ລົດໃຫຍ່ (Cars)
            </p>
            <Car className="size-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-900">{carCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setVehicleTypeFilter("motorcycle")}
          className={cn(
            "rounded-2xl border p-4 text-left transition shadow-sm",
            vehicleTypeFilter === "motorcycle"
              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              ລົດຈັກ (Motorcycles)
            </p>
            <Bike className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{motoCount}</p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-end">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາປ້າຍທະບຽນ, ຫ້ອງ, ເຈົ້າຂອງ..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 shadow-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Vehicle Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          ບໍ່ພົບລາຍການຍານພາຫະນະ
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const id = String(item.id);
            const plate = String(item.licensePlate ?? "—");
            const type = String(item.vehicleType ?? "Car");
            const brand = item.brand ? String(item.brand) : "";
            const color = item.color ? String(item.color) : "";
            const spot = item.parkingSpotLabel ? String(item.parkingSpotLabel) : "ບໍ່ມີຊ່ອງ";
            const roomText = resolveLookup("roomId", item.roomId);
            const tenantText = resolveLookup("tenantId", item.tenantId);
            const isCar = type.toLowerCase() === "car";

            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Vehicle Icon & Spot Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {isCar ? (
                        <Car className="size-3.5 text-indigo-600" />
                      ) : (
                        <Bike className="size-3.5 text-amber-600" />
                      )}
                      {isCar ? "ລົດໃຫຍ່" : "ລົດຈັກ"}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      ບ່ອນຈອດ: {spot}
                    </span>
                  </div>

                  {/* License Plate Graphic */}
                  <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-amber-400 bg-amber-50/70 p-3 shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                      LAOS • ປ້າຍທະບຽນ
                    </p>
                    <p className="mt-0.5 font-mono text-lg font-black tracking-wide text-slate-900">
                      {plate}
                    </p>
                  </div>

                  {/* Vehicle details */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span>ຍີ່ຫໍ້: <span className="font-semibold text-slate-800">{brand || "—"}</span></span>
                    <span>ສີ: <span className="font-semibold text-slate-800">{color || "—"}</span></span>
                  </div>

                  {/* Room & Owner */}
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">ຫ້ອງ</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{roomText}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">ເຈົ້າຂອງລົດ</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{tenantText}</p>
                    </div>
                  </div>
                </div>

                {/* Release Action */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <ManagementWorkflowForm
                    compact
                    resource="parking"
                    operation="release"
                    fields={[]}
                    recordId={id}
                    submitLabel="ຍົກເລີກ / ປ່ອຍຊ່ອງຈອດ"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

