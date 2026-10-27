"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiRequest } from "@/lib/api/client";
import { resolveDefaultOrganizationId } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";
import { verifySession } from "@/lib/session";

export type MasterDataActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

function revalidateAllMasterDataPages() {
  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  revalidatePath("/tenants");
  revalidatePath("/billing");
  revalidatePath("/settings");
  revalidatePath("/management");
  revalidatePath("/management/properties");
  revalidatePath("/management/properties/dormitories");
  revalidatePath("/management/properties/buildings");
  revalidatePath("/management/properties/floors");
  revalidatePath("/management/properties/room-types");
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return t.management.workflows.failure;
}

export async function createMasterDormitoryAction(
  _prevState: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  const session = await verifySession();
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const billingDay = Number(formData.get("billingDay") || 1);
  const paymentDueDay = Number(formData.get("paymentDueDay") || 5);
  const waterRatePerUnit = Number(formData.get("waterRatePerUnit") || 0);
  const electricityRatePerUnit = Number(
    formData.get("electricityRatePerUnit") || 0,
  );

  if (
    !code ||
    !name ||
    !Number.isFinite(billingDay) ||
    billingDay < 1 ||
    billingDay > 28 ||
    !Number.isFinite(paymentDueDay) ||
    paymentDueDay < 1 ||
    paymentDueDay > 28 ||
    !Number.isFinite(waterRatePerUnit) ||
    waterRatePerUnit < 0 ||
    !Number.isFinite(electricityRatePerUnit) ||
    electricityRatePerUnit < 0
  ) {
    return { status: "error", message: t.masterData.actions.errorRequired };
  }

  try {
    const organizationId = await resolveDefaultOrganizationId(
      session.user.organizationId,
    );
    await apiRequest("/dormitories", {
      method: "POST",
      body: {
        ...(organizationId ? { organizationId } : {}),
        code,
        name,
        billingDay: Math.floor(billingDay),
        paymentDueDay: Math.floor(paymentDueDay),
        waterRatePerUnit,
        electricityRatePerUnit,
        lateFeeType: "Fixed",
        lateFeeAmount: 0,
      },
    });
    revalidateAllMasterDataPages();
    return { status: "success", message: t.masterData.actions.successCreated };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function createMasterBuildingAction(
  _prevState: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  await verifySession();
  const dormitoryId = String(formData.get("dormitoryId") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const totalFloors = Math.floor(Number(formData.get("totalFloors") || 1));
  const autoCreateFloors = formData.get("autoCreateFloors") === "on";

  if (
    !/^[0-9a-f-]{36}$/iu.test(dormitoryId) ||
    !code ||
    !name ||
    !Number.isFinite(totalFloors) ||
    totalFloors < 1 ||
    totalFloors > 50
  ) {
    return { status: "error", message: t.masterData.actions.errorRequired };
  }

  try {
    const created = await apiRequest<{ id: string }>("/buildings", {
      method: "POST",
      body: {
        dormitoryId,
        code,
        name,
        totalFloors,
      },
    });

    if (autoCreateFloors && created?.id) {
      for (let floorNum = 1; floorNum <= totalFloors; floorNum += 1) {
        try {
          await apiRequest("/floors", {
            method: "POST",
            body: {
              buildingId: created.id,
              floorNumber: floorNum,
              name: `ຊັ້ນ ${floorNum}`,
            },
          });
        } catch {
          // Best-effort floor creation if some floor already exists.
        }
      }
    }

    revalidateAllMasterDataPages();
    return { status: "success", message: t.masterData.actions.successCreated };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function createMasterFloorAction(
  _prevState: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  await verifySession();
  const buildingId = String(formData.get("buildingId") ?? "").trim();
  const floorNumber = Math.floor(Number(formData.get("floorNumber")));
  const rawName = String(formData.get("name") ?? "").trim();

  if (
    !/^[0-9a-f-]{36}$/iu.test(buildingId) ||
    !Number.isFinite(floorNumber) ||
    floorNumber < 0 ||
    floorNumber > 100
  ) {
    return { status: "error", message: t.masterData.actions.errorRequired };
  }

  try {
    await apiRequest("/floors", {
      method: "POST",
      body: {
        buildingId,
        floorNumber,
        name: rawName || `ຊັ້ນ ${floorNumber}`,
      },
    });
    revalidateAllMasterDataPages();
    return { status: "success", message: t.masterData.actions.successCreated };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function bulkCreateMasterFloorsAction(
  _prevState: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  await verifySession();
  const buildingId = String(formData.get("buildingId") ?? "").trim();
  const fromFloor = Math.floor(Number(formData.get("fromFloor") || 1));
  const toFloor = Math.floor(Number(formData.get("toFloor") || 1));

  if (
    !/^[0-9a-f-]{36}$/iu.test(buildingId) ||
    !Number.isFinite(fromFloor) ||
    !Number.isFinite(toFloor) ||
    fromFloor < 1 ||
    toFloor < fromFloor ||
    toFloor - fromFloor > 30
  ) {
    return { status: "error", message: t.masterData.actions.errorRequired };
  }

  try {
    let createdCount = 0;
    for (let floorNum = fromFloor; floorNum <= toFloor; floorNum += 1) {
      try {
        await apiRequest("/floors", {
          method: "POST",
          body: {
            buildingId,
            floorNumber: floorNum,
            name: `ຊັ້ນ ${floorNum}`,
          },
        });
        createdCount += 1;
      } catch {
        // Ignore if a floor number already exists on that building.
      }
    }
    if (createdCount === 0) {
      return {
        status: "error",
        message: t.management.workflows.failure,
      };
    }
    revalidateAllMasterDataPages();
    return { status: "success", message: t.masterData.actions.successCreated };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function createMasterRoomTypeAction(
  _prevState: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  await verifySession();
  const dormitoryId = String(formData.get("dormitoryId") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const monthlyRent = Number(formData.get("monthlyRent"));
  const depositAmount = Number(formData.get("depositAmount") || 0);
  const maximumOccupants = Math.floor(
    Number(formData.get("maximumOccupants") || 2),
  );

  if (
    !/^[0-9a-f-]{36}$/iu.test(dormitoryId) ||
    !code ||
    !name ||
    !Number.isFinite(monthlyRent) ||
    monthlyRent < 0 ||
    !Number.isFinite(depositAmount) ||
    depositAmount < 0 ||
    !Number.isFinite(maximumOccupants) ||
    maximumOccupants < 1
  ) {
    return { status: "error", message: t.masterData.actions.errorRequired };
  }

  try {
    await apiRequest("/room-types", {
      method: "POST",
      body: {
        dormitoryId,
        code,
        name,
        monthlyRent,
        depositAmount,
        maximumOccupants,
      },
    });
    revalidateAllMasterDataPages();
    return { status: "success", message: t.masterData.actions.successCreated };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}

export async function deleteMasterRecordAction(
  _prevState: MasterDataActionState,
  formData: FormData,
): Promise<MasterDataActionState> {
  await verifySession();
  const resource = String(formData.get("resource") ?? "").trim();
  const recordId = String(formData.get("recordId") ?? "").trim();

  const endpointMap: Record<string, string> = {
    dormitories: "/dormitories",
    buildings: "/buildings",
    floors: "/floors",
    "room-types": "/room-types",
  };
  const endpoint = endpointMap[resource];
  if (!endpoint || !/^[0-9a-f-]{36}$/iu.test(recordId)) {
    return { status: "error", message: t.management.workflows.failure };
  }

  try {
    await apiRequest(`${endpoint}/${encodeURIComponent(recordId)}`, {
      method: "DELETE",
    });
    revalidateAllMasterDataPages();
    return { status: "success", message: t.masterData.actions.successDeleted };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}
