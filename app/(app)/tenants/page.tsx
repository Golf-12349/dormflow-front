import type { Metadata } from "next";

import { t } from "@/lib/i18n";
import { getInvoicesByTenant, getRooms, getTenants } from "@/lib/mock-data";
import { TenantTable } from "./tenant-table";

export const metadata: Metadata = {
  title: t.nav.tenants,
};

/**
 * 6.1/6.2 — the tenant table screen.
 *
 * Stays an async Server Component (locked "Data access" decision: data is
 * fetched here, not in the client). It pulls `getTenants()` (unfiltered —
 * filters are 6.2, applied client-side), `getRooms()` (room-number
 * resolution and the drawer's monthly rate) and each tenant's invoices via
 * `getInvoicesByTenant()` (pre-loaded once for every profile, then flattened
 * into one array — the same "mock dataset is tiny" pattern Rooms 5.6 used;
 * the drawer still filters by `tenantId` client-side) and passes them down
 * as plain props. All interactivity — the search box, the status filter and
 * the sortable columns (6.2), plus the profile drawer with its lease
 * progress indicator (6.3/6.4) — lives in `<TenantTable />`; mutations and
 * the full empty state are 6.5/6.6.
 *
 * Every user-facing string lives in the `t.tenants` group (`lib/i18n/lo.ts`),
 * written in Lao from the start rather than localised after the fact.
 */
export default async function TenantsPage() {
  const [tenants, rooms] = await Promise.all([getTenants(), getRooms()]);

  // 6.3 ledger: one getInvoicesByTenant() call per tenant (getInvoices()
  // filters by period/status/query only), pre-loaded in parallel and
  // flattened — the table keeps receiving a single mixed array and picks the
  // selected tenant's invoices client-side, exactly as before.
  const invoices = (
    await Promise.all(tenants.map((tenant) => getInvoicesByTenant(tenant.id)))
  ).flat();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          {t.nav.tenants}
        </h2>
        <p className="text-sm text-slate-500">
          {t.tenants.subtitle(tenants.length)}
        </p>
      </div>

      <TenantTable tenants={tenants} rooms={rooms} invoices={invoices} />
    </div>
  );
}