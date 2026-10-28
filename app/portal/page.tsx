import type { Metadata } from "next";
import { TenantPortalView } from "@/components/portal/tenant-portal-view";
import { getRooms, getTenants } from "@/lib/api/dormflow";

export const metadata: Metadata = {
  title: "DormHub Resident Portal - ຜູ້ເຊົ່າຫໍພັກ",
  description: "ລະບົບຜູ້ເຊົ່າຫໍພັກອອນລາຍ ສຳລັບກວດກາໃບບິນ, ຊຳລະເງິນ ແລະ ແຈ້ງສ້ອມແປງ",
};

export default async function PortalPage() {
  const [rooms, tenants] = await Promise.all([getRooms(), getTenants()]);

  // Find Room 201 or fall back to first occupied room
  const targetRoom =
    rooms.find((r) => r.number === "201" || r.number.includes("201")) ??
    rooms.find((r) => r.status === "occupied") ??
    rooms[0];

  const targetTenant = targetRoom?.tenantId
    ? tenants.find((t) => t.id === targetRoom.tenantId)
    : null;

  return (
    <TenantPortalView
      tenantName={targetTenant?.fullName ?? "ທ້າວ ສົມສັກ ວົງວິໄລ"}
      roomNumber={targetRoom?.number ?? "201"}
      buildingName={targetRoom?.buildingName ?? "ອາຄານ A"}
      floor={targetRoom?.floor ?? 2}
      roomId={targetRoom?.id ?? "room-201-id"}
      tenantId={targetTenant?.id ?? "tenant-somsak-001"}
    />
  );
}
