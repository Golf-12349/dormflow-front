"use server";

/**
 * Billing Server Actions (Phase 7.2/7.3: save meter reading).
 *
 * Follows `lib/actions/tenants.ts` exactly: every export of a `'use server'`
 * module is an async function, expected failures return a
 * useActionState-compatible state object instead of throwing, form fields are
 * re-validated on the server (the client is never trusted) and the English
 * data-layer error strings are localised on the way out.
 */

import { revalidatePath } from "next/cache";

import { t } from "@/lib/i18n";
import {
  createInvoice,
  createUtilityReading,
  getCurrentPeriod,
  getInvoices,
  getRoomById,
  getUtilityReadingsByRoom,
} from "@/lib/mock-data";
import type { InvoiceGenerationFormState, MeterReadingFormState } from "@/types";

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Lao wording for the English errors `createUtilityReading()` in
 * `lib/mock-data.ts` can return (the data layer stays English by
 * convention):
 *
 * - `"Room not found."`
 * - `` `Reading for room "<number>" in period "<period>" already exists.` ``
 */
const DATA_LAYER_ERROR_TRANSLATIONS: Array<{
  pattern: RegExp;
  localize: (match: RegExpExecArray) => string;
}> = [
  {
    pattern: /^Room not found\.$/,
    localize: () => t.billing.meter.errors.roomNotFound,
  },
  {
    pattern: /^Reading for room "[^"]+" in period "[^"]+" already exists\.$/,
    localize: () => t.billing.meter.errors.duplicate,
  },
];

/**
 * Unknown wording (e.g. the mock data layer is reworded later) falls back to
 * `t.billing.meter.errors.unknown` rather than throwing, so the form always
 * shows a Lao message.
 */
function localizeDataLayerError(message: string): string {
  for (const { pattern, localize } of DATA_LAYER_ERROR_TRANSLATIONS) {
    const match = pattern.exec(message);
    if (match) return localize(match);
  }

  return t.billing.meter.errors.unknown;
}

/** Trimmed string read; `null`/missing fields become `""`. */
function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

type MeterReadingField =
  | "electricPrevious"
  | "electricCurrent"
  | "waterPrevious"
  | "waterCurrent";

/** Empty strings count as invalid; only finite numbers >= 0 pass. */
function parseReadingValue(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

/**
 * 7.2/7.3 — "save meter reading". Every field is re-checked here on the
 * server in exactly this order, and the first failure is returned as a
 * state object (never thrown):
 *
 * a. period matches `YYYY-MM`;
 * b. period is not later than `getCurrentPeriod()`;
 * c. the room exists and is `occupied`;
 * d. all four readings are finite numbers >= 0;
 * e. no reading exists for the same period, and no reading exists for a
 *    later period (protects the cumulative meter chain);
 * f. the authoritative previous values come from the latest earlier
 *    reading when one exists, otherwise from the submitted previous values;
 * g. current readings are >= their previous readings (both meters reported
 *    when both fail);
 * h. the write goes through `createUtilityReading()`, whose English
 *    errors are localised on the way out.
 */
export async function saveMeterReadingAction(
  _prevState: MeterReadingFormState,
  formData: FormData,
): Promise<MeterReadingFormState> {
  const roomId = readField(formData, "roomId");
  const period = readField(formData, "period");

  if (!PERIOD_PATTERN.test(period)) {
    return { status: "error", message: t.billing.meter.errors.invalidPeriod };
  }

  if (period > getCurrentPeriod()) {
    return { status: "error", message: t.billing.meter.errors.futurePeriod };
  }

  const room = await getRoomById(roomId);
  if (!room) {
    return { status: "error", message: t.billing.meter.errors.roomNotFound };
  }
  if (room.status !== "occupied") {
    return {
      status: "error",
      message: t.billing.meter.errors.roomNotOccupied,
    };
  }

  const rawValues: Record<MeterReadingField, string> = {
    electricPrevious: readField(formData, "electricPrevious"),
    electricCurrent: readField(formData, "electricCurrent"),
    waterPrevious: readField(formData, "waterPrevious"),
    waterCurrent: readField(formData, "waterCurrent"),
  };
  const values: Record<MeterReadingField, number | null> = {
    electricPrevious: parseReadingValue(rawValues.electricPrevious),
    electricCurrent: parseReadingValue(rawValues.electricCurrent),
    waterPrevious: parseReadingValue(rawValues.waterPrevious),
    waterCurrent: parseReadingValue(rawValues.waterCurrent),
  };
  const invalidEntries = (Object.keys(values) as MeterReadingField[]).filter(
    (field) => values[field] === null,
  );
  if (invalidEntries.length > 0) {
    const fieldErrors: MeterReadingFormState["fieldErrors"] = {};
    for (const field of invalidEntries) {
      fieldErrors[field] = t.billing.meter.errors.invalidNumber;
    }
    return {
      status: "error",
      message: t.billing.meter.errors.invalidNumber,
      fieldErrors,
    };
  }

  const history = await getUtilityReadingsByRoom(roomId);
  if (history.some((reading) => reading.period === period)) {
    return { status: "error", message: t.billing.meter.errors.duplicate };
  }
  if (history.some((reading) => reading.period > period)) {
    return { status: "error", message: t.billing.meter.errors.laterExists };
  }

  const earlier = history
    .filter((reading) => reading.period < period)
    .sort((a, b) => b.period.localeCompare(a.period))[0];
  const electricPrevious = earlier
    ? earlier.electricCurrent
    : (values.electricPrevious as number);
  const waterPrevious = earlier
    ? earlier.waterCurrent
    : (values.waterPrevious as number);
  const electricCurrent = values.electricCurrent as number;
  const waterCurrent = values.waterCurrent as number;

  const belowPreviousFieldErrors: MeterReadingFormState["fieldErrors"] = {};
  if (electricCurrent < electricPrevious) {
    belowPreviousFieldErrors.electricCurrent =
      t.billing.meter.errors.electricBelowPrevious;
  }
  if (waterCurrent < waterPrevious) {
    belowPreviousFieldErrors.waterCurrent =
      t.billing.meter.errors.waterBelowPrevious;
  }
  if (Object.keys(belowPreviousFieldErrors).length > 0) {
    const messages = [
      belowPreviousFieldErrors.electricCurrent,
      belowPreviousFieldErrors.waterCurrent,
    ].filter((message): message is string => message !== undefined);
    return {
      status: "error",
      message: messages.join(" "),
      fieldErrors: belowPreviousFieldErrors,
    };
  }

  const result = await createUtilityReading({
    roomId,
    period,
    electricPrevious,
    electricCurrent,
    waterPrevious,
    waterCurrent,
  });

  if (!result.success) {
    return { status: "error", message: localizeDataLayerError(result.error) };
  }

  revalidatePath("/billing");
  // The room drawer shows meter history, so it must re-render too.
  revalidatePath("/rooms");

  return {
    status: "success",
    message: t.billing.meter.success(room.number),
  };
}

/**
 * Lao wording for the English errors `createInvoice()` in
 * `lib/mock-data.ts` can return (the data layer stays English by
 * convention):
 *
 * - `"Room is not billable."`
 * - `"Tenant not found."`
 * - `` `No meter reading for room "<number>" in period "<period>".` ``
 * - `` `Invoice for room "<number>" in period "<period>" already exists.` ``
 */
const INVOICE_DATA_LAYER_ERROR_TRANSLATIONS: Array<{
  pattern: RegExp;
  localize: () => string;
}> = [
  {
    pattern: /^Room is not billable\.$/,
    localize: () => t.billing.invoice.generate.errors.noTenant,
  },
  {
    pattern: /^Tenant not found\.$/,
    localize: () => t.billing.invoice.generate.errors.noTenant,
  },
  {
    pattern: /^No meter reading for room "[^"]+" in period "[^"]+"\.$/,
    localize: () => t.billing.invoice.generate.errors.noReading,
  },
  {
    pattern: /^Invoice for room "[^"]+" in period "[^"]+" already exists\.$/,
    localize: () => t.billing.invoice.generate.errors.duplicate,
  },
];

/**
 * Unknown wording falls back to `t.billing.invoice.generate.errors.unknown`
 * rather than throwing, so the form always shows a Lao message.
 */
function localizeInvoiceDataLayerError(message: string): string {
  for (const { pattern, localize } of INVOICE_DATA_LAYER_ERROR_TRANSLATIONS) {
    if (pattern.test(message)) return localize();
  }

  return t.billing.invoice.generate.errors.unknown;
}

/**
 * 7.4 — "generate invoice". Every field is re-checked here on the
 * server in exactly this order, and the first failure is returned as a
 * state object (never thrown):
 *
 * a. period matches `YYYY-MM`;
 * b. period is not later than `getCurrentPeriod()`;
 * c. the room exists (`roomNotFound`), is `occupied` and has a tenant
 *    (`noTenant`);
 * d. otherFee is empty (= 0) or a finite number >= 0
 *    (`invalidOtherFee` + `fieldErrors.otherFee`);
 * e. a reading exists for the period (`noReading`);
 * f. no invoice exists for the same room + period (`duplicate`);
 * g. the write goes through `createInvoice()`, whose English errors are
 *    localised on the way out (`unknown` fallback).
 */
export async function generateInvoiceAction(
  _prevState: InvoiceGenerationFormState,
  formData: FormData,
): Promise<InvoiceGenerationFormState> {
  const roomId = readField(formData, "roomId");
  const period = readField(formData, "period");

  if (!PERIOD_PATTERN.test(period)) {
    return {
      status: "error",
      message: t.billing.invoice.generate.errors.invalidPeriod,
    };
  }

  if (period > getCurrentPeriod()) {
    return {
      status: "error",
      message: t.billing.invoice.generate.errors.futurePeriod,
    };
  }

  const room = await getRoomById(roomId);
  if (!room) {
    return {
      status: "error",
      message: t.billing.invoice.generate.errors.roomNotFound,
    };
  }
  if (room.status !== "occupied" || !room.tenantId) {
    return {
      status: "error",
      message: t.billing.invoice.generate.errors.noTenant,
    };
  }

  const rawOtherFee = readField(formData, "otherFee");
  const otherFee = rawOtherFee === "" ? 0 : Number(rawOtherFee);
  if (!Number.isFinite(otherFee) || otherFee < 0) {
    return {
      status: "error",
      message: t.billing.invoice.generate.errors.invalidOtherFee,
      fieldErrors: {
        otherFee: t.billing.invoice.generate.errors.invalidOtherFee,
      },
    };
  }

  const history = await getUtilityReadingsByRoom(roomId);
  if (!history.some((reading) => reading.period === period)) {
    return {
      status: "error",
      message: t.billing.invoice.generate.errors.noReading,
    };
  }

  const existing = await getInvoices({ period });
  if (existing.some((invoice) => invoice.roomId === roomId)) {
    return {
      status: "error",
      message: t.billing.invoice.generate.errors.duplicate,
    };
  }

  const result = await createInvoice({ roomId, period, otherFee });

  if (!result.success) {
    return {
      status: "error",
      message: localizeInvoiceDataLayerError(result.error),
    };
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/tenants");

  return {
    status: "success",
    message: t.billing.invoice.generate.success(
      result.invoice.invoiceNumber,
      room.number,
    ),
  };
}
