"use client";

import { useActionState } from "react";
import { KeyRound, Settings2, Trash2 } from "lucide-react";

import { changePasswordAction } from "@/lib/actions/auth";
import {
  deleteOrganizationSettingAction,
  upsertOrganizationSettingAction,
} from "@/lib/actions/staff";
import { t } from "@/lib/i18n";

export interface OrganizationSettingItem {
  id: string;
  organizationId: string;
  key: string;
  value: string;
}

const INITIAL_STATE = { status: "idle" as const, message: null };

export function ChangePasswordCard() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    INITIAL_STATE,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-indigo-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-900">
          {t.settings.password.title}
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {t.settings.password.description}
      </p>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${
            state.status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <form
        action={formAction}
        className="mt-4 grid gap-3 sm:grid-cols-3"
        noValidate
      >
        <label className="text-xs font-medium text-slate-700">
          {t.settings.password.currentPassword} *
          <input
            required
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-xs font-medium text-slate-700">
          {t.settings.password.newPassword} *
          <input
            required
            type="password"
            name="newPassword"
            autoComplete="new-password"
            placeholder={t.settings.staff.passwordHint}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-xs font-medium text-slate-700">
          {t.settings.password.confirmPassword} *
          <input
            required
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending
              ? t.settings.password.saving
              : t.settings.password.submit}
          </button>
        </div>
      </form>
    </section>
  );
}

export function OrganizationSettingsCard({
  settings,
  organizations,
}: {
  settings: OrganizationSettingItem[];
  organizations: Array<{ id: string; name: string; code: string }>;
}) {
  const [upsertState, upsertFormAction, upsertPending] = useActionState(
    upsertOrganizationSettingAction,
    INITIAL_STATE,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteOrganizationSettingAction,
    INITIAL_STATE,
  );

  const feedback = deleteState.message ? deleteState : upsertState;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Settings2 className="size-4 text-indigo-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-900">
          {t.settings.orgSettings.title}
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {t.settings.orgSettings.description}
      </p>

      {feedback.message ? (
        <p
          role={feedback.status === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${
            feedback.status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <form
        action={upsertFormAction}
        className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
        noValidate
      >
        <label className="min-w-44 flex-1 text-xs font-medium text-slate-700">
          {t.settings.orgSettings.key} *
          <input
            required
            type="text"
            name="key"
            placeholder="invoice.footer_note"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
          />
        </label>
        <label className="min-w-52 flex-1 text-xs font-medium text-slate-700">
          {t.settings.orgSettings.value} *
          <input
            required
            type="text"
            name="value"
            placeholder="..."
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
          />
        </label>
        {organizations.length > 1 ? (
          <label className="text-xs font-medium text-slate-700">
            {t.management.table.fields.organizationId}
            <select
              name="organizationId"
              defaultValue={organizations[0]?.id ?? ""}
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="submit"
          disabled={upsertPending}
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {t.settings.orgSettings.save}
        </button>
      </form>

      {settings.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {t.settings.orgSettings.empty}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">{t.settings.orgSettings.key}</th>
                <th className="px-3 py-2">{t.settings.orgSettings.value}</th>
                <th className="py-2 pl-3 text-right">
                  {t.management.workflows.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.map((item) => (
                <tr key={item.id || item.key}>
                  <td className="py-2.5 pr-3 font-mono text-xs font-medium text-slate-900">
                    {item.key}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{item.value}</td>
                  <td className="py-2.5 pl-3 text-right">
                    <form action={deleteFormAction} className="inline">
                      <input type="hidden" name="key" value={item.key} />
                      <input
                        type="hidden"
                        name="organizationId"
                        value={item.organizationId}
                      />
                      <button
                        type="submit"
                        disabled={deletePending}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="size-3" aria-hidden="true" />
                        {t.settings.orgSettings.delete}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

