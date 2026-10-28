import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { getSession } from "@/lib/session";
import { resolveDefaultOrganizationId } from "@/lib/api/dormflow";

interface ApiRoom {
  id: string;
  roomNumber: string;
  buildingId: string;
  dormitoryId: string;
  monthlyRent: number;
  depositAmount?: number;
  organizationId?: string;
}

interface ApiTenant {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

interface ApiContract {
  id: string;
  contractNumber: string;
  status: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "ທ່ານຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນ (Unauthorized)" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const roomId = String(body.roomId ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const startDate = String(body.startDate ?? "").trim() || new Date().toISOString().slice(0, 10);

    let defaultEndDate = new Date();
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 6);
    const endDate = String(body.endDate ?? "").trim() || defaultEndDate.toISOString().slice(0, 10);

    const monthlyRent = Number(body.monthlyRent || 0);
    const depositAmount = Number(body.depositAmount ?? monthlyRent);

    if (!roomId) {
      return NextResponse.json({ success: false, message: "ກະລຸນາລະບຸຫ້ອງພັກ (Room ID required)" }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ success: false, message: "ກະລຸນາລະບຸຊື່ ແລະ ນາມສະກຸນ" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ success: false, message: "ກະລຸນາລະບຸເບີໂທຕິດຕໍ່ (WhatsApp)" }, { status: 400 });
    }
    if (monthlyRent <= 0) {
      return NextResponse.json({ success: false, message: "ຄ່າເຊົ່າຕ້ອງຫຼາຍກວ່າ 0 LAK" }, { status: 400 });
    }
    if (depositAmount < 0) {
      return NextResponse.json({ success: false, message: "ຄ່າມັດຈຳຕ້ອງບໍ່ຕິດລົບ" }, { status: 400 });
    }

    // 1. Fetch Room Details
    const room = await apiRequest<ApiRoom>(`/rooms/${encodeURIComponent(roomId)}`);
    if (!room) {
      return NextResponse.json({ success: false, message: "ບໍ່ພົບຂໍ້ມູນຫ້ອງພັກໃນຖານຂໍ້ມູນ" }, { status: 404 });
    }

    // 2. Parse Name
    const nameParts = fullName.split(/\s+/u);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || "-";

    const resolvedOrgId = await resolveDefaultOrganizationId(room.organizationId, roomId);

    // 3. Create Tenant in DB
    const tenantPayload: Record<string, unknown> = {
      firstName,
      lastName,
      phone,
      email: `${phone.replace(/\D/gu, "") || Date.now()}@dormflow.local`,
      nationalId: body.nationalId ? String(body.nationalId).trim() : "000000000",
      emergencyContactName: "ບໍ່ໄດ້ລະບຸ",
      emergencyContactPhone: phone,
    };
    if (resolvedOrgId) {
      tenantPayload.organizationId = resolvedOrgId;
    }

    const tenant = await apiRequest<ApiTenant>("/tenants", {
      method: "POST",
      body: tenantPayload,
    });

    // 4. Create Contract in DB
    const contract = await apiRequest<ApiContract>("/contracts", {
      method: "POST",
      body: {
        roomId,
        tenantId: tenant.id,
        startDate,
        endDate,
        monthlyRent,
        depositAmount,
        waterRatePerUnit: 5000,
        electricityRatePerUnit: 2500,
        notes: `ສັນຍາເຊົ່າດ່ວນ ຫ້ອງ ${room.roomNumber} - ${fullName}`,
      },
    });

    // 5. Activate Contract (sets room status to Occupied in DB!)
    try {
      await apiRequest(`/contracts/${contract.id}/activate`, { method: "POST" });
    } catch (e) {
      console.warn("Contract activation notice:", e);
    }

    revalidatePath("/rooms");
    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    revalidatePath("/billing");
    revalidatePath("/management");

    return NextResponse.json({
      success: true,
      message: `ເອົາຜູ້ເຊົ່າ ${fullName} ເຂົ້າພັກຫ້ອງ ${room.roomNumber} ສຳເລັດແລ້ວ!`,
      data: {
        room: {
          id: room.id,
          number: room.roomNumber,
          status: "occupied",
          tenantId: tenant.id,
          tenantName: `${tenant.firstName} ${tenant.lastName}`.trim(),
        },
        tenant,
        contract,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: `ເກີດຂໍ້ຜິດພາດ: ${errorMsg}` },
      { status: 500 },
    );
  }
}
