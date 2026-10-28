"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Copy, ExternalLink, Package, Search } from "lucide-react";

import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ManagementRecords } from "@/lib/api/management";
import type { ManagementSelectOption } from "@/lib/management-workflows";
import { ManagementWorkflowForm } from "@/components/management/management-workflow-form";

interface ParcelsViewProps {
  records: ManagementRecords;
  lookupOptions?: Record<string, ManagementSelectOption[]>;
}

export function ParcelsView({ records, lookupOptions }: ParcelsViewProps) {
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "pickedup">("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resolveLookup = (key: string, val: unknown) => {
    if (!val || typeof val !== "string" || !lookupOptions?.[key]) return String(val ?? "—");
    return lookupOptions[key].find((opt) => opt.value === val)?.label ?? val;
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredItems = useMemo(() => {
    return records.items.filter((item) => {
      const status = String(item.status ?? "").toLowerCase();
      const isPickedUp = status.includes("pick") || status.includes("received") || status.includes("completed");

      if (filterStatus === "pending" && isPickedUp) return false;
      if (filterStatus === "pickedup" && !isPickedUp) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const tracking = String(item.trackingNumber ?? "").toLowerCase();
        const courier = String(item.courierName ?? "").toLowerCase();
        const room = resolveLookup("roomId", item.roomId).toLowerCase();
        const tenant = resolveLookup("tenantId", item.tenantId).toLowerCase();
        return tracking.includes(q) || courier.includes(q) || room.includes(q) || tenant.includes(q);
      }
      return true;
    });
  }, [records.items, filterStatus, search, lookupOptions]);

  const pendingCount = records.items.filter((item) => {
    const s = String(item.status ?? "").toLowerCase();
    return !s.includes("pick") && !s.includes("received") && !s.includes("completed");
  }).length;

  const pickedUpCount = records.items.length - pendingCount;

  return (
    <div className="space-y-4">
      {/* Controls: Filter & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition",
              filterStatus === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            ທັງໝົດ ({records.items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition",
              filterStatus === "pending"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            ລໍຖ້າຮັບ ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pickedup")}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition",
              filterStatus === "pickedup"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            ຮັບແລ້ວ ({pickedUpCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາເລກພັສດຸ, ຫ້ອງ, ຂົນສົ່ງ..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 shadow-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Parcels */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          ບໍ່ພົບລາຍການພັສດຸທີ່ກົງກັບເງື່ອນໄຂ
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const id = String(item.id);
            const tracking = String(item.trackingNumber ?? "—");
            const courier = String(item.courierName ?? "ຂົນສົ່ງ");
            const status = String(item.status ?? "Arrived");
            const isPickedUp =
              status.toLowerCase().includes("pick") ||
              status.toLowerCase().includes("received") ||
              status.toLowerCase().includes("completed");

            const roomText = resolveLookup("roomId", item.roomId);
            const tenantText = resolveLookup("tenantId", item.tenantId);
            const arrivalDate = item.createdAt ? new Date(String(item.createdAt)).toLocaleDateString() : "—";

            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Courier badge & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      <Package className="size-3.5" />
                      {courier}
                    </span>

                    {isPickedUp ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                        <CheckCircle2 className="size-3" />
                        ຮັບແລ້ວ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                        <Clock className="size-3" />
                        ລໍຖ້າຮັບ
                      </span>
                    )}
                  </div>

                  {/* Tracking Number */}
                  <div className="mt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      ເລກພັສດຸ (Tracking)
                    </p>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 truncate">
                        {tracking}
                      </span>
                      {tracking !== "—" ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(tracking, id)}
                          title="Copy tracking"
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    {copiedId === id ? (
                      <span className="text-[10px] text-emerald-600">ຄັດລອກແລ້ວ!</span>
                    ) : null}
                  </div>

                  {/* Room & Tenant */}
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">ຫ້ອງ</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{roomText}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">ຜູ້ຮັບ</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{tenantText}</p>
                    </div>
                  </div>

                  {/* Description / Arrival Date */}
                  <p className="mt-2 text-xs text-slate-500">
                    ວັນທີມາຮອດ: <span className="font-medium text-slate-700">{arrivalDate}</span>
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2 italic">
                      &quot;{String(item.description)}&quot;
                    </p>
                  ) : null}
                </div>

                {/* Bottom Action */}
                {!isPickedUp ? (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <ManagementWorkflowForm
                      compact
                      resource="parcels"
                      operation="pickup"
                      fields={[]}
                      recordId={id}
                      submitLabel="ໝາຍວ່າຜູ້ເຊົ່າມາຮັບແລ້ວ"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

