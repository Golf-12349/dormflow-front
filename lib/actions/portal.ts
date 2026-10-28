"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api/client";
import { recordInvoicePayment } from "@/lib/api/dormflow";

export interface PortalMaintenanceState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export interface PortalPaymentState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export async function submitPortalMaintenanceAction(
  _prev: PortalMaintenanceState,
  formData: FormData,
): Promise<PortalMaintenanceState> {
  const roomId = String(formData.get("roomId") ?? "").trim();
  const tenantId = String(formData.get("tenantId") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "AirConditioner").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "High").trim();

  if (!title) {
    return { status: "error", message: "ກະລຸນາລະບຸຫົວຂໍ້ການແຈ້ງສ້ອມ" };
  }

  try {
    await apiRequest("/maintenance-requests", {
      method: "POST",
      body: {
        roomId: roomId || undefined,
        tenantId: tenantId || undefined,
        category,
        title,
        description,
        priority,
      },
    });

    revalidatePath("/portal");
    revalidatePath("/management/services/maintenance-requests");
    revalidatePath("/rooms");

    return {
      status: "success",
      message: "ສົ່ງຄຳຮ້ອງແຈ້ງສ້ອມແປງຮຽບຮ້ອຍແລ້ວ! ທີມງານຊ່າງຈະຕິດຕໍ່ຫາໂດຍໄວ.",
    };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "ບໍ່ສາມາດສົ່ງແຈ້ງສ້ອມໄດ້";
    return { status: "error", message: errMessage };
  }
}

export async function submitPortalPaymentAction(
  _prev: PortalPaymentState,
  formData: FormData,
): Promise<PortalPaymentState> {
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "").trim();
  const referenceNumber = String(formData.get("referenceNumber") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "QrCode");

  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: "error", message: "ຈຳນວນເງິນບໍ່ຖືກຕ້ອງ" };
  }

  try {
    const res = await recordInvoicePayment(
      invoiceId,
      amount,
      paymentMethod === "BankTransfer" ? "BankTransfer" : "QrCode",
      referenceNumber || "BCEL-ONEPAY",
    );

    if (!res.success) {
      return { status: "error", message: res.error };
    }

    revalidatePath("/portal");
    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "ແຈ້ງຊຳລະເງິນສຳເລັດ! ລະບົບໄດ້ບັນທຶກການຊຳລະ ແລະ ອອກໃບຮັບເງິນແລ້ວ.",
    };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ";
    return { status: "error", message: errMessage };
  }
}

