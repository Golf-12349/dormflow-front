"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { t } from "@/lib/i18n";
import {
  TENANT_STATUS_BADGE_CLASSES,
  TENANT_STATUS_LABELS,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import { TenantDetailDrawer } from "./tenant-detail-drawer";
import { TenantRowMenu } from "./tenant-row-menu";
import type { Invoice, Room, Tenant, TenantStatus } from "@/types";

type SortKey = "name" | "balance" | "leaseEnd";
type SortDirection = "asc" | "desc";
type SortState = { key: SortKey; direction: SortDirection } | null;
type StatusFilter = TenantStatus | "all";

/** What the profile drawer opens on: which tenant, plus "now" for 6.4. */
type TenantSelection = { tenantId: string; nowMs: number };

/**
 * Builds that selection, sampling the clock at click time.
 *
 * The impure `Date.now()` call lives at module scope — the same trick
 * `formatRelativeTime` uses for `new Date()` (`lib/utils.ts`) — because
 * `react-hooks/purity` forbids reading the clock during component render,
 * while event handlers (which are where this runs) are allowed to be impure.
 */
function openSelection(tenantId: string): TenantSelection {
  return { tenantId, nowMs: Date.now() };
}

/** Status filter order (drives the segmented control options). */
const TENANT_STATUSES: TenantStatus[] = ["active", "pending", "inactive"];

/**
 * Shared segmented-control classes, mirroring `room-inventory-view.tsx` so the
 * status filter on this page looks and announces itself the same way.
 */
const SEGMENT_GROUP_CLASSES =
  "inline-flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1";
const SEGMENT_BASE_CLASSES =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition";
const SEGMENT_ACTIVE_CLASSES = "bg-white text-slate-900 shadow-sm";
const SEGMENT_INACTIVE_CLASSES = "text-slate-600 hover:text-slate-900";

/** Pill button shared by the status filter, matching the Rooms control. */
function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        SEGMENT_BASE_CLASSES,
        active ? SEGMENT_ACTIVE_CLASSES : SEGMENT_INACTIVE_CLASSES,
      )}
    >
      {children}
    </button>
  );
}

/** A sortable column header: click to sort, click again to flip direction. */
function SortableHeader({
  label,
  column,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === column;
  const direction = active ? sort.direction : null;
  const Icon =
    direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <th scope="col" className="px-5 py-3">
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-label={`${label}${
          direction
            ? ` ${direction === "asc" ? t.tenants.sort.ascending : t.tenants.sort.descending}`
            : ""
        }`}
        className={cn(
          "inline-flex items-center gap-1 uppercase transition",
          align === "right" && "w-full justify-end",
          active ? "text-indigo-600" : "hover:text-slate-900",
        )}
      >
        <span>{label}</span>
        <Icon
          className={cn("size-3.5", active ? "text-indigo-600" : "text-slate-400")}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}

/** Avatar initials from a full name: "Amara Okafor" -> "AO". */
function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const firstWord = Array.from(parts[0] ?? "");
  const secondWord = Array.from(parts[1] ?? "");
  const first = firstWord[0] ?? "";
  const second =
    parts.length > 1 ? secondWord[0] ?? "" : firstWord.slice(1, 2).join("");
  return `${first}${second}`.toUpperCase();
}

/**
 * 6.2 — the interactive tenant table: text search, a status segmented control
 * and sortable name / balance / lease-end columns.
 *
 * Filtering and sorting are applied client-side over the props passed from the
 * Server Component (`tenants` unfiltered + `rooms` for room-number resolution)
 * — no extra fetch, and no URL state (the roadmap has no searchParams item for
 * tenants, unlike Rooms' 5.5). Search + status combine with AND, then the sort
 * is applied. When the combined filters leave zero rows, a minimal centered
 * message is shown (the full empty-state component is 6.6).
 */
export function TenantTable({
  tenants,
  rooms,
  invoices,
}: {
  tenants: Tenant[];
  rooms: Room[];
  /** Every invoice in the system; the drawer filters them by `tenantId`. */
  invoices: Invoice[];
}) {
  /** room id -> human-readable room number, for the room column + search. */
  const roomNumbers = useMemo(
    () => new Map(rooms.map((room) => [room.id, room.number])),
    [rooms],
  );

  /** `roomId` can be null (a pending applicant not yet assigned a room). */
  const roomOf = useMemo(
    () => (tenant: Tenant): string =>
      tenant.roomId
        ? roomNumbers.get(tenant.roomId) ?? t.tenants.noRoom
        : t.tenants.noRoom,
    [roomNumbers],
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortState>(null);

  /**
   * 6.3 — the selected profile and the row that opened it (focus restore).
   * `nowMs` is sampled by the opening click handler: event handlers may be
   * impure, so render never reads the clock (which react-hooks/purity would
   * forbid) and the value stays stable for the drawer's whole lifetime.
   */
  const [selected, setSelected] = useState<TenantSelection | null>(null);
  const tenantTrigger = useRef<HTMLElement | null>(null);

  /**
   * First click sorts a column ascending; clicking the active column again
   * flips its direction. Any other column always starts ascending.
   */
  function toggleSort(key: SortKey) {
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  /** Search + status filter (AND), then the sort; unsorted keeps data order. */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = tenants.filter((tenant) => {
      if (status !== "all" && tenant.status !== status) return false;
      if (needle) {
        const haystack = [
          tenant.fullName,
          tenant.email,
          tenant.phone,
          roomOf(tenant),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    if (!sort) return filtered;

    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let compare = 0;
      if (sort.key === "name")
        compare = a.fullName.localeCompare(b.fullName, "lo");
      else if (sort.key === "balance") compare = a.balance - b.balance;
      else compare = a.leaseEndDate.localeCompare(b.leaseEndDate);
      return compare === 0 ? 0 : compare * factor || a.id.localeCompare(b.id);
    });
  }, [tenants, query, status, sort, roomOf]);

  function openTenant(tenantId: string, trigger: HTMLElement) {
    tenantTrigger.current = trigger;
    setSelected(openSelection(tenantId));
  }

  function closeTenant() {
    setSelected(null);
    // Hand focus back to the row that opened the drawer.
    tenantTrigger.current?.focus();
    tenantTrigger.current = null;
  }

  const selectedTenant =
    selected !== null
      ? tenants.find((tenant) => tenant.id === selected.tenantId) ?? null
      : null;

  /** This tenant's invoices, newest period first (number breaks period ties). */
  const selectedInvoices = useMemo(
    () =>
      selected !== null
        ? invoices
            .filter((invoice) => invoice.tenantId === selected.tenantId)
            .sort(
              (a, b) =>
                b.period.localeCompare(a.period) ||
                b.invoiceNumber.localeCompare(a.invoiceNumber),
            )
        : [],
    [invoices, selected],
  );

  /** The selected tenant's room, for the drawer's number + monthly rate. */
  const selectedRoom =
    selectedTenant && selectedTenant.roomId
      ? rooms.find((room) => room.id === selectedTenant.roomId) ?? null
      : null;

  return (
    <div className="space-y-4">
      {/* 6.2 — status filter, text search and the result readout. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={t.tenants.filters.statusLabel}
            className={SEGMENT_GROUP_CLASSES}
          >
            <SegmentButton
              active={status === "all"}
              onClick={() => setStatus("all")}
            >
              {t.tenants.filters.all}
            </SegmentButton>
            {TENANT_STATUSES.map((option) => (
              <SegmentButton
                key={option}
                active={status === option}
                onClick={() => setStatus(option)}
              >
                {TENANT_STATUS_LABELS[option]}
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.tenants.searchPlaceholder}
              aria-label={t.tenants.searchLabel}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-indigo-400"
            />
          </div>

          <p className="ml-auto text-xs text-slate-500">
            {t.tenants.resultCount(visible.length, tenants.length)}
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">{t.tenants.noMatches}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 uppercase">
                <tr>
                  <SortableHeader
                    label={t.tenants.fields.tenant}
                    column="name"
                    sort={sort}
                    onSort={toggleSort}
                  />
                  <th scope="col" className="px-5 py-3">
                    {t.tenants.fields.room}
                  </th>
                  <th scope="col" className="px-5 py-3">
                    {t.tenants.fields.moveIn}
                  </th>
                  <SortableHeader
                    label={t.tenants.fields.leaseEnd}
                    column="leaseEnd"
                    sort={sort}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label={t.tenants.fields.balance}
                    column="balance"
                    sort={sort}
                    onSort={toggleSort}
                    align="right"
                  />
                  <th scope="col" className="px-5 py-3">
                    {t.tenants.fields.status}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    <span className="sr-only">{t.tenants.rowMenu.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((tenant) => (
                  <tr
                    key={tenant.id}
                    role="button"
                    tabIndex={0}
                    aria-label={t.tenants.profile.openDetailsAria(
                      tenant.fullName,
                    )}
                    onClick={(event) =>
                      openTenant(tenant.id, event.currentTarget)
                    }
                    onKeyDown={(event) => {
                      // Keys originating inside the row menu (Enter/Space on a
                      // menu control) must not open the drawer — only when the
                      // row itself holds focus. Escape still bubbles, so the
                      // menu's own document listener keeps working.
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openTenant(tenant.id, event.currentTarget);
                      }
                    }}
                    className="cursor-pointer transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700"
                          aria-hidden="true"
                        >
                          {initialsOf(tenant.fullName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">
                            {tenant.fullName}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {tenant.email || tenant.phone}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{roomOf(tenant)}</td>
                    <td className="px-5 py-3.5">
                      {formatDate(tenant.moveInDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      {formatDate(tenant.leaseEndDate)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3.5 text-right font-medium",
                        tenant.balance > 0
                          ? "text-rose-700"
                          : "text-slate-900",
                      )}
                    >
                      {formatCurrency(tenant.balance)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                          TENANT_STATUS_BADGE_CLASSES[tenant.status],
                        )}
                      >
                        {TENANT_STATUS_LABELS[tenant.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <TenantRowMenu tenant={tenant} onOpen={openTenant} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && selectedTenant ? (
        <TenantDetailDrawer
          key={selectedTenant.id}
          tenant={selectedTenant}
          room={selectedRoom}
          invoices={selectedInvoices}
          nowMs={selected.nowMs}
          onClose={closeTenant}
        />
      ) : null}
    </div>
  );
}
