"use server";

/**
 * Tenant management Server Actions (Phase 6.5/6.6: add tenant, edit contact
 * and check-out tenant — this closes Phase 6).
 *
 * Follows `lib/actions/rooms.ts` exactly: every export of a `'use server'`
 * module is an async function, expected failures return a
 * useActionState-compatible state object instead of throwing, form fields are
 * re-validated on the server (the client is never trusted) and the English
 * data-layer error strings are localised on the way out.
 */

import { revalidatePath } from "next/cache";

import { t } from "@/lib/i18n";
import {
  checkOutTenant,
  createTenant,
  getRoomById,
  getTenantById,
  updateTenantContact,
} from "@/lib/api/dormflow";
import type {
  AddTenantFormState,
  CheckOutTenantFormState,
  EditContactFormState,
} from "@/types";

/** Deliberately loose shape check; the backend performs the authoritative validation. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lao wording for the English errors `createTenant()` /
 * `updateTenantContact()` / `checkOutTenant()` in `lib/api/dormflow.ts` can
 * return (the data layer stays English by convention):
 *
 * - `"Room not found."`
 * - `` `Room "<number>" is not vacant.` ``
 * - `"Tenant not found."`
 * - `"Tenant is not active."`
 * - `"Tenant has no room assigned."`
 * - `` `Room "<number>" is not occupied.` ``
 */
const DATA_LAYER_ERROR_TRANSLATIONS: Array<{
  pattern: RegExp;
  localize: (match: RegExpExecArray) => string;
}> = [
  {
    pattern: /^Room not found\.$/,
    localize: () => t.tenants.errors.roomNotFound,
  },
  {
    pattern: /^Room "([^"]+)" is not vacant\.$/,
    localize: (match) => t.tenants.errors.roomNotVacant(match[1]),
  },
  {
    pattern: /^Tenant not found\.$/,
    localize: () => t.tenants.errors.tenantNotFound,
  },
  {
    pattern: /^Tenant is not active\.$/,
    localize: () => t.tenants.errors.checkOutRequiresActive,
  },
  {
    pattern: /^Tenant has no room assigned\.$/,
    localize: () => t.tenants.errors.checkOutRequiresRoom,
  },
  {
    pattern: /^Room "([^"]+)" is not occupied\.$/,
    localize: (match) => t.tenants.errors.roomNotOccupied(match[1]),
  },
];

/**
 * Unknown wording from the API is passed
 * through as-is rather than throwing, so the form always shows something.
 */
function localizeDataLayerError(message: string): string {
  for (const { pattern, localize } of DATA_LAYER_ERROR_TRANSLATIONS) {
    const match = pattern.exec(message);
    if (match) return localize(match);
  }

  return message;
}

/** Trimmed string read; `null`/missing fields become `""`. */
function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * 6.5 — "add tenant". Every required field is re-checked here on the server;
 * the optional room assignment is re-read from the data layer (must exist and
 * be vacant) before `createTenant()` writes anything.
 */
export async function createTenantAction(
  _prevState: AddTenantFormState,
  formData: FormData,
): Promise<AddTenantFormState> {
  const fullName = readField(formData, "fullName");
  const email = readField(formData, "email");
  const phone = readField(formData, "phone");
  const idCard = readField(formData, "idCard");
  const emergencyName = readField(formData, "emergencyName");
  const emergencyPhone = readField(formData, "emergencyPhone");
  const roomId = readField(formData, "roomId") || null;

  // Server-side validation — the form's `required` attributes are only a
  // convenience for the browser; nothing coming from the client is trusted.
  if (!fullName) {
    return { status: "error", message: t.tenants.errors.fullNameRequired };
  }
  if (!email) {
    return { status: "error", message: t.tenants.errors.emailRequired };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: t.tenants.errors.emailInvalid };
  }
  if (!phone) {
    return { status: "error", message: t.tenants.errors.phoneRequired };
  }
  if (!idCard) {
    return { status: "error", message: t.tenants.errors.idCardRequired };
  }
  if (!emergencyName) {
    return {
      status: "error",
      message: t.tenants.errors.emergencyNameRequired,
    };
  }
  if (!emergencyPhone) {
    return {
      status: "error",
      message: t.tenants.errors.emergencyPhoneRequired,
    };
  }

  // Never trust the client: re-read the chosen room from the data layer.
  if (roomId) {
    const room = await getRoomById(roomId);
    if (!room) {
      return { status: "error", message: t.tenants.errors.roomNotFound };
    }
    if (room.status !== "vacant") {
      return {
        status: "error",
        message: t.tenants.errors.roomNotVacant(room.number),
      };
    }
  }

  const result = await createTenant({
    fullName,
    email,
    phone,
    idCard,
    emergencyContact: {
      name: emergencyName,
      phone: emergencyPhone,
    },
    roomId,
  });

  if (!result.success) {
    return { status: "error", message: localizeDataLayerError(result.error) };
  }

  revalidatePath("/tenants");
  revalidatePath("/dashboard");
  // Creating a contract changes the room's status, so refresh the rooms screen.
  if (result.tenant.roomId) {
    revalidatePath("/rooms");
  }

  return {
    status: "success",
    message: t.tenants.add.success(result.tenant.fullName),
  };
}

/**
 * 6.5 — "edit contact". Only email, phone and the emergency contact travel to
 * the server; the tenant is re-read from the data layer before the write.
 */
export async function updateTenantContactAction(
  _prevState: EditContactFormState,
  formData: FormData,
): Promise<EditContactFormState> {
  const tenantId = readField(formData, "tenantId");
  const email = readField(formData, "email");
  const phone = readField(formData, "phone");
  const emergencyName = readField(formData, "emergencyName");
  const emergencyPhone = readField(formData, "emergencyPhone");

  if (!tenantId) {
    return { status: "error", message: t.tenants.errors.tenantIdRequired };
  }
  if (!email) {
    return { status: "error", message: t.tenants.errors.emailRequired };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { status: "error", message: t.tenants.errors.emailInvalid };
  }
  if (!phone) {
    return { status: "error", message: t.tenants.errors.phoneRequired };
  }
  if (!emergencyName) {
    return {
      status: "error",
      message: t.tenants.errors.emergencyNameRequired,
    };
  }
  if (!emergencyPhone) {
    return {
      status: "error",
      message: t.tenants.errors.emergencyPhoneRequired,
    };
  }

  // Never trust the client: re-read the tenant from the data layer.
  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    return { status: "error", message: t.tenants.errors.tenantNotFound };
  }

  const result = await updateTenantContact(tenantId, {
    email,
    phone,
    emergencyContact: {
      name: emergencyName,
      phone: emergencyPhone,
    },
  });

  if (!result.success) {
    return { status: "error", message: localizeDataLayerError(result.error) };
  }

  revalidatePath("/tenants");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: t.tenants.editContact.success(result.tenant.fullName),
  };
}

/**
 * 6.5 — "check out tenant". Two records move in one mutation (tenant →
 * `inactive`, room → `vacant`), so eligibility is re-read from the data layer
 * and re-validated here before the write; `checkOutTenant()` re-checks both
 * stores as well. Confirmation is a client-side concern — this action only
 * guards state, never triggers on its own.
 */
export async function checkOutTenantAction(
  _prevState: CheckOutTenantFormState,
  formData: FormData,
): Promise<CheckOutTenantFormState> {
  const tenantId = readField(formData, "tenantId");

  if (!tenantId) {
    return { status: "error", message: t.tenants.errors.tenantIdRequired };
  }

  // Never trust the client: the status/room assignment may have changed since
  // the drawer or row menu rendered this form.
  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    return { status: "error", message: t.tenants.errors.tenantNotFound };
  }
  if (tenant.status !== "active") {
    return {
      status: "error",
      message: t.tenants.errors.checkOutRequiresActive,
    };
  }
  if (!tenant.roomId) {
    return { status: "error", message: t.tenants.errors.checkOutRequiresRoom };
  }

  const result = await checkOutTenant(tenantId);

  if (!result.success) {
    return { status: "error", message: localizeDataLayerError(result.error) };
  }

  revalidatePath("/tenants");
  revalidatePath("/dashboard");
  // The freed room leaves the rooms screen as well as the dashboard counts.
  revalidatePath("/rooms");

  return {
    status: "success",
    message: t.tenants.checkOut.success(
      result.tenant.fullName,
      result.room.number,
    ),
  };
}