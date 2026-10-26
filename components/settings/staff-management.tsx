"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Users } from "lucide-react";

import {
  assignStaffRolesAction,
  changeStaffStatusAction,
  createStaffAction,
  updateStaffProfileAction,
} from "@/lib/actions/staff";
import { t } from "@/lib/i18n";

export interface StaffUserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
}

const ROLE_OPTIONS = [
  { value: "Owner", label: t.settings.staff.admin },
  { value: "DormManager", label: t.settings.staff.manager },
  { value: "Accountant", label: t.settings.staff.accountant },
  { value: "Staff", label: t.settings.staff.staffRole },
  { value: "Technician", label: t.settings.staff.technician },
] as const;

const INITIAL_STATE = { status: "idle" as const, message: null };

export function StaffManagement({
  users,
  currentUserId,
  organizations,
}: {
  users: StaffUserItem[];
  currentUserId: string;
  organizations: Array<{ id: string; name: string; code: string }>;
}) {
  const [openCreate, setOpenCreate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [createState, createFormAction, createPending] = useActionState(
    createStaffAction,
    INITIAL_STATE,
  );
  const [roleState, roleFormAction, rolePending] = useActionState(
    assignStaffRolesAction,
    INITIAL_STATE,
  );
  const [statusState, statusFormAction, statusPending] = useActionState(
    changeStaffStatusAction,
    INITIAL_STATE,
  );
  const [profileState, profileFormAction, profilePending] = useActionState(
    updateStaffProfileAction,
    INITIAL_STATE,
  );

  const feedback = profileState.message
    ? profileState
    : statusState.message
      ? statusState
      : roleState.message
        ? roleState
        : createState;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-indigo-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">
              {t.settings.staff.title}
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {t.settings.staff.accounts(users.length)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t.settings.staff.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/management/administration/users"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t.management.modules.users.title}
          </Link>
          <button
            type="button"
            onClick={() => setOpenCreate((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {openCreate ? t.settings.staff.cancel : t.settings.staff.add}
          </button>
        </div>
      </div>

      {feedback.message ? (
        <p
          role={feedback.status === "error" ? "alert" : "status"}
          className={`mt-4 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
            feedback.status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {openCreate ? (
        <form
          action={createFormAction}
          className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="text-xs font-medium text-slate-700">
            {t.settings.staff.firstName} *
            <input
              required
              name="firstName"
              type="text"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            {t.settings.staff.lastName} *
            <input
              required
              name="lastName"
              type="text"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            {t.settings.email} *
            <input
              required
              name="email"
              type="email"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            {t.settings.phone}
            <input
              name="phone"
              type="tel"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            {t.settings.staff.password} *
            <input
              required
              name="password"
              type="password"
              placeholder={t.settings.staff.passwordHint}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            {t.settings.role} *
            <select
              required
              name="role"
              defaultValue="Staff"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {organizations.length > 1 ? (
            <label className="text-xs font-medium text-slate-700">
              {t.management.table.fields.organizationId}
              <select
                name="organizationId"
                defaultValue={organizations[0]?.id ?? ""}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={createPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {createPending ? t.settings.staff.saving : t.settings.staff.save}
            </button>
          </div>
        </form>
      ) : null}

      {users.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t.settings.staff.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">{t.settings.name}</th>
                <th className="px-3 py-2">{t.settings.email}</th>
                <th className="px-3 py-2">{t.settings.role}</th>
                <th className="px-3 py-2">{t.settings.staff.status}</th>
                <th className="py-2 pl-3 text-right">
                  {t.management.workflows.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isActive = user.status.toLowerCase() === "active";
                const primaryRole = user.roles[0] ?? "Staff";
                const isEditing = editingUserId === user.id;
                return (
                  <tr key={user.id} className="align-top">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">
                      <div>
                        {`${user.firstName} ${user.lastName}`.trim()}
                        {isSelf ? (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-600">
                            {t.settings.staff.selfAccount}
                          </span>
                        ) : null}
                      </div>
                      {isEditing ? (
                        <form
                          action={profileFormAction}
                          className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2"
                        >
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            required
                            name="firstName"
                            defaultValue={user.firstName}
                            placeholder={t.settings.staff.firstName}
                            className="w-28 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                          />
                          <input
                            required
                            name="lastName"
                            defaultValue={user.lastName}
                            placeholder={t.settings.staff.lastName}
                            className="w-28 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                          />
                          <input
                            name="phone"
                            defaultValue={user.phone ?? ""}
                            placeholder={t.settings.phone}
                            className="w-28 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                          />
                          <button
                            type="submit"
                            disabled={profilePending}
                            className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {t.common.save}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                          >
                            {t.settings.staff.cancel}
                          </button>
                        </form>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{user.email}</td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {user.roles.join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isActive
                          ? t.settings.staff.active
                          : t.settings.staff.inactive}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingUserId(isEditing ? null : user.id)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="size-3" aria-hidden="true" />
                          {t.settings.staff.editProfile}
                        </button>
                        {!isSelf ? (
                          <>
                            <form
                              action={roleFormAction}
                              className="inline-flex items-center gap-1"
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <select
                                name="roles"
                                defaultValue={primaryRole}
                                aria-label={t.settings.staff.changeRole}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                              >
                                {ROLE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                disabled={rolePending}
                                className="rounded-lg border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                              >
                                {t.settings.staff.changeRole}
                              </button>
                            </form>
                            <form action={statusFormAction}>
                              <input
                                type="hidden"
                                name="userId"
                                value={user.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value={isActive ? "Inactive" : "Active"}
                              />
                              <button
                                type="submit"
                                disabled={statusPending}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                {isActive
                                  ? t.settings.staff.deactivate
                                  : t.settings.staff.activate}
                              </button>
                            </form>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
