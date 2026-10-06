import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { t } from "@/lib/i18n";
import {
  getCurrentPeriod,
  getInvoices,
  getUtilityRates,
  getUtilityReadings,
} from "@/lib/mock-data";
import { formatCurrency, formatPeriod, formatUnitPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: t.nav.billing,
};

/**
 * Phase 7 replaces this with meter entry, invoice generation and payments.
 * The numbers below are already computed from the mock ledger for the current
 * period, so the wiring is proven before the UI exists.
 */
export default async function BillingPage() {
  const period = getCurrentPeriod();
  const [invoices, readings, rates] = await Promise.all([
    getInvoices({ period }),
    getUtilityReadings(period),
    getUtilityRates(),
  ]);

  const billed = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const collected = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const outstanding = billed - collected;

  return (
    <PagePlaceholder
      title="Billing & utilities"
      description={`${formatPeriod(period)} — ${invoices.length} invoices and ${readings.length} meter readings recorded. Meter entry, invoice generation and payments arrive in Phase 7.`}
      phase="Phase 7"
      planned={[
        "Period selector with previous/next navigation",
        "Electric and water meter entry per room with live consumption preview",
        "Validation: current reading ≥ previous, no duplicate period entry",
        "Invoice generation from saved readings (room fee + electric + water + other)",
        "Invoice list with status badges, paid/outstanding totals and a printable view",
        "Record payment, including partial payments",
        "Utility rate settings (per kWh / per m³)",
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Billed", value: formatCurrency(billed) },
          { label: "Collected", value: formatCurrency(collected) },
          { label: "Outstanding", value: formatCurrency(outstanding) },
          {
            label: "Rates",
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
    </PagePlaceholder>
  );
}