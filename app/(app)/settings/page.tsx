import type { Metadata } from "next";

import {
  ChangePasswordCard,
  OrganizationSettingsCard,
  type OrganizationSettingItem,
} from "@/components/settings/account-security-and-org-settings";
import { ConsolePreferences } from "@/components/settings/console-preferences";
import {
  StaffManagement,
  type StaffUserItem,
} from "@/components/settings/staff-management";
import { apiRequest } from "@/lib/api/client";
import { getOrganizations, getUtilityRates } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";
import { verifySession } from "@/lib/session";
import { formatUnitPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: t.nav.settings,
};

async function getStaffUsers(): Promise<StaffUserItem[]> {
  try {
    const page = await apiRequest<{ items?: StaffUserItem[] }>("/users", {
      query: { page: 1, pageSize: 50 },
      cache: "no-store",
    });
    return page?.items ?? [];
  } catch {
    return [];
  }
}

async function getOrganizationSettings(): Promise<OrganizationSettingItem[]> {
  try {
    const page = await apiRequest<{ items?: OrganizationSettingItem[] }>(
      "/settings",
      {
        query: { page: 1, pageSize: 100 },
        cache: "no-store",
      },
    );
    return page?.items ?? [];
  } catch {
    return [];
  }
}

async function getCurrentUserMe(): Promise<{
  fullName?: string;
  email?: string;
  phone?: string | null;
  roles?: string[];
} | null> {
  try {
    return await apiRequest<{
      fullName?: string;
      email?: string;
      phone?: string | null;
      roles?: string[];
    }>("/auth/me", { cache: "no-store" });
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const session = await verifySession();
  const canManageStaff =
    session.user.role === "admin" || session.user.role === "manager";
  const [rates, me, staffUsers, organizations, orgSettings] = await Promise.all([
    getUtilityRates(),
    getCurrentUserMe(),
    canManageStaff ? getStaffUsers() : Promise.resolve([]),
    canManageStaff ? getOrganizations() : Promise.resolve([]),
    canManageStaff ? getOrganizationSettings() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t.settings.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t.settings.subtitle}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">
            {t.settings.account}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              [t.settings.name, me?.fullName || session.user.name],
              [t.settings.email, me?.email || session.user.email],
              [t.settings.phone, me?.phone || session.user.phone || "—"],
              [
                t.settings.role,
                me?.roles?.length
                  ? `${t.roles[session.user.role]} (${me.roles.join(", ")})`
                  : t.roles[session.user.role],
              ],
              [
                t.settings.expires,
                new Date(session.expiresAt).toLocaleString("lo-LA"),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">
            {t.settings.utilityRates}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{t.settings.electricity}</dt>
              <dd className="font-medium text-slate-900">
                {formatUnitPrice(rates.electricPerKwh)} / kWh
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{t.settings.water}</dt>
              <dd className="font-medium text-slate-900">
                {formatUnitPrice(rates.waterPerCubicMeter)} / m³
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            {t.settings.utilityNote}
          </p>
        </section>
      </div>

      <ChangePasswordCard />

      {canManageStaff ? (
        <>
          <StaffManagement
            users={staffUsers}
            currentUserId={session.user.id}
            organizations={organizations}
          />
          <OrganizationSettingsCard
            settings={orgSettings}
            organizations={organizations}
          />
        </>
      ) : null}

      <ConsolePreferences userId={session.user.id} />
    </div>
  );
}
