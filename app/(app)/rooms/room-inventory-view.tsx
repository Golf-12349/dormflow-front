"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  LayoutGrid,
  LayoutList,
  Receipt,
  Search,
  User,
  UserCheck,
  UserPlus,
  Wrench,
} from "lucide-react";

import { t } from "@/lib/i18n";
import {
  cn,
  formatCurrency,
} from "@/lib/utils";
import { RoomDetailDrawer, type UtilityRates } from "./room-detail-drawer";
import { StatusBadge } from "./status-badge";
import { QuickCheckInModal } from "@/components/rooms/quick-check-in-modal";
import type { RoomCreationOptions } from "@/lib/api/dormflow";
import type {
  Invoice,
  MaintenanceItem,
  Room,
  RoomStatus,
  Tenant,
  UtilityReading,
} from "@/types";

export interface RoomItem extends Room {
  tenantName: string;
}

interface RoomInventoryViewProps {
  rooms: RoomItem[];
  /** Tenant per room id, for the detail drawer (5.6). */
  tenantsByRoomId: Record<string, Tenant>;
  /** Meter history per room id, newest period first, for the drawer. */
  readingsByRoomId: Record<string, UtilityReading[]>;
  invoicesByRoomId?: Record<string, Invoice[]>;
  maintenanceByRoomId?: Record<string, MaintenanceItem[]>;
  /** Utility pricing in use, shown in the drawer. */
  rates: UtilityRates;
  options?: RoomCreationOptions;
}

const ROOM_STATUSES: RoomStatus[] = [
  "vacant",
  "occupied",
  "maintenance",
  "reserved",
];

type FloorFilter = number | "all";
type StatusFilter = RoomStatus | "all";

const FLOOR_PARAM = "floor";
const STATUS_PARAM = "status";
const QUERY_PARAM = "q";
const SEARCH_DEBOUNCE_MS = 350;

interface FilterValues {
  floor: FloorFilter;
  status: StatusFilter;
  q: string;
}

function parseFloorFilter(raw: string | null, floors: number[]): FloorFilter {
  return floors.find((floor) => String(floor) === raw) ?? "all";
}

function parseStatusFilter(raw: string | null): StatusFilter {
  return ROOM_STATUSES.find((status) => status === raw) ?? "all";
}

export function RoomInventoryView({
  rooms: initialRooms,
  tenantsByRoomId,
  readingsByRoomId,
  invoicesByRoomId,
  maintenanceByRoomId,
  rates,
  options,
}: RoomInventoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local optimistic state for real-time reactivity
  const [localRooms, setLocalRooms] = useState<RoomItem[]>(initialRooms);
  useEffect(() => {
    setLocalRooms(initialRooms);
  }, [initialRooms]);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [quickCheckInRoom, setQuickCheckInRoom] = useState<RoomItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const roomTrigger = useRef<HTMLElement | null>(null);

  const floors = useMemo(() => {
    return [
      ...new Set(
        localRooms.map((room) =>
          room.floor > 0 && room.floor <= 200 ? room.floor : 1,
        ),
      ),
    ].sort((a, b) => a - b);
  }, [localRooms]);

  const floor = parseFloorFilter(searchParams.get(FLOOR_PARAM), floors);
  const status = parseStatusFilter(searchParams.get(STATUS_PARAM));

  const [query, setQuery] = useState(() => searchParams.get(QUERY_PARAM) ?? "");
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestParams = useRef(searchParams.toString());

  useEffect(() => {
    latestParams.current = searchParams.toString();
  }, [searchParams]);

  useEffect(
    () => () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
    },
    [],
  );

  function applyFilters(next: Partial<FilterValues>) {
    const params = new URLSearchParams(latestParams.current);

    const floorValue =
      next.floor ?? parseFloorFilter(params.get(FLOOR_PARAM), floors);
    const statusValue =
      next.status ?? parseStatusFilter(params.get(STATUS_PARAM));
    const queryValue = (next.q ?? params.get(QUERY_PARAM) ?? "").trim();

    if (floorValue === "all") params.delete(FLOOR_PARAM);
    else params.set(FLOOR_PARAM, String(floorValue));

    if (statusValue === "all") params.delete(STATUS_PARAM);
    else params.set(STATUS_PARAM, statusValue);

    if (queryValue === "") params.delete(QUERY_PARAM);
    else params.set(QUERY_PARAM, queryValue);

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (queryTimer.current) clearTimeout(queryTimer.current);
    queryTimer.current = setTimeout(() => {
      applyFilters({ q: value });
    }, SEARCH_DEBOUNCE_MS);
  }

  const needle = query.trim().toLowerCase();
  const visibleRooms = useMemo(() => {
    return localRooms.filter((room) => {
      if (floor !== "all" && room.floor !== floor) return false;
      if (status !== "all" && room.status !== status) return false;
      if (
        needle &&
        !room.number.toLowerCase().includes(needle) &&
        !room.tenantName.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [localRooms, floor, status, needle]);

  // Group rooms by floor (Roomie Room-Centric layout)
  const roomsByFloor = useMemo(() => {
    const map = new Map<number, RoomItem[]>();
    for (const room of visibleRooms) {
      const flr = room.floor > 0 && room.floor <= 200 ? room.floor : 1;
      if (!map.has(flr)) map.set(flr, []);
      map.get(flr)!.push(room);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [visibleRooms]);

  // Overall Statistics
  const totalCount = localRooms.length;
  const vacantCount = localRooms.filter((r) => r.status === "vacant").length;
  const occupiedCount = localRooms.filter((r) => r.status === "occupied").length;
  const maintCount = localRooms.filter(
    (r) => r.status === "maintenance" || r.status === "reserved",
  ).length;
  const occupancyRate =
    totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  const selectedRoom = selectedRoomId
    ? localRooms.find((room) => room.id === selectedRoomId) ?? null
    : null;

  function openRoom(roomId: string, trigger: HTMLElement) {
    roomTrigger.current = trigger;
    setSelectedRoomId(roomId);
  }

  function closeRoom() {
    setSelectedRoomId(null);
    roomTrigger.current?.focus();
    roomTrigger.current = null;
  }

  const handleQuickCheckInSuccess = (updatedRoom: RoomItem, tenantName: string) => {
    // Immediate optimistic update: color switches to Red immediately
    setLocalRooms((prev) =>
      prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)),
    );
    setToastMessage(`ເອົາຜູ້ເຊົ່າ "${tenantName}" ເຂົ້າພັກຫ້ອງ ${updatedRoom.number} ສຳເລັດແລ້ວ!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Roomie Top Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Rooms */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              ຫ້ອງພັກທັງໝົດ
            </span>
            <Home className="size-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500">ຫ້ອງ</span>
          </div>
        </div>

        {/* Vacant Rooms (Green) */}
        <div
          onClick={() => applyFilters({ status: "vacant" })}
          className={cn(
            "cursor-pointer rounded-2xl border-2 p-4 transition-all shadow-xs",
            status === "vacant"
              ? "border-emerald-500 bg-emerald-50/80 shadow-emerald-500/10 shadow-md"
              : "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300 hover:bg-emerald-50/60",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              ຫ້ອງຫວ່າງ (Vacant)
            </span>
            <UserPlus className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">
              {vacantCount}
            </span>
            <span className="text-xs font-medium text-emerald-700">
              ພ້ອມເຂົ້າພັກ
            </span>
          </div>
        </div>

        {/* Occupied Rooms (Red) */}
        <div
          onClick={() => applyFilters({ status: "occupied" })}
          className={cn(
            "cursor-pointer rounded-2xl border-2 p-4 transition-all shadow-xs",
            status === "occupied"
              ? "border-rose-500 bg-rose-50/80 shadow-rose-500/10 shadow-md"
              : "border-rose-200 bg-rose-50/30 hover:border-rose-300 hover:bg-rose-50/60",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              ມີຜູ້ເຊົ່າ (Occupied)
            </span>
            <UserCheck className="size-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-900">
              {occupiedCount}
            </span>
            <span className="text-xs font-medium text-rose-700">
              {occupancyRate}% ຂອງທັງໝົດ
            </span>
          </div>
        </div>

        {/* Maintenance / Reserved (Yellow) */}
        <div
          onClick={() => applyFilters({ status: "maintenance" })}
          className={cn(
            "cursor-pointer rounded-2xl border-2 p-4 transition-all shadow-xs",
            status === "maintenance" || status === "reserved"
              ? "border-amber-500 bg-amber-50/80 shadow-amber-500/10 shadow-md"
              : "border-amber-200 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50/60",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              ສ້ອມແປງ / ຈອງ
            </span>
            <Wrench className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">
              {maintCount}
            </span>
            <span className="text-xs font-medium text-amber-700">ຫ້ອງ</span>
          </div>
        </div>
      </div>

      {/* Filters Bar: Floor Tabs, Search, View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        {/* Floor Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => applyFilters({ floor: "all" })}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              floor === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            ທຸກຊັ້ນ
          </button>
          {floors.map((floorNum) => (
            <button
              key={floorNum}
              type="button"
              onClick={() => applyFilters({ floor: floorNum })}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                floor === floorNum
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              ຊັ້ນ {floorNum}
            </button>
          ))}
        </div>

        {/* Search Input & View Toggle */}
        <div className="flex flex-1 items-center justify-end gap-2.5 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="ຄົ້ນຫາເລກຫ້ອງ ຫຼື ຊື່ຜູ້ເຊົ່າ..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pr-3 pl-9 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg p-1.5 text-slate-600 transition",
                viewMode === "grid"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "hover:text-slate-900",
              )}
              title="ມຸມມອງຜັງຫ້ອງ (Grid)"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-lg p-1.5 text-slate-600 transition",
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "hover:text-slate-900",
              )}
              title="ມຸມມອງຕາຕະລາງ (List)"
            >
              <LayoutList className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Room View */}
      {visibleRooms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <Home className="mx-auto size-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            ບໍ່ພົບຫ້ອງພັກທີ່ກົງກັບເງື່ອນໄຂ
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            ລອງລຶບຕົວຕອງ ຫຼື ກົດປຸ່ມສ້າງຂໍ້ມູນຕົວຢ່າງ (Seed Demo Data) ດ້ານເທິງ
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Roomie Floor-by-Floor Grouped Grid */
        <div className="space-y-8">
          {roomsByFloor.map(([floorNumber, floorRooms]) => {
            const flrVacant = floorRooms.filter((r) => r.status === "vacant").length;
            const flrOccupied = floorRooms.filter((r) => r.status === "occupied").length;
            const flrMaint = floorRooms.filter(
              (r) => r.status === "maintenance" || r.status === "reserved",
            ).length;

            return (
              <section key={floorNumber} className="space-y-3.5">
                {/* Floor Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-xs">
                      {floorNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      ຊັ້ນ {floorNumber}
                    </h3>
                    <span className="text-xs text-slate-400">
                      ({floorRooms.length} ຫ້ອງ)
                    </span>
                  </div>

                  {/* Floor Stats */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 border border-emerald-200/60">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      ຫວ່າງ {flrVacant}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 font-semibold text-rose-700 border border-rose-200/60">
                      <span className="size-1.5 rounded-full bg-rose-500" />
                      ມີຜູ້ເຊົ່າ {flrOccupied}
                    </span>
                    {flrMaint > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700 border border-amber-200/60">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        ສ້ອມແປງ {flrMaint}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Grid of Rooms on this Floor */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {floorRooms.map((room) => {
                    const isVacant = room.status === "vacant";
                    const isOccupied = room.status === "occupied";
                    const isMaint =
                      room.status === "maintenance" || room.status === "reserved";

                    return (
                      <div
                        key={room.id}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-3xl border-2 p-5 transition-all duration-200 shadow-xs hover:shadow-md",
                          isVacant &&
                            "border-emerald-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/20",
                          isOccupied &&
                            "border-rose-300 bg-white hover:border-rose-500 hover:bg-rose-50/20",
                          isMaint &&
                            "border-amber-300 bg-white hover:border-amber-500 hover:bg-amber-50/20",
                        )}
                      >
                        <div>
                          {/* Room Number & Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "size-2.5 rounded-full shrink-0",
                                  isVacant && "bg-emerald-500 ring-4 ring-emerald-100",
                                  isOccupied && "bg-rose-500 ring-4 ring-rose-100",
                                  isMaint && "bg-amber-500 ring-4 ring-amber-100",
                                )}
                              />
                              <h4 className="text-xl font-black tracking-tight text-slate-900">
                                ຫ້ອງ {room.number}
                              </h4>
                            </div>

                            <StatusBadge status={room.status} />
                          </div>

                          {/* Room Type & Building */}
                          <p className="mt-1 text-xs text-slate-500">
                            {room.roomTypeName || "Standard"} ·{" "}
                            {room.buildingName || "ອາຄານ A"}
                          </p>

                          {/* Middle Section: Occupant or Vacant Info */}
                          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                            {isOccupied ? (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold tracking-wider text-rose-700 uppercase">
                                  ຜູ້ເຊົ່າປັດຈຸບັນ
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <User className="size-4 shrink-0 text-slate-500" />
                                  <p className="truncate text-sm font-bold text-slate-900">
                                    {room.tenantName}
                                  </p>
                                </div>
                              </div>
                            ) : isVacant ? (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                                  ສະຖານະຫ້ອງພັກ
                                </span>
                                <p className="text-xs font-semibold text-emerald-800">
                                  🟢 ຫ້ອງຫວ່າງພ້ອມເຂົ້າພັກ
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold tracking-wider text-amber-700 uppercase">
                                  ສະຖານະຫ້ອງພັກ
                                </span>
                                <p className="text-xs font-semibold text-amber-800">
                                  🟡 ຢູ່ໃນໄລຍະສ້ອມແປງ / ຈອງ
                                </p>
                              </div>
                            )}

                            {/* Monthly Rent */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                              <span className="text-xs text-slate-500">
                                ຄ່າເຊົ່າ:
                              </span>
                              <span className="text-sm font-extrabold text-slate-900">
                                {formatCurrency(room.monthlyRate)}
                                <span className="text-[11px] font-normal text-slate-400">
                                  /ເດືອນ
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Area (Room-Centric Interactive Buttons) */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {isVacant ? (
                            <button
                              type="button"
                              onClick={() => setQuickCheckInRoom(room)}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-[0.98]"
                            >
                              <UserPlus className="size-4" />
                              <span>+ ເອົາຜູ້ເຊົ່າເຂົ້າພັກດ່ວນ</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => openRoom(room.id, e.currentTarget)}
                              className="w-full inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 group-hover:border-slate-300"
                            >
                              <span className="flex items-center gap-1.5">
                                <Receipt className="size-3.5 text-slate-400" />
                                <span>ເບິ່ງສັນຍາ, ໃບບິນ & ມິເຕີ</span>
                              </span>
                              <ArrowRight className="size-3.5 text-slate-400 transition group-hover:translate-x-0.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* List / Table Mode */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="px-5 py-3.5">ເລກຫ້ອງ</th>
                  <th className="px-5 py-3.5">ຊັ້ນ</th>
                  <th className="px-5 py-3.5">ປະເພດຫ້ອງ</th>
                  <th className="px-5 py-3.5">ຄ່າເຊົ່າ</th>
                  <th className="px-5 py-3.5">ຜູ້ເຊົ່າປັດຈຸບັນ</th>
                  <th className="px-5 py-3.5">ສະຖານະ</th>
                  <th className="px-5 py-3.5 text-right">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-slate-50/60 transition"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ຫ້ອງ {room.number}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      ຊັ້ນ {room.floor}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {room.roomTypeName || "Standard"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {formatCurrency(room.monthlyRate)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {room.tenantName}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={room.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {room.status === "vacant" ? (
                        <button
                          type="button"
                          onClick={() => setQuickCheckInRoom(room)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          <UserPlus className="size-3.5" />
                          <span>ເຊັກອິນດ່ວນ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => openRoom(room.id, e.currentTarget)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <span>ລາຍລະອຽດ</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Check-in Modal (Instant 0-refresh Check-in) */}
      <QuickCheckInModal
        room={quickCheckInRoom}
        isOpen={Boolean(quickCheckInRoom)}
        onClose={() => setQuickCheckInRoom(null)}
        onSuccess={handleQuickCheckInSuccess}
      />

      {/* Room Detail Drawer (3 Tabs: Tenant & Lease, Invoices & Status, Meter History) */}
      {selectedRoom ? (
        <RoomDetailDrawer
          key={selectedRoom.id}
          room={selectedRoom}
          tenant={tenantsByRoomId[selectedRoom.id] ?? null}
          readings={readingsByRoomId[selectedRoom.id] ?? []}
          invoices={invoicesByRoomId?.[selectedRoom.id] ?? []}
          maintenanceRequests={maintenanceByRoomId?.[selectedRoom.id] ?? []}
          rates={rates}
          options={options}
          onClose={closeRoom}
        />
      ) : null}
    </div>
  );
}
