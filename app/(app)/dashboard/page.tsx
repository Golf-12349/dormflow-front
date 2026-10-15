import type { ComponentType } from "react";
import type { Metadata } from "next";
import {
  Banknote,
  BedDouble,
  Building2,
  DoorOpen,
  Gauge,
  LogIn,
  LogOut,
  Minus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";

import { t } from "@/lib/i18n";
import {
  getCurrentPeriod,
  getDashboardMetrics,
  getFloorOccupancy,
  getInvoices,
  getRecentActivities,
  getRevenueTrend,
  getRooms,
  shiftPeriod,
} from "@/lib/api/dormflow";
import { verifySession } from "@/lib/session";
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_LABELS,
  ROOM_STATUS_BADGE_CLASSES,
  ROOM_STATUS_DOT_CLASSES,
  ROOM_STATUS_LABELS,
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPeriod,
  formatPeriodShort,
  formatRelativeTime,
} from "@/lib/utils";
import type {
  ActivityType,
  Invoice,
  RevenuePoint,
  Room,
  RoomStatus,
} from "@/types";

export const metadata: Metadata = {
  /** Lao tab title; the sidebar uses the same label (`t.nav.overview`). */
  title: t.nav.overview,
};

/** Direction a metric moved in compared with the previous billing period. */
type TrendDirection = "up" | "down" | "flat";

/** One "vs previous period" chip rendered under a metric card. */
interface MetricDelta {
  /** Short prefix, only used by cards that show more than one delta. */
  label?: string;
  direction: TrendDirection;
  /** Signed percentage change, rounded to one decimal. */
  changePercent: number;
  /** Signed change in the same unit as the card value. */
  changeAmount: number;
  /** Money deltas also print the absolute change via `formatCurrency`. */
  money: boolean;
}

/** Shape of the lucide icons kept in the maps below (all decorative). */
type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

const DELTA_ICONS: Record<TrendDirection, IconComponent> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

/** Reuses the status-badge palette so deltas match the chips used elsewhere. */
const DELTA_CHIP_CLASSES: Record<TrendDirection, string> = {
  up: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  down: "bg-rose-50 text-rose-700 ring-rose-600/20",
  flat: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

/** `current` relative to `previous`, e.g. `12.5` for +12.5%. */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function directionOf(changePercent: number): TrendDirection {
  if (changePercent > 0) return "up";
  if (changePercent < 0) return "down";
  return "flat";
}

/** Delta for one card value against the same value in the previous period. */
function buildDelta(
  current: number,
  previous: number,
  options: { label?: string; money?: boolean } = {},
): MetricDelta {
  const change = percentChange(current, previous);

  return {
    label: options.label,
    direction: directionOf(change),
    changePercent: change,
    changeAmount: current - previous,
    money: options.money ?? false,
  };
}

/** `+2.5%`, `-18.4%`, `0%` — plus the signed amount for money metrics. */
function formatDelta(delta: MetricDelta): string {
  const sign =
    delta.changePercent > 0 ? "+" : delta.changePercent < 0 ? "-" : "";
  const prefix = delta.label ? `${delta.label} ` : "";
  const rate = `${sign}${formatNumber(Math.abs(delta.changePercent))}%`;

  if (!delta.money || delta.changePercent === 0) {
    return `${prefix}${rate}`;
  }

  return `${prefix}${rate} (${sign}${formatCurrency(Math.abs(delta.changeAmount))})`;
}

/** Segment order shared by every stacked occupancy bar and its legend. */
const OCCUPANCY_SEGMENTS: RoomStatus[] = [
  "occupied",
  "vacant",
  "maintenance",
  "reserved",
];

/** Occupancy-ring geometry (the SVG viewBox is 100 × 100). */
const RING_RADIUS = 42;
const RING_STROKE = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Periods displayed in the revenue chart. */
const REVENUE_PERIODS = 6;

/** Legend + bar colours for the two revenue series. */
const REVENUE_SERIES: Array<{ label: string; className: string }> = [
  { label: t.dashboard.expected, className: "bg-indigo-200" },
  { label: t.dashboard.collected, className: "bg-indigo-500" },
];

/** Width of one stacked-bar segment, as a CSS percentage. */
function segmentWidth(count: number, total: number): string {
  if (total <= 0) return "0%";
  return `${(count / total) * 100}%`;
}

/** `9 / 24` -> `38` (whole percent). */
function occupancyPercent(occupied: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((occupied / total) * 100);
}

/**
 * Bar height as a percentage of the tallest bar in the series. A small floor
 * keeps a near-zero period visible instead of rendering as an empty slot.
 */
function revenueBarHeight(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max((value / max) * 100, 2)}%`;
}

/** Tallest expected-or-collected value across the charted periods. */
function revenueCeiling(points: RevenuePoint[]): number {
  return points.reduce(
    (max, point) => Math.max(max, point.expected, point.collected),
    0,
  );
}

/** Feed size for the activity card (4.4). */
const ACTIVITY_LIMIT = 6;

/** One icon per activity type, so the feed is scannable at a glance. */
const ACTIVITY_ICONS: Record<ActivityType, IconComponent> = {
  payment: Banknote,
  "move-in": LogIn,
  "move-out": LogOut,
  invoice: Receipt,
  maintenance: Wrench,
  meter: Gauge,
};

/** Tint per activity type, matching the status palette used elsewhere. */
const ACTIVITY_ICON_CLASSES: Record<ActivityType, string> = {
  payment: "bg-emerald-50 text-emerald-600",
  "move-in": "bg-sky-50 text-sky-600",
  "move-out": "bg-slate-100 text-slate-600",
  invoice: "bg-indigo-50 text-indigo-600",
  maintenance: "bg-amber-50 text-amber-600",
  meter: "bg-violet-50 text-violet-600",
};

/** One row of the "needs action" list (4.5). */
interface ActionItem {
  id: string;
  title: string;
  detail: string;
  /** Right-aligned figure: the outstanding money, or the floor of a room. */
  meta: string;
  badgeLabel: string;
  badgeClass: string;
}

/**
 * Builds the single attention list: every overdue/unpaid invoice plus every room
 * under maintenance. Invoices come first (most overdue on top) because money is
 * what the office chases; the room number is resolved from the room list instead
 * of a third fetch.
 */
function buildActionItems(invoices: Invoice[], rooms: Room[]): ActionItem[] {
  const roomNumbers = new Map(rooms.map((room) => [room.id, room.number]));

  const invoiceItems = invoices
    .filter(
      (invoice) => invoice.status === "overdue" || invoice.status === "unpaid",
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((invoice) => ({
      id: invoice.id,
      title: invoice.invoiceNumber,
      detail: t.dashboard.needsAction.invoiceDetail(
        roomNumbers.get(invoice.roomId) ?? "—",
        formatPeriodShort(invoice.period),
        formatDate(invoice.dueDate),
      ),
      meta: formatCurrency(invoice.total - invoice.paidAmount),
      badgeLabel: INVOICE_STATUS_LABELS[invoice.status],
      badgeClass: INVOICE_STATUS_BADGE_CLASSES[invoice.status],
    }));

  const maintenanceItems = rooms
    .filter((room) => room.status === "maintenance")
    .map((room) => ({
      id: room.id,
      title: t.dashboard.needsAction.roomTitle(room.number),
      detail: room.note ?? t.dashboard.needsAction.noNote,
      meta: t.dashboard.needsAction.roomMeta(room.floor),
      badgeLabel: ROOM_STATUS_LABELS[room.status],
      badgeClass: ROOM_STATUS_BADGE_CLASSES[room.status],
    }));

  return [...invoiceItems, ...maintenanceItems];
}

/** Builds the accessibility name for a metric card, deltas included. */
function describeCard(
  label: string,
  value: string,
  hint: string,
  deltas: MetricDelta[],
  comparisonPeriod: string,
): string {
  const changes = deltas.map(formatDelta).join(t.dashboard.aria.deltaJoiner);
  return t.dashboard.aria.card(label, value, hint, changes, comparisonPeriod);
}

/** Centred placeholder for sections whose mock collection is empty. */
function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}

/**
 * Phase 4 overview.
 *
 * 4.1 — the four counters, each with a trend delta against the previous billing
 * period. Current values keep coming from `getDashboardMetrics()` and the
 * previous period is derived with `shiftPeriod()`; `getRevenueTrend()` is the
 * only period-scoped history available here, so revenue is compared point
 * against point while room/tenant counts (a single current snapshot with no
 * month dimension) render a flat chip.
 * 4.2 — occupancy per floor (`getFloorOccupancy()`) as one stacked bar per floor
 * plus an occupancy-rate ring.
 * 4.3 — expected vs collected revenue for the last six periods as plain CSS
 * bars (no charting dependency).
 *
 * 4.4 — recent activity feed (`getRecentActivities()`) with one icon per
 * activity type and relative timestamps.
 * 4.5 — a single "needs action" list built from `getInvoices()`
 * (overdue/unpaid) and `getRooms()` (under maintenance).
 *
 * 4.6 (empty/loading states and accessible labels) is still to come.
 */
export default async function DashboardPage() {
  const session = await verifySession();

  const currentPeriod = getCurrentPeriod();
  const previousPeriod = shiftPeriod(currentPeriod, -1);

  const [
    metrics,
    revenueTrend,
    floorOccupancy,
    activities,
    invoices,
    rooms,
  ] = await Promise.all([
    getDashboardMetrics(),
    getRevenueTrend(),
    getFloorOccupancy(),
    getRecentActivities(ACTIVITY_LIMIT),
    getInvoices(),
    getRooms(),
  ]);

  /** Last six periods, oldest first, as drawn by the revenue card (4.3). */
  const revenuePeriods = revenueTrend.slice(-REVENUE_PERIODS);
  const revenueMax = revenueCeiling(revenuePeriods);

  /** Ring (4.2): the unoccupied share of the circle, as a dash offset. */
  const ringOffset = RING_CIRCUMFERENCE * (1 - metrics.occupancyRate / 100);

  /** Previous point of the trend series — null when no older period exists. */
  const previousRevenue =
    revenueTrend.find((point) => point.period === previousPeriod) ?? null;

  /** Previous-period baseline for every card value below. */
  const previous = {
    totalRooms: metrics.totalRooms,
    occupiedRooms: metrics.occupiedRooms,
    vacantRooms: metrics.vacantRooms,
    expectedRevenue: previousRevenue?.expected ?? metrics.expectedRevenue,
    collectedRevenue: previousRevenue?.collected ?? metrics.collectedRevenue,
  };

  /** 4.5 — overdue/unpaid invoices plus maintenance rooms, as one list. */
  const actionItems = buildActionItems(invoices, rooms);

  const cards = [
    {
      label: t.dashboard.metrics.totalRooms,
      value: String(metrics.totalRooms),
      hint: t.dashboard.metrics.occupancyHint(metrics.occupancyRate),
      icon: Building2,
      deltas: [buildDelta(metrics.totalRooms, previous.totalRooms)],
    },
    {
      label: t.dashboard.metrics.occupied,
      value: String(metrics.occupiedRooms),
      hint: t.dashboard.metrics.activeTenantsHint(metrics.activeTenants),
      icon: BedDouble,
      deltas: [buildDelta(metrics.occupiedRooms, previous.occupiedRooms)],
    },
    {
      label: t.dashboard.metrics.vacant,
      value: String(metrics.vacantRooms),
      hint: t.dashboard.metrics.vacantHint(
        metrics.reservedRooms,
        metrics.maintenanceRooms,
      ),
      icon: DoorOpen,
      deltas: [buildDelta(metrics.vacantRooms, previous.vacantRooms)],
    },
    {
      label: t.dashboard.metrics.expectedRevenue,
      value: formatCurrency(metrics.expectedRevenue),
      hint: t.dashboard.metrics.revenueHint(
        formatCurrency(metrics.collectedRevenue),
        formatCurrency(metrics.outstandingBalance),
      ),
      icon: Wallet,
      deltas: [
        buildDelta(metrics.expectedRevenue, previous.expectedRevenue, {
          label: t.dashboard.expected,
          money: true,
        }),
        buildDelta(metrics.collectedRevenue, previous.collectedRevenue, {
          label: t.dashboard.collected,
          money: true,
        }),
      ],
    },
  ].map((card) => ({
    ...card,
    ariaLabel: describeCard(
      card.label,
      card.value,
      card.hint,
      card.deltas,
      formatPeriod(previousPeriod),
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          {t.dashboard.welcomeBack(session.user.name.split(" ")[0])}
        </h2>
        <p className="text-sm text-slate-500">
          {t.dashboard.snapshot(formatPeriod(currentPeriod))}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon, deltas, ariaLabel }) => (
          <article
            key={label}
            aria-label={ariaLabel}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {label}
              </p>
              <Icon
                className="size-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              {deltas.map((delta) => {
                const DeltaIcon = DELTA_ICONS[delta.direction];

                return (
                  <span
                    key={delta.label ?? "value"}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                      DELTA_CHIP_CLASSES[delta.direction],
                    )}
                  >
                    <DeltaIcon className="size-3.5 shrink-0" aria-hidden="true" />
                    {formatDelta(delta)}
                  </span>
                );
              })}
              <span className="text-xs text-slate-500">
                {t.dashboard.deltaVs(formatPeriodShort(previousPeriod))}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 4.2 — stacked occupancy bar per floor */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {t.dashboard.occupancy.byFloorTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {t.dashboard.occupancy.byFloorSubtitle(floorOccupancy.length)}
              </p>
            </div>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {OCCUPANCY_SEGMENTS.map((status) => (
                <li
                  key={status}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 rounded-full",
                      ROOM_STATUS_DOT_CLASSES[status],
                    )}
                  />
                  {ROOM_STATUS_LABELS[status]}
                </li>
              ))}
            </ul>
          </div>

          {floorOccupancy.length === 0 ? (
            <EmptyState message={t.dashboard.empty.noRooms} />
          ) : (
            <ul className="mt-5 space-y-4">
              {floorOccupancy.map((floor) => (
                <li key={floor.floor} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">
                      {t.dashboard.occupancy.floorLabel(floor.floor)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.dashboard.occupancy.floorSummary(
                        floor.occupied,
                        floor.total,
                        occupancyPercent(floor.occupied, floor.total),
                      )}
                    </p>
                  </div>
                  <div
                    role="img"
                    aria-label={t.dashboard.occupancy.barAria(
                      floor.floor,
                      floor.occupied,
                      floor.vacant,
                      floor.maintenance,
                      floor.reserved,
                      floor.total,
                    )}
                    className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
                  >
                    {OCCUPANCY_SEGMENTS.map((status) => (
                      <span
                        key={status}
                        aria-hidden="true"
                        className={cn("h-full", ROOM_STATUS_DOT_CLASSES[status])}
                        style={{ width: segmentWidth(floor[status], floor.total) }}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4.2 — occupancy-rate ring */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            {t.dashboard.occupancy.rateTitle}
          </h3>

          <div className="mt-4 flex justify-center">
            <div className="relative flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                role="img"
                aria-label={t.dashboard.occupancy.rateAria(
                  metrics.occupancyRate,
                  metrics.occupiedRooms,
                  metrics.totalRooms,
                )}
                className="size-36 -rotate-90"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  className="stroke-slate-100"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  className="stroke-indigo-500"
                />
              </svg>
              <p
                aria-hidden="true"
                className="absolute flex flex-col items-center"
              >
                {/* Digits only, so the tight leading cannot clip a Lao tone mark. */}
                <span className="text-2xl font-semibold leading-none text-slate-900">
                  {metrics.occupancyRate}%
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {t.dashboard.metrics.occupied}
                </span>
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                {t.dashboard.occupancy.occupiedRooms}
              </dt>
              <dd className="font-medium text-slate-900">
                {t.dashboard.occupancy.occupiedOfTotal(
                  metrics.occupiedRooms,
                  metrics.totalRooms,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                {t.dashboard.occupancy.activeTenants}
              </dt>
              <dd className="font-medium text-slate-900">
                {metrics.activeTenants}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 4.3 — expected vs collected for the last six periods */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {t.dashboard.revenue.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {t.dashboard.revenue.subtitle(revenuePeriods.length)}
              </p>
            </div>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {REVENUE_SERIES.map(({ label, className }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-2 rounded-full", className)}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {revenuePeriods.length === 0 ? (
            <EmptyState message={t.dashboard.empty.noRevenueHistory} />
          ) : (
            <div className="scrollbar-thin mt-6 overflow-x-auto">
              <ol className="flex min-w-[30rem] items-end gap-4">
                {revenuePeriods.map((point) => (
                  <li
                    key={point.period}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div
                      role="img"
                      aria-label={t.dashboard.revenue.barAria(
                        point.label,
                        formatCurrency(point.expected),
                        formatCurrency(point.collected),
                      )}
                      className="flex h-40 w-full items-end justify-center gap-1.5"
                    >
                      <span
                        aria-hidden="true"
                        className="w-3 rounded-t bg-indigo-200"
                        style={{
                          height: revenueBarHeight(point.expected, revenueMax),
                        }}
                      />
                      <span
                        aria-hidden="true"
                        className="w-3 rounded-t bg-indigo-500"
                        style={{
                          height: revenueBarHeight(point.collected, revenueMax),
                        }}
                      />
                    </div>
                    {/* Folded into the bar aria-label so screen readers announce it once. */}
                    <p
                      aria-hidden="true"
                      className={cn(
                        "text-xs",
                        point.period === currentPeriod
                          ? "font-semibold text-slate-900"
                          : "text-slate-500",
                      )}
                    >
                      {point.label}
                    </p>
                    <ul
                      aria-hidden="true"
                      className="text-[11px] leading-tight text-slate-400"
                    >
                      <li>{formatCurrency(point.expected, { compact: true })}</li>
                      <li>{formatCurrency(point.collected, { compact: true })}</li>
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {t.dashboard.mockLayer.title}
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                {t.dashboard.mockLayer.unpaidInvoices}
              </dt>
              <dd className="font-medium text-slate-900">
                {metrics.unpaidInvoices}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                {t.dashboard.mockLayer.openMaintenance}
              </dt>
              <dd className="font-medium text-slate-900">
                {metrics.openMaintenanceIssues}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                {t.dashboard.mockLayer.signedInAs}
              </dt>
              <dd className="font-medium text-slate-900 capitalize">
                {t.roles[session.user.role] ?? session.user.role}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 4.4 — recent activity feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {t.dashboard.activity.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {t.dashboard.activity.subtitle(activities.length)}
          </p>

          {activities.length === 0 ? (
            <EmptyState message={t.dashboard.empty.noActivity} />
          ) : (
            <ul
              className="mt-5 space-y-4"
              aria-label={t.dashboard.activity.title}
            >
              {activities.map((activity) => {
                const ActivityIcon = ACTIVITY_ICONS[activity.type];

                return (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        ACTIVITY_ICON_CLASSES[activity.type],
                      )}
                    >
                      <ActivityIcon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">{activity.message}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <time dateTime={activity.timestamp}>
                          {formatRelativeTime(activity.timestamp)}
                        </time>{" "}
                        · {activity.actor}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 4.5 — needs action */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {t.dashboard.needsAction.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {t.dashboard.needsAction.subtitle}
              </p>
            </div>
            <span
              aria-label={t.dashboard.needsAction.countAria(actionItems.length)}
              className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20"
            >
              {actionItems.length}
            </span>
          </div>

          {actionItems.length === 0 ? (
            <EmptyState message={t.dashboard.empty.noActionItems} />
          ) : (
            <ul
              className="mt-5 space-y-4"
              aria-label={t.dashboard.needsAction.title}
            >
              {actionItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.title}
                      </p>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-medium ring-1",
                          item.badgeClass,
                        )}
                      >
                        {item.badgeLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    {item.meta}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}