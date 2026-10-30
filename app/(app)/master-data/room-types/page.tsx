import type { Metadata } from "next";

import { MasterDataManager } from "@/components/management/master-data-manager";
import { getRoomCreationOptions } from "@/lib/api/dormflow";

export const metadata: Metadata = {
  title: "ຈັດການປະເພດຫ້ອງ",
};

export default async function MasterRoomTypesPage() {
  const roomCreationOptions = await getRoomCreationOptions();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          ຈັດການປະເພດຫ້ອງ
        </h2>
        <p className="text-sm text-slate-500">
          ກຳນົດປະເພດຫ້ອງພັກ, ລາຄາຄ່າເຊົ່າ, ເງິນມັດຈຳ ແລະ ຈຳນວນຜູ້ພັກສູງສຸດ
        </p>
      </div>

      <MasterDataManager
        options={roomCreationOptions}
        embedded
        initialTab="roomTypes"
        hideTabs
      />
    </div>
  );
}

