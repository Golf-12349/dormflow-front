"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { verifySession } from "@/lib/session";

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface SeedResult {
  success: boolean;
  message: string;
  data?: {
    dormitoryId: string;
    buildingId: string;
    floorId: string;
    roomTypeId: string;
    roomId: string;
    tenantId: string;
    contractId: string;
    invoiceId?: string;
  };
}

export async function seedSomsakAction(): Promise<SeedResult> {
  await verifySession();

  try {
    // 1. Resolve Dormitory
    const dormRes = await apiRequest<PagedResult<{ id: string; name: string }>>("/dormitories", {
      query: { pageSize: 50 },
    });
    let dormitoryId = dormRes.items[0]?.id;

    if (!dormitoryId) {
      const newDorm = await apiRequest<{ id: string }>("/dormitories", {
        method: "POST",
        body: {
          name: "Test Dormitory",
          code: "DORM-01",
          address: "ນະຄອນຫຼວງວຽງຈັນ",
          phone: "020 5555 6666",
        },
      });
      dormitoryId = newDorm.id;
    }

    // 2. Resolve Building A (ອາຄານ A)
    const bldRes = await apiRequest<PagedResult<{ id: string; name: string; code: string; dormitoryId: string }>>(
      "/buildings",
      { query: { dormitoryId, pageSize: 50 } },
    );
    let building = bldRes.items.find(
      (b) => b.dormitoryId === dormitoryId && (b.name === "ອາຄານ A" || b.code === "A"),
    );

    if (!building) {
      building = await apiRequest<{ id: string; name: string; code: string; dormitoryId: string }>("/buildings", {
        method: "POST",
        body: {
          dormitoryId,
          code: "A",
          name: "ອາຄານ A",
          totalFloors: 3,
        },
      });
    }
    const buildingId = building.id;

    // 3. Resolve Floor 2 (ຊັ້ນ 2)
    const flrRes = await apiRequest<PagedResult<{ id: string; floorNumber: number; buildingId: string }>>(
      "/floors",
      { query: { buildingId, pageSize: 50 } },
    );
    let floor = flrRes.items.find(
      (f) => f.buildingId === buildingId && f.floorNumber === 2,
    );

    if (!floor) {
      floor = await apiRequest<{ id: string; floorNumber: number; buildingId: string }>("/floors", {
        method: "POST",
        body: {
          buildingId,
          floorNumber: 2,
          name: "ຊັ້ນ 2",
        },
      });
    }
    const floorId = floor.id;

    // 4. Resolve Room Type "Standard"
    const rtRes = await apiRequest<PagedResult<{ id: string; name: string; code: string; dormitoryId: string }>>(
      "/room-types",
      { query: { dormitoryId, pageSize: 50 } },
    );
    let roomType = rtRes.items.find(
      (rt) => rt.dormitoryId === dormitoryId && (rt.name.toLowerCase() === "standard" || rt.code === "STD"),
    );

    if (!roomType) {
      roomType = await apiRequest<{ id: string; name: string; code: string; dormitoryId: string }>("/room-types", {
        method: "POST",
        body: {
          dormitoryId,
          code: "STD",
          name: "Standard",
          monthlyRent: 1200000,
          depositAmount: 1200000,
          maximumOccupants: 2,
        },
      });
    }
    const roomTypeId = roomType.id;

    // 5. Resolve Room 201
    const rmRes = await apiRequest<PagedResult<{ id: string; roomNumber: string; buildingId: string }>>("/rooms", {
      query: { pageSize: 100 },
    });
    let room = rmRes.items.find(
      (r) => r.buildingId === buildingId && r.roomNumber === "201",
    );

    if (!room) {
      room = await apiRequest<{ id: string; roomNumber: string; buildingId: string }>("/rooms", {
        method: "POST",
        body: {
          buildingId,
          floorId,
          roomTypeId,
          roomNumber: "201",
          monthlyRent: 1200000,
          depositAmount: 1200000,
          maximumOccupants: 2,
          description: "ຫ້ອງພັກ Standard ພ້ອມເຟີນິເຈີ ແລະ ເຄື່ອງປັບອາກາດ",
        },
      });
    }
    const roomId = room.id;

    // 6. Resolve Tenant Somsak Vongvilay (ທ້າວ ສົມສັກ ວົງວິໄລ)
    const tntRes = await apiRequest<PagedResult<{ id: string; firstName: string; lastName: string; phone: string }>>(
      "/tenants",
      { query: { pageSize: 100 } },
    );
    let tenant = tntRes.items.find(
      (t) => (t.firstName === "ທ້າວ ສົມສັກ" && t.lastName === "ວົງວິໄລ") || t.phone === "020 5551 2345",
    );

    if (!tenant) {
      tenant = await apiRequest<{ id: string; firstName: string; lastName: string; phone: string }>("/tenants", {
        method: "POST",
        body: {
          firstName: "ທ້າວ ສົມສັກ",
          lastName: "ວົງວິໄລ",
          email: "somsak.vongvilay@dormflow.local",
          phone: "020 5551 2345",
          nationalId: "010203040506",
          address: "ນະຄອນຫຼວງວຽງຈັນ",
          emergencyContactName: "ນາງ ມະນີວອນ",
          emergencyContactPhone: "020 9998 7766",
        },
      });
    }
    const tenantId = tenant.id;

    // 7. Resolve Active Lease Contract
    const cntRes = await apiRequest<PagedResult<{ id: string; roomId: string; tenantId: string; status: string }>>(
      "/contracts",
      { query: { pageSize: 100 } },
    );
    let contract = cntRes.items.find(
      (c) => c.roomId === roomId && c.tenantId === tenantId,
    );

    if (!contract) {
      contract = await apiRequest<{ id: string; roomId: string; tenantId: string; status: string }>("/contracts", {
        method: "POST",
        body: {
          roomId,
          tenantId,
          startDate: "2026-11-01",
          endDate: "2027-04-30",
          monthlyRent: 1200000,
          depositAmount: 1200000,
          waterRatePerUnit: 5000,
          electricityRatePerUnit: 2500,
          notes: "ສັນຍາເຊົ່າ 6 ເດືອນ ຫ້ອງ 201 - ທ້າວ ສົມສັກ ວົງວິໄລ",
        },
      });

      try {
        await apiRequest(`/contracts/${contract.id}/activate`, { method: "POST" });
      } catch {
        // Already active or best-effort
      }
    }
    const contractId = contract.id;

    // 8. Record Initial and Monthly Meter Readings
    // October Initial Readings
    try {
      await apiRequest("/meter-readings", {
        method: "POST",
        body: {
          roomId,
          meterType: "Electricity",
          periodMonth: "2026-10-01",
          readingDate: "2026-10-31",
          currentReading: 1450,
        },
      });
    } catch {}

    try {
      await apiRequest("/meter-readings", {
        method: "POST",
        body: {
          roomId,
          meterType: "Water",
          periodMonth: "2026-10-01",
          readingDate: "2026-10-31",
          currentReading: 230,
        },
      });
    } catch {}

    // November Readings: Electricity 1620 (usage 170), Water 242 (usage 12)
    try {
      await apiRequest("/meter-readings", {
        method: "POST",
        body: {
          roomId,
          meterType: "Electricity",
          periodMonth: "2026-11-01",
          readingDate: "2026-11-30",
          currentReading: 1620,
        },
      });
    } catch {}

    try {
      await apiRequest("/meter-readings", {
        method: "POST",
        body: {
          roomId,
          meterType: "Water",
          periodMonth: "2026-11-01",
          readingDate: "2026-11-30",
          currentReading: 242,
        },
      });
    } catch {}

    // 9. Resolve Monthly Invoice for 2026-11
    let invoiceId: string | undefined;
    const invRes = await apiRequest<PagedResult<{ id: string; contractId: string; periodMonth: string; status: string }>>(
      "/invoices",
      { query: { pageSize: 100 } },
    );
    let invoice = invRes.items.find(
      (inv) => inv.contractId === contractId && inv.periodMonth.startsWith("2026-11"),
    );

    if (!invoice) {
      try {
        const createdInv = await apiRequest<{ id: string }>("/invoices", {
          method: "POST",
          body: {
            contractId,
            periodMonth: "2026-11-01",
            notes: "ໃບບິນຄ່າເຊົ່າ ແລະ ຄ່ານ້ຳ-ຄ່າໄຟ ປະຈຳເດືອນ 11/2026",
          },
        });
        invoiceId = createdInv.id;
        await apiRequest(`/invoices/${createdInv.id}/issue`, { method: "POST" });
      } catch (e) {
        console.warn("Invoice creation/issue notice:", e);
      }
    } else {
      invoiceId = invoice.id;
      if (invoice.status.toLowerCase() === "draft") {
        try {
          await apiRequest(`/invoices/${invoice.id}/issue`, { method: "POST" });
        } catch {}
      }
    }

    revalidatePath("/tenants");
    revalidatePath("/rooms");
    revalidatePath("/billing");
    revalidatePath("/dashboard");
    revalidatePath("/portal");

    return {
      success: true,
      message: "ບັນທຶກຂໍ້ມູນ ທ້າວ ສົມສັກ ວົງວິໄລ, ຫ້ອງ 201 ແລະ ໃບບິນ 1,685,000 LAK ສຳເລັດແລ້ວ!",
      data: {
        dormitoryId,
        buildingId,
        floorId,
        roomTypeId,
        roomId,
        tenantId,
        contractId,
        invoiceId,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ: ${errorMsg}`,
    };
  }
}
