import type { Metadata } from "next";

import { MasterDataManager } from "@/components/management/master-data-manager";
import { getRoomCreationOptions } from "@/lib/api/dormflow";

export const metadata: Metadata = {
  title: "ຈັດການອາຄານ",
};

export default async function MasterBuildingsPage() {
  const roomCreationOptions = await getRoomCreationOptions();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          ຈັດການອາຄານ
        </h2>
        <p className="text-sm text-slate-500">
          ກຳນົດ ແລະ ຈັດການອາຄານພາຍໃນຫໍພັກ
        </p>
      </div>

      <MasterDataManager
        options={roomCreationOptions}
        embedded
        initialTab="buildings"
        hideTabs
      />
    </div>
  );
}
