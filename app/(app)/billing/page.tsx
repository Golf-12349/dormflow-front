import type { Metadata } from "next";
import Link from "next/link";

import { t } from "@/lib/i18n";
import {
  getCurrentPeriod,
  getInvoices,
  getRooms,
  getUtilityRates,
  getUtilityReadings,
  getUtilityReadingsByRoom,
  shiftPeriod,
} from "@/lib/mock-data";
import { formatCurrency, formatPeriod, formatUnitPrice } from "@/lib/utils";
import type { Invoice, Room, UtilityReading } from "@/types";
import { InvoiceGeneration, type InvoiceRoom } from "./invoice-generation";
import { MeterEntry, type MeterRoom } from "./meter-entry";

export const metadata: Metadata = {
  title: t.nav.billing,
};

/**
 * Phase 7 — billing screen (Server Component).
 *
 * 7.1 owns the URL-driven period selector (`?period=YYYY-MM`); 7.2/7.3 add
 * the meter-entry section below the summary cards. The data layer is still
 * the mock layer, so per-room history is pre-loaded here in one parallel
 * pass and handed to `<MeterEntry />` as plain serializable props.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // Validated period from 7.1 — reused as-is, never re-parsed below.
  const resolvedParams = await searchParams;
  const period =
    typeof resolvedParams.period === "string" && resolvedParams.period
      ? (resolvedParams.period as string)
      : getCurrentPeriod();

  // Pre-load pattern (as in Rooms/Tenants): occupied rooms, rates and
  // period-level data in one Promise.all; with the real API this becomes
  // a bulk/per-room fetch.
  const [invoices, readings, rates, occupiedRooms] = await Promise.all([
    getInvoices({ period }),
    getUtilityReadings(period),
    getUtilityRates(),
    getRooms({ status: "occupied" }),
  ]);

  const sortedRooms = [...occupiedRooms].sort((a, b) =>
    a.number.localeCompare(b.number),
  );

  // Per-room meter history, pre-loaded in one parallel pass. With the real
  // API this becomes a bulk/per-room fetch.
  const histories = await Promise.all(
    sortedRooms.map((room) => getUtilityReadingsByRoom(room.id)),
  );

  const rooms: MeterRoom[] = sortedRooms.map((room, index) =>
    classifyRoom(room, histories[index] ?? [], period),
  );

  const invoiceRooms: InvoiceRoom[] = sortedRooms.flatMap((room, index) =>
    classifyInvoiceRoom(room, histories[index] ?? [], invoices, period),
  );

  const billed = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const collected = invoices.reduce(
    (sum, invoice) => sum + invoice.paidAmount,
    0,
  );
  const outstanding = billed - collected;

  const previousPeriod = shiftPeriod(period, -1);
  const nextPeriod = shiftPeriod(period, 1);

  // Plain string comparison works because periods are `YYYY-MM`.
  const canRecord = period <= getCurrentPeriod();
  const periodLabel = formatPeriod(period);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t.billing.periodLabel}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {formatPeriod(period)}
          </h1>
        </div>
        <nav
          aria-label={t.billing.periodNav.previous}
          className="flex items-center gap-2"
        >
          <Link
            href={`/billing?period=${previousPeriod}`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            aria-label={`${t.billing.periodNav.previous} ${formatPeriod(previousPeriod)}`}
          >
            ‹
          </Link>
          <Link
            href={`/billing?period=${nextPeriod}`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            aria-label={`${t.billing.periodNav.next} ${formatPeriod(nextPeriod)}`}
          >
            ›
          </Link>
        </nav>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.billing.cards.billed, value: formatCurrency(billed) },
          { label: t.billing.cards.collected, value: formatCurrency(collected) },
          { label: t.billing.cards.outstanding, value: formatCurrency(outstanding) },
          {
            label: t.billing.cards.rates,
            value: `${formatUnitPrice(rates.electricPerKwh)}/kWh · ${formatUnitPrice(rates.waterPerCubicMeter)}/m³`,
          },
        ].map(({ label, value }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
          </article>
        ))}
      </div>

      <MeterEntry
        rooms={rooms}
        period={period}
        periodLabel={periodLabel}
        canRecord={canRecord}
        rates={rates}
      />

      <InvoiceGeneration
        rooms={invoiceRooms}
        period={period}
        periodLabel={periodLabel}
        canRecord={canRecord}
      />

      <div className="mt-4 space-y-1 text-sm leading-relaxed text-slate-500">
        <p>{t.billing.note}</p>
        <p>{t.billing.readingsCount(readings.length)}</p>
      </div>
    </>
  );
}

/**
 * Pure helper: exactly one of `recorded` / `blocked` / `editable`.
 *
 * - `recorded`: a reading exists with `period === selected period` (its own
 *   stored rates travel with it, so the cost line never depends on the
 *   current rate card).
 * - `blocked`: no reading for the selected period but a LATER one exists
 *   (back-filling would rewrite its "previous", so entry is disabled).
 * - `editable`: neither — `previous` is the latest reading with
 *   `period < selected period`, or `null` for a first-ever reading.
 */
function classifyRoom(
  room: Room,
  history: UtilityReading[],
  period: string,
): MeterRoom {
  const current = history.find((reading) => reading.period === period);
  if (current) return { room, kind: { kind: "recorded", reading: current } };

  const hasLater = history.some((reading) => reading.period > period);
  if (hasLater) return { room, kind: { kind: "blocked" } };

  const latestEarlier = history
    .filter((reading) => reading.period < period)
    .sort((a, b) => b.period.localeCompare(a.period))[0];
  return {
    room,
    kind: {
      kind: "editable",
      previous: latestEarlier
        ? {
            electric: latestEarlier.electricCurrent,
            water: latestEarlier.waterCurrent,
          }
        : null,
    },
  };
}


/**
 * Pure helper: exactly one of `issued` / `ready`, or nothing when the room
 * has no reading for the selected period (unlisted rooms cannot be billed).
 *
 * - `issued`: an invoice exists for roomId + period (number, total, status
 *   travel with it).
 * - `ready`: no invoice yet — fees preview with the SAME rounding as
 *   `createInvoice` (`Math.round(x * 100) / 100`) over the reading's STORED
 *   rates, so the preview matches what the server creates.
 */
function classifyInvoiceRoom(
  room: Room,
  history: UtilityReading[],
  periodInvoices: Invoice[],
  period: string,
): InvoiceRoom[] {
  const reading = history.find((candidate) => candidate.period === period);
  if (!reading) return [];

  const invoice = periodInvoices.find(
    (candidate) => candidate.roomId === room.id,
  );
  if (invoice) {
    return [
      {
        room,
        kind: {
          kind: "issued",
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          status: invoice.status,
        },
      },
    ];
  }

  return [
    {
      room,
      kind: {
        kind: "ready",
        roomFee: room.monthlyRate,
        electricFee:
          Math.round(
            (reading.electricCurrent - reading.electricPrevious) *
              reading.electricRate *
              100,
          ) / 100,
        waterFee:
          Math.round(
            (reading.waterCurrent - reading.waterPrevious) *
              reading.waterRate *
              100,
          ) / 100,
      },
    },
  ];
}
