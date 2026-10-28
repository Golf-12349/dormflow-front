import type { Metadata } from "next";

import { MasterDataManager } from "@/components/management/master-data-manager";
import { getRoomCreationOptions } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "ຈັດການຂໍ້ມູນພື້ນຖານ",
};

export default async function MasterDataPage() {
  const roomCreationOptions = await getRoomCreationOptions();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          ຈັດການຂໍ້ມູນພື້ນຖານ
        </h2>
        <p className="text-sm text-slate-500">
          ກຳນົດ ແລະ ຈັດການໂຄງສ້າງຫໍພັກ, ອາຄານ, ຊັ້ນ ແລະ ປະເພດຫ້ອງພັກແບບຄົບວົງຈອນ
        </p>
      </div>

      <MasterDataManager options={roomCreationOptions} embedded />
    </div>
  );
}

