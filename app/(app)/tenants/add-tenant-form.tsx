"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";

import { createTenantAction } from "@/lib/actions/tenants";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AddTenantFormState, Room } from "@/types";
import { TenantFormField } from "./tenant-form-field";

const INITIAL_ADD_STATE: AddTenantFormState = {
  status: "idle",
  message: null,
};

const LABEL_CLASSES = "block text-sm font-medium text-slate-700";
const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none focus:border-indigo-400";
const LEGEND_CLASSES =
  "px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase";

interface AddTenantFormProps {
  /** Rooms with status "vacant", pre-filtered by the page — assignable options. */
  vacantRooms: Room[];
}

/**
 * 6.5 — "add tenant": trigger button plus an expandable form rendered above
 * the table. Every field is re-validated by `createTenantAction` on the
 * server; the UI follows the Rooms 5.7 pattern (pending state + inline
 * `role="status"` aria-live result message).
 *
 * The panel stays open after a result so errors remain readable; collapsing
 * it unmounts the uncontrolled inputs, which clears the form.
 */
export function AddTenantForm({ vacantRooms }: AddTenantFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createTenantAction,
    INITIAL_ADD_STATE,
  );

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="add-tenant-form"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <UserPlus className="size-4" aria-hidden="true" />
          {t.tenants.add.trigger}
        </button>
      </div>

      {isOpen ? (
        <div
          id="add-tenant-form"
          className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900">
            {t.tenants.add.title}
          </h3>

          <form action={formAction} className="mt-4 space-y-5" noValidate>
            {state.status !== "idle" && state.message ? (
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "flex items-start gap-2 rounded-xl border p-3 text-xs",
                  state.status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700",
                )}
              >
                {state.status === "success" ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0 text-rose-500"
                    aria-hidden="true"
                  />
                )}
                <p>{state.message}</p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TenantFormField
                  id="add-full-name"
                  name="fullName"
                  label={t.tenants.add.fullName}
                  autoComplete="name"
                />
              </div>
              <TenantFormField
                id="add-email"
                name="email"
                label={t.tenants.profile.fields.email}
                type="email"
                autoComplete="email"
              />
              <TenantFormField
                id="add-phone"
                name="phone"
                label={t.tenants.profile.fields.phone}
                type="tel"
                autoComplete="tel"
              />
              <TenantFormField
                id="add-id-card"
                name="idCard"
                label={t.tenants.profile.fields.idCard}
              />
              <TenantFormField
                id="add-occupation"
                name="occupation"
                label={t.tenants.profile.fields.occupation}
              />
            </div>

            <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <legend className={LEGEND_CLASSES}>
                {t.tenants.profile.sections.emergency}
              </legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <TenantFormField
                  id="add-ec-name"
                  name="emergencyName"
                  label={t.tenants.profile.fields.contactName}
                />
                <TenantFormField
                  id="add-ec-relationship"
                  name="emergencyRelationship"
                  label={t.tenants.profile.fields.relationship}
                />
                <TenantFormField
                  id="add-ec-phone"
                  name="emergencyPhone"
                  label={t.tenants.profile.fields.phone}
                  type="tel"
                />
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="add-room" className={LABEL_CLASSES}>
                {t.tenants.fields.room}
              </label>
              <select
                id="add-room"
                name="roomId"
                defaultValue=""
                className={INPUT_CLASSES}
              >
                <option value="">{t.tenants.noRoom}</option>
                {vacantRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {t.rooms.roomTitle(room.number)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {t.tenants.cancel}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>{t.tenants.add.saving}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" aria-hidden="true" />
                    <span>{t.tenants.add.submit}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}