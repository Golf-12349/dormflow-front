import type { Metadata } from "next";

import { MasterDataManager } from "@/components/management/master-data-manager";
import { getRoomCreationOptions } from "@/lib/api/dormflow";

export const metadata: Metadata = {
  title: "ຈັດການຫໍພັກ",
};

export default async function MasterDormitoriesPage() {
  const roomCreationOptions = await getRoomCreationOptions();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          ຈັດການຫໍພັກ
        </h2>
        <p className="text-sm text-slate-500">
          ກຳນົດຂໍ້ມູນຫໍພັກ, ທີ່ຢູ່, ອັດຕາຄ່ານ້ຳ-ຄ່າໄຟ ແລະ ການວາງບິນປະຈຳເດືອນ
        </p>
      </div>

      <MasterDataManager
        options={roomCreationOptions}
        embedded
        initialTab="dormitories"
        hideTabs
      />
    </div>
  );
}

