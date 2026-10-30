import type { Metadata } from "next";

import { MasterDataManager } from "@/components/management/master-data-manager";
import { getRoomCreationOptions } from "@/lib/api/dormflow";

export const metadata: Metadata = {
  title: "ຈັດການຊັ້ນ",
};

export default async function MasterFloorsPage() {
  const roomCreationOptions = await getRoomCreationOptions();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          ຈັດການຊັ້ນ
        </h2>
        <p className="text-sm text-slate-500">
          ກຳນົດ ແລະ ຈັດການຊັ້ນພາຍໃນອາຄານ (ຮອງຮັບການສ້າງຊັ້ນແບບດ່ວນ)
        </p>
      </div>

      <MasterDataManager
        options={roomCreationOptions}
        embedded
        initialTab="floors"
        hideTabs
      />
    </div>
  );
}
