import type { Metadata } from "next";

import { t } from "@/lib/i18n";
import {
  getAllTenantHistoriesGroupedByTenant,
  getAvailableRooms,
  getInvoices,
  getOrganizations,
  getRooms,
  getTenants,
} from "@/lib/api/dormflow";
import { AddTenantForm } from "./add-tenant-form";
import { TenantTable } from "./tenant-table";

export const metadata: Metadata = {
  title: t.nav.tenants,
};

/**
 * 6.1/6.2 — the tenant table screen.
 *
 * Stays an async Server Component (locked "Data access" decision: data is
 * fetched here, not in the client).
 */
export default async function TenantsPage() {
  const [tenants, rooms, availableRooms, organizations, historiesByTenant] =
    await Promise.all([
      getTenants(),
      getRooms(),
      getAvailableRooms(),
      getOrganizations(),
      getAllTenantHistoriesGroupedByTenant(),
    ]);

  // 6.5 add-tenant form options: only vacant rooms can take a new tenant
  // (the Server Action re-checks this against the data layer before writing).
  const vacantRooms =
    availableRooms.length > 0
      ? availableRooms
      : rooms.filter((room) => room.status === "vacant");

  const invoices = await getInvoices();

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

      <AddTenantForm
        vacantRooms={vacantRooms}
        organizations={organizations}
      />

      <TenantTable
        tenants={tenants}
        rooms={rooms}
        invoices={invoices}
        historiesByTenant={historiesByTenant}
      />
    </div>
  );
}
