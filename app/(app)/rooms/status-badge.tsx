import {
  ROOM_STATUS_BADGE_CLASSES,
  ROOM_STATUS_LABELS,
  cn,
} from "@/lib/utils";
import type { RoomStatus } from "@/types";

/**
 * Room status badge (5.3).
 *
 * Lives in its own module so the inventory views and the room detail drawer can
 * both use it without importing each other.
 */
export function StatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        ROOM_STATUS_BADGE_CLASSES[status],
      )}
    >
      {ROOM_STATUS_LABELS[status]}
    </span>
  );
}
