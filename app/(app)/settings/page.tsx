import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { t } from "@/lib/i18n";
import { getUtilityRates } from "@/lib/mock-data";
import { verifySession } from "@/lib/session";
import { formatUnitPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: t.nav.settings,
};

/**
 * Not scheduled inside Phases 4–7 yet: this screen collects the configuration
 * surfaces the later phases depend on (rates, roles, theme) and shows the
 * current session, so the sidebar entry never dead-ends.
 */
export default async function SettingsPage() {
  const session = await verifySession();
  const rates = await getUtilityRates();

  return (
    <PagePlaceholder
      title="Settings & preferences"
      description="Staff account details, utility rates and console preferences."
      phase="Phase 7 / cross-cutting backlog"
      planned={[
        "Editable utility rates that feed the Phase 7 invoice generator",
        "Staff account management (roles: admin, manager, staff)",
        "Notification preferences for overdue invoices and leases",
        "Dark theme pass built on the existing CSS variables",
        "Toast notifications for Server Action results",
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Signed-in account
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Name", session.user.name],
              ["Email", session.user.email],
              ["Phone", session.user.phone],
              ["Role", session.user.role],
              ["Session expires", new Date(session.expiresAt).toLocaleString("en-US")],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900 capitalize">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Utility rates in use
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Electricity</dt>
              <dd className="font-medium text-slate-900">
                {formatUnitPrice(rates.electricPerKwh)} / kWh
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Water</dt>
              <dd className="font-medium text-slate-900">
                {formatUnitPrice(rates.waterPerCubicMeter)} / m³
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Values come from <code>UTILITY_RATES</code> in{" "}
            <code>lib/mock-data.ts</code>.
          </p>
        </div>
      </div>
    </PagePlaceholder>
  );
}