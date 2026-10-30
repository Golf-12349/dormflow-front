"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";
import { updateTenantAction } from "@/lib/actions/tenants";
import type { EditContactFormState, Tenant } from "@/types";
import { cn } from "@/lib/utils";

interface EditTenantModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INITIAL_STATE: EditContactFormState = {
  status: "idle",
  message: null,
};

export function EditTenantModal({
  tenant,
  isOpen,
  onClose,
  onSuccess,
}: EditTenantModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [state, formAction, isPending] = useActionState(
    updateTenantAction,
    INITIAL_STATE,
  );

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle successful update
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      const timer = setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [state.status, router, onClose, onSuccess]);

  if (!isOpen || !tenant) return null;

  const nameParts = tenant.fullName.trim().split(/\s+/);
  const defaultFirstName = nameParts[0] ?? "";
  const defaultLastName = nameParts.slice(1).join(" ") || "-";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-tenant-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      {/* Centered Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Popup Dialog Box */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <Pencil className="size-5" />
            </span>
            <div>
              <h2
                id="edit-tenant-modal-title"
                className="text-base font-bold text-slate-900"
              >
                ແກ້ໄຂຂໍ້ມູນຜູ້ເຊົ່າ
              </h2>
              <p className="text-xs text-slate-500">
                ອັບເດດຂໍ້ມູນສ່ວນຕົວ ແລະ ຊ່ອງທາງຕິດຕໍ່ຂອງຜູ້ເຊົ່າ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form action={formAction} className="flex-1 overflow-y-auto p-6 space-y-4">
          <input type="hidden" name="tenantId" value={tenant.id} />

          {/* Alert / Status Message */}
          {state.status !== "idle" && state.message ? (
            <div
              role="status"
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs font-medium",
                state.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              {state.status === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
              )}
              <p>{state.message}</p>
            </div>
          ) : null}

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ຊື່ (First Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="text"
                  name="firstName"
                  defaultValue={defaultFirstName}
                  placeholder="ປ້ອນຊື່"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9.5 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ນາມສະກຸນ (Last Name) <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                name="lastName"
                defaultValue={defaultLastName}
                placeholder="ປ້ອນນາມສະກຸນ"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ເບີໂທລະສັບ (Phone) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="tel"
                  name="phone"
                  defaultValue={tenant.phone}
                  placeholder="020 xxxx xxxx"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9.5 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ອີເມວ (Email)
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  defaultValue={tenant.email}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9.5 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </div>

          {/* ID Card and DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ເລກບັດປະຈຳຕົວ / ສຳມະໂນຄົວ
              </label>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="idCard"
                  defaultValue={tenant.idCard}
                  placeholder="ເລກບັດປະຈຳຕົວ"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9.5 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ວັນເດືອນປີເກີດ (DOB)
              </label>
              <input
                type="date"
                name="dateOfBirth"
                defaultValue={tenant.dateOfBirth?.slice(0, 10) ?? ""}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ທີ່ຢູ່ຕາມທະບຽນບ້ານ
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-3 left-3 size-4 text-slate-400" />
              <textarea
                name="address"
                rows={2}
                defaultValue={tenant.address ?? ""}
                placeholder="ບ້ານ, ເມືອງ, ແຂວງ"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9.5 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ຜູ້ຕິດຕໍ່ສຸກເສີນ (Emergency Contact)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  ຊື່ຜູ້ຕິດຕໍ່ສຸກເສີນ
                </label>
                <input
                  type="text"
                  name="emergencyName"
                  defaultValue={tenant.emergencyContact?.name ?? ""}
                  placeholder="ຊື່ ແລະ ສາຍພົວພັນ"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 shadow-2xs outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  ເບີໂທສຸກເສີນ
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  defaultValue={tenant.emergencyContact?.phone ?? ""}
                  placeholder="020 xxxx xxxx"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 shadow-2xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>ກຳລັງບັນທຶກ...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>ບັນທຶກການແກ້ໄຂ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

