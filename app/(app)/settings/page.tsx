import type { Metadata } from "next";

import { ConsolePreferences } from "@/components/settings/console-preferences";
import {
  StaffAccountManager,
  type StaffAccount,
} from "@/components/settings/staff-account-manager";
import { ApiError, apiRequest } from "@/lib/api/client";
import { getUtilityRates } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";
import { verifySession } from "@/lib/session";
import { formatUnitPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: t.nav.settings,
};

type ApiStaffAccount = StaffAccount;

interface PagedUsers {
  items: ApiStaffAccount[];
  totalPages: number;
}

async function getStaffAccounts(): Promise<StaffAccount[]> {
  const firstPage = await apiRequest<PagedUsers>("/users", {
    query: { page: 1, pageSize: 200 },
    cache: "no-store",
  });
  const accounts = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await apiRequest<PagedUsers>("/users", {
      query: { page, pageSize: 200 },
      cache: "no-store",
    });
    accounts.push(...result.items);
  }

  return accounts.filter((account) =>
    account.roles.length === 0 ||
      account.roles.some((role) =>
        ["Owner", "DormManager", "Accountant", "Staff", "Technician"].includes(
          role,
        ),
      ),
  );
}

export default async function SettingsPage() {
  const session = await verifySession();
  const [rates, accountResult] = await Promise.all([
    getUtilityRates(),
    getStaffAccounts().then(
      (accounts) => ({ accounts, error: null }),
      (error: unknown) => ({
        accounts: [] as StaffAccount[],
        error:
          error instanceof ApiError && error.status === 403
            ? t.settings.staff.permissionError
            : error instanceof Error
              ? error.message
              : t.settings.staff.loadError,
      }),
    ),
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
              [t.settings.name, session.user.name],
              [t.settings.email, session.user.email],
              [t.settings.phone, session.user.phone || "—"],
              [t.settings.role, t.roles[session.user.role]],
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

      <ConsolePreferences userId={session.user.id} />
      <StaffAccountManager
        accounts={accountResult.accounts}
        currentUserId={session.user.id}
        loadError={accountResult.error}
      />
    </div>
  );
}
