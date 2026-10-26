"use server";

/**
 * Room management Server Actions.
 *
 * Every export of a `'use server'` module must be an async function.
 * Expected failures return a state object (useActionState-compatible)
 * instead of throwing.
 */

import { revalidatePath } from "next/cache";

import { t } from "@/lib/i18n";
import {
  createRoom,
  getRoomById,
  updateRoomDetails,
  updateRoomStatus,
} from "@/lib/api/dormflow";
import { ROOM_STATUS_LABELS } from "@/lib/utils";
import type { RoomStatus, RoomStatusFormState } from "@/types";

const ALLOWED_TARGET_STATUSES: RoomStatus[] = ["vacant", "maintenance"];

/**
 * Lao wording for the two English errors `updateRoomStatus()` in
 * `lib/api/dormflow.ts` can return. That module is deliberately left in English
 * (do-not-touch), so they are translated here instead:
 *
 * - `"Room not found."`
 * - `` `Transition from "<from>" to "<to>" is not allowed.` ``
 *
 * The transition message carries raw status keys, so its captures are mapped
 * through `ROOM_STATUS_LABELS` (which is already Lao) on the way out.
 */
const DATA_LAYER_ERROR_TRANSLATIONS: Array<{
  pattern: RegExp;
  localize: (match: RegExpExecArray) => string;
}> = [
  {
    pattern: /^Room not found\.$/,
    localize: () => t.rooms.errors.roomNotFound,
  },
  {
    pattern: /^Transition from "([^"]+)" to "([^"]+)" is not allowed\.$/,
    localize: (match) =>
      t.rooms.errors.transitionNotAllowed(
        localizeRoomStatus(match[1]),
        localizeRoomStatus(match[2]),
      ),
  },
];

/** Raw `RoomStatus` key -> Lao label, falling back to the key itself. */
function localizeRoomStatus(raw: string): string {
  return ROOM_STATUS_LABELS[raw as RoomStatus] ?? raw;
}

/**
 * Unknown wording from the API is passed
 * through as-is rather than throwing, so the drawer always shows something.
 */
function localizeDataLayerError(message: string): string {
  for (const { pattern, localize } of DATA_LAYER_ERROR_TRANSLATIONS) {
    const match = pattern.exec(message);
    if (match) return localize(match);
  }

  return message;
}

export async function createRoomAction(
  _prevState: RoomStatusFormState,
  formData: FormData,
): Promise<RoomStatusFormState> {
  const buildingId = String(formData.get("buildingId") ?? "").trim();
  const floorId = String(formData.get("floorId") ?? "").trim();
  const roomTypeId = String(formData.get("roomTypeId") ?? "").trim();
  const roomNumber = String(formData.get("roomNumber") ?? "").trim();
  const rawMonthlyRent = String(formData.get("monthlyRent") ?? "").trim();
  const rawDepositAmount = String(formData.get("depositAmount") ?? "").trim();
  const rawMaximumOccupants = String(formData.get("maximumOccupants") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!buildingId) {
    return { status: "error", message: t.rooms.errors.buildingRequired };
  }
  if (!floorId) {
    return { status: "error", message: t.rooms.errors.floorRequired };
  }
  if (!roomTypeId) {
    return { status: "error", message: t.rooms.errors.roomTypeRequired };
  }
  if (!roomNumber) {
    return { status: "error", message: t.rooms.errors.roomNumberRequired };
  }

  const monthlyRent = rawMonthlyRent === "" ? Number.NaN : Number(rawMonthlyRent);
  if (!Number.isFinite(monthlyRent) || monthlyRent < 0) {
    return { status: "error", message: t.rooms.errors.invalidRent };
  }

  const depositAmount = rawDepositAmount === "" ? 0 : Number(rawDepositAmount);
  if (!Number.isFinite(depositAmount) || depositAmount < 0) {
    return { status: "error", message: t.rooms.errors.invalidDeposit };
  }

  const maximumOccupants =
    rawMaximumOccupants === "" ? 1 : Math.floor(Number(rawMaximumOccupants));
  if (!Number.isFinite(maximumOccupants) || maximumOccupants <= 0) {
    return { status: "error", message: t.rooms.errors.invalidOccupants };
  }

  const result = await createRoom({
    buildingId,
    floorId,
    roomTypeId,
    roomNumber,
    monthlyRent,
    depositAmount,
    maximumOccupants,
    description,
  });

  if (!result.success) {
    return {
      status: "error",
      message: localizeDataLayerError(result.error),
    };
  }

  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/tenants");

  return {
    status: "success",
    message: t.rooms.add.success(result.room.number),
  };
}

export async function changeRoomStatusAction(
  _prevState: RoomStatusFormState,
  formData: FormData,
): Promise<RoomStatusFormState> {
  const roomId = String(formData.get("roomId") ?? "").trim();
  const nextStatus = String(
    formData.get("nextStatus") ?? "",
  ).trim() as RoomStatus;

  if (!roomId) {
    return {
      status: "error",
      message: t.rooms.errors.roomIdRequired,
    };
  }

  if (!ALLOWED_TARGET_STATUSES.includes(nextStatus)) {
    return {
      status: "error",
      message: t.rooms.errors.targetStatusInvalid,
    };
  }

  // Never trust the client: re-read the room from the data layer and verify
  const room = await getRoomById(roomId);
  if (!room) {
    return {
      status: "error",
      message: t.rooms.errors.roomNotFound,
    };
  }

  // Invariant & business rules:
  // - occupied and reserved rooms cannot be changed here (driven by lease/reservation flows)
  // - only occupied rooms have a tenantId
  // - vacant -> maintenance
  // - maintenance -> vacant
  if (room.status === "occupied" || room.status === "reserved") {
    return {
      status: "error",
      message: t.rooms.errors.statusLocked(ROOM_STATUS_LABELS[room.status]),
    };
  }

  if (room.status === nextStatus) {
    return {
      status: "error",
      message: t.rooms.errors.alreadyInStatus(ROOM_STATUS_LABELS[nextStatus]),
    };
  }

  const isVacantToMaintenance =
    room.status === "vacant" && nextStatus === "maintenance";
  const isMaintenanceToVacant =
    room.status === "maintenance" && nextStatus === "vacant";

  if (!isVacantToMaintenance && !isMaintenanceToVacant) {
    return {
      status: "error",
      message: t.rooms.errors.transitionNotAllowed(
        ROOM_STATUS_LABELS[room.status],
        ROOM_STATUS_LABELS[nextStatus],
      ),
    };
  }

  const result = await updateRoomStatus(roomId, nextStatus);

  if (!result.success) {
    return {
      status: "error",
      message: localizeDataLayerError(result.error),
    };
  }

  revalidatePath("/rooms");
  revalidatePath("/dashboard");

  const successMessage =
    nextStatus === "maintenance"
      ? t.rooms.statusChangedToMaintenance(result.room.number)
      : t.rooms.statusChangedToVacant(result.room.number);

  return {
    status: "success",
    message: successMessage,
  };
}

export async function updateRoomDetailsAction(
  _prevState: RoomStatusFormState,
  formData: FormData,
): Promise<RoomStatusFormState> {
  const roomId = String(formData.get("roomId") ?? "").trim();
  const roomNumber = String(formData.get("roomNumber") ?? "").trim();
  const rawMonthlyRent = String(formData.get("monthlyRent") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!roomId) {
    return { status: "error", message: t.rooms.errors.roomIdRequired };
  }
  if (!roomNumber) {
    return { status: "error", message: t.rooms.errors.roomNumberRequired };
  }
  const monthlyRent =
    rawMonthlyRent === "" ? Number.NaN : Number(rawMonthlyRent);
  if (!Number.isFinite(monthlyRent) || monthlyRent < 0) {
    return { status: "error", message: t.rooms.errors.invalidRent };
  }

  const result = await updateRoomDetails(roomId, {
    roomNumber,
    monthlyRent,
    description,
  });

  if (!result.success) {
    return {
      status: "error",
      message: localizeDataLayerError(result.error),
    };
  }

  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/tenants");
  revalidatePath("/billing");
  revalidatePath("/management");

  return {
    status: "success",
    message: t.rooms.edit.success(result.room.number),
  };
}
