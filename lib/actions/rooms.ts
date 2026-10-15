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
import { getRoomById, updateRoomStatus } from "@/lib/mock-data";
import { ROOM_STATUS_LABELS } from "@/lib/utils";
import type { RoomStatus, RoomStatusFormState } from "@/types";

const ALLOWED_TARGET_STATUSES: RoomStatus[] = ["vacant", "maintenance"];

/**
 * Lao wording for the two English errors `updateRoomStatus()` in
 * `lib/mock-data.ts` can return. That module is deliberately left in English
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
 * Unknown wording (e.g. the mock data layer is reworded later) is passed
 * through as-is rather than throwing, so the drawer always shows something.
 */
function localizeDataLayerError(message: string): string {
  for (const { pattern, localize } of DATA_LAYER_ERROR_TRANSLATIONS) {
    const match = pattern.exec(message);
    if (match) return localize(match);
  }

  return message;
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
