"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";

import { ActionResultToast } from "@/components/providers/action-result-toast";
import {
  assignStaffRolesAction,
  changeStaffStatusAction,
  createStaffAction,
  updateStaffProfileAction,
} from "@/lib/actions/staff";
import { t } from "@/lib/i18n";

export interface StaffAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
}

const STAFF_ROLES = [
  { value: "Owner", label: t.settings.staff.admin },
  { value: "DormManager", label: t.settings.staff.manager },
  { value: "Accountant", label: t.settings.staff.accountant },
  { value: "Staff", label: t.settings.staff.staffRole },
  { value: "Technician", label: t.settings.staff.technician },
] as const;

const initialActionState = { status: "idle" as const, message: null };

export function StaffAccountManager({
  accounts,
  currentUserId,
  loadError,
}: {
  accounts: StaffAccount[];
  currentUserId: string;
  loadError: string | null;
}) {
  const [createState, createAction, isCreating] = useActionState(
    createStaffAction,
    initialActionState,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <ActionResultToast state={createState} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t.settings.staff.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {t.settings.staff.description}
          </p>
        </div>
        {!loadError ? (
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <UserPlus className="size-4" aria-hidden="true" />
              {t.settings.staff.add}
            </summary>
            <form
              action={createAction}
              className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
            >
              <label className="text-sm font-medium text-slate-700">
                {t.settings.staff.firstName}
                <input
                  name="firstName"
                  autoComplete="given-name"
                  required
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t.settings.staff.lastName}
                <input
                  name="lastName"
                  autoComplete="family-name"
                  required
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t.settings.email}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t.settings.phone}
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={32}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t.settings.staff.password}
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  {t.settings.staff.passwordHint}
                </span>
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t.settings.role}
                <select
                  name="role"
                  defaultValue="Staff"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isCreating ? t.settings.staff.saving : t.settings.staff.save}
                </button>
              </div>
            </form>
          </details>
        ) : null}
      </div>

      {loadError ? (
        <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          {loadError}
        </p>
      ) : accounts.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          {t.settings.staff.empty}
        </p>
      ) : (
        <>
          <p className="mt-5 text-xs font-medium text-slate-500">
            {t.settings.staff.accounts(accounts.length)}
          </p>
          <div className="mt-3 divide-y divide-slate-100">
            {accounts.map((account) => (
              <StaffAccountRow
                key={account.id}
                account={account}
                isCurrentUser={account.id === currentUserId}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function StaffAccountRow({
  account,
  isCurrentUser,
}: {
  account: StaffAccount;
  isCurrentUser: boolean;
}) {
  const [roleState, roleAction, isSavingRoles] = useActionState(
    assignStaffRolesAction,
    initialActionState,
  );
  const [profileState, profileAction, isSavingProfile] = useActionState(
    updateStaffProfileAction,
    initialActionState,
  );
  const [statusState, statusAction, isSavingStatus] = useActionState(
    changeStaffStatusAction,
    initialActionState,
  );
  const canEditRoles = account.roles.every((role) =>
    STAFF_ROLES.some((available) => available.value === role),
  );

  return (
    <article className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {account.firstName} {account.lastName}
          {isCurrentUser ? (
            <span className="ml-2 font-normal text-slate-500">
              ({t.settings.staff.selfAccount})
            </span>
          ) : null}
        </p>
        <p className="truncate text-sm text-slate-500">{account.email}</p>
        {account.phone ? (
          <p className="text-xs text-slate-500">{account.phone}</p>
        ) : null}
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-indigo-700 hover:underline">
            {t.settings.staff.editProfile}
          </summary>
          <form
            action={profileAction}
            className="mt-2 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <ActionResultToast state={profileState} />
            <input type="hidden" name="userId" value={account.id} />
            <label className="text-xs font-medium text-slate-600">
              {t.settings.staff.firstName}
              <input
                name="firstName"
                defaultValue={account.firstName}
                required
                maxLength={100}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              {t.settings.staff.lastName}
              <input
                name="lastName"
                defaultValue={account.lastName}
                required
                maxLength={100}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              {t.settings.phone}
              <input
                name="phone"
                type="tel"
                defaultValue={account.phone ?? ""}
                maxLength={32}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="justify-self-start text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-50"
            >
              {isSavingProfile ? t.settings.staff.saving : t.settings.staff.save}
            </button>
          </form>
        </details>
      </div>

      <div>
        <ActionResultToast state={roleState} />
        {canEditRoles && !isCurrentUser ? (
          <form action={roleAction}>
            <input type="hidden" name="userId" value={account.id} />
            <fieldset className="flex flex-wrap gap-x-3 gap-y-1">
              <legend className="mb-1 text-xs font-medium text-slate-500">
                {t.settings.role}
              </legend>
              {STAFF_ROLES.map((role) => (
                <label
                  key={role.value}
                  className="inline-flex items-center gap-1 text-xs text-slate-600"
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={role.value}
                    defaultChecked={account.roles.includes(role.value)}
                    className="accent-indigo-600"
                  />
                  {role.label}
                </label>
              ))}
            </fieldset>
            <button
              type="submit"
              disabled={isSavingRoles}
              className="mt-2 text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-50"
            >
              {isSavingRoles ? t.settings.staff.saving : t.settings.staff.changeRole}
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-500">
            {account.roles.join(", ") || t.settings.staff.empty}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 md:justify-end">
        <ActionResultToast state={statusState} />
        <span className="text-xs text-slate-500">
          {account.status === "Active"
            ? t.settings.staff.active
            : t.settings.staff.inactive}
        </span>
        <form action={statusAction}>
          <input type="hidden" name="userId" value={account.id} />
          <input
            type="hidden"
            name="status"
            value={account.status === "Active" ? "Inactive" : "Active"}
          />
          <button
            type="submit"
            disabled={isCurrentUser || isSavingStatus}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {account.status === "Active"
              ? t.settings.staff.deactivate
              : t.settings.staff.activate}
          </button>
        </form>
      </div>
    </article>
  );
}
