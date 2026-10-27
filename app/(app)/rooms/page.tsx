import type { Metadata } from "next";

import { t } from "@/lib/i18n";
import {
  getAllUtilityReadingsGroupedByRoom,
  getRoomCreationOptions,
  getRooms,
  getTenants,
  getUtilityRates,
} from "@/lib/api/dormflow";
import type { Tenant, UtilityReading } from "@/types";
import { MasterDataManager } from "@/components/management/master-data-manager";
import { AddRoomForm } from "./add-room-form";
import { RoomInventoryView } from "./room-inventory-view";

export const metadata: Metadata = {
  title: t.nav.rooms,
};

/**
 * Phase 5 — the room inventory screen.
 *
 * Stays an async Server Component (locked decision: data is fetched here, not in
 * the client): 5.1/5.2 views, 5.3 badges and the 5.4/5.5 filters live in
 * `<RoomInventoryView />`, while 5.6's drawer data — tenants, per-room meter
 * history and the utility rates — is fetched here and passed down as plain props.
 */
export default async function RoomsPage() {
  const [rooms, tenants, rates, roomCreationOptions, groupedReadings] =
    await Promise.all([
      getRooms(),
      getTenants(),
      getUtilityRates(),
      getRoomCreationOptions(),
      getAllUtilityReadingsGroupedByRoom(),
    ]);

  /**
   * Meter history for every room, pre-loaded in one bulk query.
   */
  const readingsByRoomId: Record<string, UtilityReading[]> = Object.fromEntries(
    rooms.map((room) => [room.id, groupedReadings[room.id] ?? []] as const),
  );

  /** Tenant lookup by room id, used by the detail drawer (5.6). */
  const tenantsByRoomId: Record<string, Tenant> = {};
  for (const tenant of tenants) {
    if (tenant.roomId) tenantsByRoomId[tenant.roomId] = tenant;
  }

  const tenantNames = new Map(
    tenants.map((tenant) => [tenant.id, tenant.fullName]),
  );

  const roomItems = rooms.map((room) => ({
    ...room,
    tenantName: room.tenantId
      ? tenantNames.get(room.tenantId) ?? t.rooms.noTenant
      : t.rooms.noTenant,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
            {t.nav.rooms}
          </h2>
          <p className="text-sm text-slate-500">{t.rooms.subtitle(rooms.length)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <MasterDataManager options={roomCreationOptions} />
          <AddRoomForm options={roomCreationOptions} />
        </div>
      </div>

      <RoomInventoryView
        rooms={roomItems}
        tenantsByRoomId={tenantsByRoomId}
        readingsByRoomId={readingsByRoomId}
        rates={rates}
        options={roomCreationOptions}
      />
    </div>
  );
}
