"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Tool,
  Wrench,
  UserCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ManagementRecords } from "@/lib/api/management";
import type { ManagementField, ManagementSelectOption } from "@/lib/management-workflows";
import { ManagementWorkflowForm } from "@/components/management/management-workflow-form";

interface MaintenanceViewProps {
  records: ManagementRecords;
  lookupOptions?: Record<string, ManagementSelectOption[]>;
}

export function MaintenanceView({ records, lookupOptions }: MaintenanceViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const resolveLookup = (key: string, val: unknown) => {
    if (!val || typeof val !== "string" || !lookupOptions?.[key]) return String(val ?? "—");
    return lookupOptions[key].find((opt) => opt.value === val)?.label ?? val;
  };

  const statusFields: ManagementField[] = [
    {
      name: "status",
      type: "select",
      required: true,
      options: ["Reported", "Assigned", "InProgress", "Completed", "Cancelled"],
    },
  ];

  const filteredItems = useMemo(() => {
    return records.items.filter((item) => {
      const s = String(item.status ?? "").toLowerCase();
      const p = String(item.priority ?? "").toLowerCase();

      if (statusFilter !== "all") {
        if (statusFilter === "pending" && !["reported", "assigned"].includes(s)) return false;
        if (statusFilter === "in_progress" && s !== "inprogress") return false;
        if (statusFilter === "completed" && s !== "completed") return false;
      }

      if (priorityFilter !== "all" && p !== priorityFilter.toLowerCase()) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const title = String(item.title ?? "").toLowerCase();
        const desc = String(item.description ?? "").toLowerCase();
        const room = resolveLookup("roomId", item.roomId).toLowerCase();
        return title.includes(q) || desc.includes(q) || room.includes(q);
      }

      return true;
    });
  }, [records.items, statusFilter, priorityFilter, search, lookupOptions]);

  // Status counts
  const reportedCount = records.items.filter((i) =>
    ["reported", "assigned"].includes(String(i.status ?? "").toLowerCase()),
  ).length;
  const inProgressCount = records.items.filter((i) =>
    String(i.status ?? "").toLowerCase() === "inprogress",
  ).length;
  const completedCount = records.items.filter((i) =>
    String(i.status ?? "").toLowerCase() === "completed",
  ).length;

  return (
    <div className="space-y-4">
      {/* Top Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-2xl border p-4 text-left transition shadow-sm",
            statusFilter === "all"
              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            ທັງໝົດ (All)
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{records.items.length}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={cn(
            "rounded-2xl border p-4 text-left transition shadow-sm",
            statusFilter === "pending"
              ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-200"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              ລໍຖ້າດຳເນີນການ
            </p>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{reportedCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("in_progress")}
          className={cn(
            "rounded-2xl border p-4 text-left transition shadow-sm",
            statusFilter === "in_progress"
              ? "border-sky-500 bg-sky-50/50 ring-2 ring-sky-200"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              ກຳລັງສ້ອມແປງ
            </p>
            <Wrench className="size-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-900">{inProgressCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={cn(
            "rounded-2xl border p-4 text-left transition shadow-sm",
            statusFilter === "completed"
              ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              ສຳເລັດແລ້ວ
            </p>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{completedCount}</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none focus:border-indigo-500"
          >
            <option value="all">ທຸກລະດັບຄວາມດ່ວນ</option>
            <option value="Urgent">ດ່ວນທີ່ສຸດ (Urgent)</option>
            <option value="High">ສູງ (High)</option>
            <option value="Medium">ປານກາງ (Medium)</option>
            <option value="Low">ຕ່ຳ (Low)</option>
          </select>
        </div>

        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາລາຍການສ້ອມ, ຫ້ອງ..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 shadow-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Maintenance Cards */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          ບໍ່ພົບລາຍການແຈ້ງສ້ອມແປງ
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const id = String(item.id);
            const title = String(item.title ?? "ແຈ້ງສ້ອມແປງ");
            const category = String(item.category ?? "ທົ່ວໄປ");
            const priority = String(item.priority ?? "Normal");
            const status = String(item.status ?? "Reported");
            const description = item.description ? String(item.description) : "";
            const roomText = resolveLookup("roomId", item.roomId);
            const tenantText = resolveLookup("tenantId", item.tenantId);
            const techText = resolveLookup("assignedTechnicianId", item.assignedTechnicianId);

            const isUrgent = priority.toLowerCase() === "urgent";
            const isHigh = priority.toLowerCase() === "high";

            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  {/* Badges: Category & Priority */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <Wrench className="size-3.5 text-slate-500" />
                      {category}
                    </span>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        isUrgent
                          ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                          : isHigh
                            ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                            : "bg-slate-50 text-slate-600 ring-slate-500/20",
                      )}
                    >
                      {priority}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">
                    {title}
                  </h3>
                  {description ? (
                    <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                      {description}
                    </p>
                  ) : null}

                  {/* Room & Tenant Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">ຫ້ອງ</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{roomText}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">ຜູ້ແຈ້ງ</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{tenantText}</p>
                    </div>
                  </div>

                  {techText !== "—" ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <UserCheck className="size-3.5 text-indigo-500" />
                      <span>ຊ່າງ: <span className="font-semibold text-slate-700">{techText}</span></span>
                    </div>
                  ) : null}
                </div>

                {/* Status & Change Action */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-400">ສະຖານະ: </span>
                    <span className="font-semibold text-slate-800">{status}</span>
                  </div>

                  <ManagementWorkflowForm
                    compact
                    resource="maintenance-requests"
                    operation="status"
                    fields={statusFields}
                    recordId={id}
                    submitLabel="ປ່ຽນສະຖານະ"
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
