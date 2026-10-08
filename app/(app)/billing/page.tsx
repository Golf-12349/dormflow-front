import type { Metadata } from "next";
import Link from "next/link";

import { t } from "@/lib/i18n";
import {
  getCurrentPeriod,
  getInvoices,
  getUtilityRates,
  getUtilityReadings,
  shiftPeriod,
} from "@/lib/mock-data";
import { formatCurrency, formatPeriod, formatUnitPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: t.nav.billing,
};

/**
 * Phase 7 replaces the `PagePlaceholder` with a real period selector and the
 * four summary cards. The period is URL-driven (`?period=YYYY-MM`) so it
 * survives refresh and can be shared, and it is re-fetched for whichever
 * period is selected.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Default to the current billing period when `?period=` is absent.
  const period =
    typeof searchParams.period === "string" && searchParams.period
      ? (searchParams.period as string)
      : getCurrentPeriod();

  const [invoices, readings, rates] = await Promise.all([
    getInvoices({ period }),
    getUtilityReadings(period),
    getUtilityRates(),
  ]);

  const billed = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const collected = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const outstanding = billed - collected;

  const previousPeriod = shiftPeriod(period, -1);
  const nextPeriod = shiftPeriod(period, 1);

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

      <div className="mt-4 space-y-1 text-sm leading-relaxed text-slate-500">
        <p>{t.billing.note}</p>
        <p>{t.billing.readingsCount(readings.length)}</p>
      </div>
    </>
  );
}
