"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, LayoutList, Search } from "lucide-react";

import { t } from "@/lib/i18n";
import {
  ROOM_STATUS_LABELS,
  cn,
  formatCurrency,
  roomTypeLabel,
} from "@/lib/utils";
import { RoomDetailDrawer, type UtilityRates } from "./room-detail-drawer";
import { StatusBadge } from "./status-badge";
import type { RoomCreationOptions } from "@/lib/api/dormflow";
import type { Room, RoomStatus, Tenant, UtilityReading } from "@/types";

export interface RoomItem extends Room {
  tenantName: string;
}

interface RoomInventoryViewProps {
  rooms: RoomItem[];
  /** Tenant per room id, for the detail drawer (5.6). */
  tenantsByRoomId: Record<string, Tenant>;
  /** Meter history per room id, newest period first, for the drawer. */
  readingsByRoomId: Record<string, UtilityReading[]>;
  /** Utility pricing in use, shown in the drawer. */
  rates: UtilityRates;
  options?: RoomCreationOptions;
}

/** Legend order, also used by the status filter control. */
const ROOM_STATUSES: RoomStatus[] = [
  "occupied",
  "vacant",
  "maintenance",
  "reserved",
];

/** `"all"` keeps every floor; otherwise the filter holds one floor number. */
type FloorFilter = number | "all";

/** `"all"` keeps every status; otherwise the filter holds one `RoomStatus`. */
type StatusFilter = RoomStatus | "all";

/** Filter params kept in the URL (5.5); defaults are never written to it. */
const FLOOR_PARAM = "floor";
const STATUS_PARAM = "status";
const QUERY_PARAM = "q";

/** How long typing must pause before the search box syncs to the URL. */
const SEARCH_DEBOUNCE_MS = 350;

/** The three URL-backed filter values. */
interface FilterValues {
  floor: FloorFilter;
  status: StatusFilter;
  q: string;
}

/** `?floor=3` -> `3`, but only when that floor really exists in the data. */
function parseFloorFilter(raw: string | null, floors: number[]): FloorFilter {
  return floors.find((floor) => String(floor) === raw) ?? "all";
}

/** `?status=vacant` -> `"vacant"`; anything unknown means "all statuses". */
function parseStatusFilter(raw: string | null): StatusFilter {
  return ROOM_STATUSES.find((status) => status === raw) ?? "all";
}

const SEGMENT_GROUP_CLASSES =
  "inline-flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1";

const SEGMENT_BASE_CLASSES =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition";

const SEGMENT_ACTIVE_CLASSES = "bg-white text-slate-900 shadow-sm";
const SEGMENT_INACTIVE_CLASSES = "text-slate-600 hover:text-slate-900";

/**
 * Pill button shared by the view toggle, the floor tabs and the status control,
 * so every segmented control on this page looks and announces itself the same.
 */
function SegmentButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  /** Accessible name, only needed when the visible text is ambiguous. */
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        SEGMENT_BASE_CLASSES,
        active ? SEGMENT_ACTIVE_CLASSES : SEGMENT_INACTIVE_CLASSES,
      )}
    >
      {children}
    </button>
  );
}

export function RoomInventoryView({
  rooms,
  tenantsByRoomId,
  readingsByRoomId,
  rates,
  options,
}: RoomInventoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** 5.2 stays local on purpose — 5.5 only URL-persists the filters. */
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /** 5.6 — the drawer selection is local; URL state for it is out of scope. */
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  /** The card/row that opened the drawer, so focus can go back to it. */
  const roomTrigger = useRef<HTMLElement | null>(null);

  /** Floors come from the data, so a new floor needs no UI change. */
  const floors = [...new Set(rooms.map((room) => room.floor))].sort(
    (a, b) => a - b,
  );

  /** 5.5 — floor and status are read from the URL on every render. */
  const floor = parseFloorFilter(searchParams.get(FLOOR_PARAM), floors);
  const status = parseStatusFilter(searchParams.get(STATUS_PARAM));

  /** The input stays local so typing filters instantly; the URL catches up. */
  const [query, setQuery] = useState(() => searchParams.get(QUERY_PARAM) ?? "");
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Last committed params, so a debounced write cannot drop a newer filter. */
  const latestParams = useRef(searchParams.toString());
  useEffect(() => {
    latestParams.current = searchParams.toString();
  }, [searchParams]);

  /** Cancels a pending debounce when the screen goes away. */
  useEffect(
    () => () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
    },
    [],
  );

  /**
   * Writes the filters that changed into the URL, omitting any that sit at its
   * default so a bare `/rooms` still means "no filters". Unrelated params stay
   * untouched, and `replace` keeps filtering out of the history stack.
   */
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

  /** Instant local filtering (see `visibleRooms`), debounced URL sync. */
  function handleQueryChange(value: string) {
    setQuery(value);

    if (queryTimer.current) clearTimeout(queryTimer.current);
    queryTimer.current = setTimeout(() => {
      applyFilters({ q: value });
    }, SEARCH_DEBOUNCE_MS);
  }

  /**
   * 5.4 — the three filters (floor, status, room number) combine with AND and
   * are applied client-side to the rooms this component already received.
   */
  const needle = query.trim().toLowerCase();
  const visibleRooms = rooms.filter((room) => {
    if (floor !== "all" && room.floor !== floor) return false;
    if (status !== "all" && room.status !== status) return false;
    if (needle && !room.number.toLowerCase().includes(needle)) return false;
    return true;
  });

  const selectedRoom = selectedRoomId
    ? rooms.find((room) => room.id === selectedRoomId) ?? null
    : null;

  function openRoom(roomId: string, trigger: HTMLElement) {
    roomTrigger.current = trigger;
    setSelectedRoomId(roomId);
  }

  function closeRoom() {
    setSelectedRoomId(null);
    // Hand focus back to the card/row that opened the drawer.
    roomTrigger.current?.focus();
    roomTrigger.current = null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 5.3 — status legend */}
        <ul
          aria-label={t.rooms.legendLabel}
          className="flex flex-wrap items-center gap-2"
        >
          {ROOM_STATUSES.map((status) => (
            <li key={status}>
              <StatusBadge status={status} />
            </li>
          ))}
        </ul>

        {/* 5.2 — grid / list toggle (local state; URL state lands in 5.5) */}
        <div
          role="group"
          aria-label={t.rooms.viewModeLabel}
          className={SEGMENT_GROUP_CLASSES}
        >
          <SegmentButton
            active={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            label={t.rooms.view.gridAria}
          >
            <LayoutGrid className="size-3.5" aria-hidden="true" />
            <span>{t.rooms.view.grid}</span>
          </SegmentButton>
          <SegmentButton
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
            label={t.rooms.view.listAria}
          >
            <LayoutList className="size-3.5" aria-hidden="true" />
            <span>{t.rooms.view.list}</span>
          </SegmentButton>
        </div>
      </div>

      {/* 5.4 — floor tabs, status segments and room-number search (local state) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={t.rooms.filters.floorLabel}
            className={SEGMENT_GROUP_CLASSES}
          >
            <SegmentButton
              active={floor === "all"}
              onClick={() => applyFilters({ floor: "all" })}
            >
              {t.rooms.filters.allFloors}
            </SegmentButton>
            {floors.map((floorNumber) => (
              <SegmentButton
                key={floorNumber}
                active={floor === floorNumber}
                onClick={() => applyFilters({ floor: floorNumber })}
              >
                {t.rooms.floorLabel(floorNumber)}
              </SegmentButton>
            ))}
          </div>

          <div
            role="group"
            aria-label={t.rooms.filters.statusLabel}
            className={SEGMENT_GROUP_CLASSES}
          >
            <SegmentButton
              active={status === "all"}
              onClick={() => applyFilters({ status: "all" })}
            >
              {t.rooms.filters.allStatuses}
            </SegmentButton>
            {ROOM_STATUSES.map((roomStatus) => (
              <SegmentButton
                key={roomStatus}
                active={status === roomStatus}
                onClick={() => applyFilters({ status: roomStatus })}
              >
                {ROOM_STATUS_LABELS[roomStatus]}
              </SegmentButton>
            ))}
          </div>

          <div className="relative min-w-56 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder={t.rooms.searchPlaceholder}
              aria-label={t.rooms.searchLabel}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-indigo-400"
            />
          </div>

          <p className="ml-auto text-xs text-slate-500">
            {t.rooms.resultCount(visibleRooms.length, rooms.length)}
          </p>
        </div>
      </div>

      {visibleRooms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">{t.rooms.noMatches}</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRooms.map((room) => (
            <article
              key={room.id}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              {/* Full-card overlay button, so the card is keyboard-activatable. */}
              <button
                type="button"
                onClick={(event) => openRoom(room.id, event.currentTarget)}
                aria-label={t.rooms.openDetailsAria(room.number)}
                className="absolute inset-0 rounded-2xl"
              />
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t.rooms.roomTitle(room.number)}
                  </h3>
                  <StatusBadge status={room.status} />
                </div>
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
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {t.rooms.fields.tenant}
                  </p>
                  <p className="truncate text-sm font-medium text-slate-700">
                    {room.tenantName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-slate-900">
                    {formatCurrency(room.monthlyRate)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.rooms.fields.perMonth}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    {t.rooms.fields.number}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.rooms.fields.floor}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.rooms.fields.type}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.rooms.fields.rate}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.rooms.fields.tenant}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.rooms.fields.status}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRooms.map((room) => (
                  <tr
                    key={room.id}
                    role="button"
                    tabIndex={0}
                    aria-label={t.rooms.openDetailsAria(room.number)}
                    onClick={(event) => openRoom(room.id, event.currentTarget)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openRoom(room.id, event.currentTarget);
                      }
                    }}
                    className="cursor-pointer transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {t.rooms.roomTitle(room.number)}
                    </td>
                    <td className="px-5 py-3.5">
                      {[room.buildingName, room.floorName || t.rooms.floorLabel(room.floor)].filter(Boolean).join(" · ")}
                    </td>
                    <td className="px-5 py-3.5">
                      {room.roomTypeName || (t.rooms.types[room.type] ?? roomTypeLabel(room.type))}
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 font-medium">
                      {formatCurrency(room.monthlyRate)}
                      <span className="text-xs text-slate-400 font-normal">
                        {" "}
                        {t.rooms.fields.perMonth}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{room.tenantName}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={room.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRoom ? (
        <RoomDetailDrawer
          key={selectedRoom.id}
          room={selectedRoom}
          tenant={tenantsByRoomId[selectedRoom.id] ?? null}
          readings={readingsByRoomId[selectedRoom.id] ?? []}
          rates={rates}
          options={options}
          onClose={closeRoom}
        />
      ) : null}
    </div>
  );
}
