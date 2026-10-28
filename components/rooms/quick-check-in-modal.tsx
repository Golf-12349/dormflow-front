"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Loader2,
  Phone,
  User,
  UserPlus,
  X,
} from "lucide-react";
import type { RoomItem } from "@/app/(app)/rooms/room-inventory-view";
import { formatCurrency } from "@/lib/utils";

interface QuickCheckInModalProps {
  room: RoomItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRoom: RoomItem, tenantName: string) => void;
}

export function QuickCheckInModal({
  room,
  isOpen,
  onClose,
  onSuccess,
}: QuickCheckInModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const defaultEndDate = sixMonthsLater.toISOString().slice(0, 10);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [monthlyRent, setMonthlyRent] = useState(room?.monthlyRate ?? 1200000);
  const [depositAmount, setDepositAmount] = useState(
    room?.depositAmount && room.depositAmount > 0
      ? room.depositAmount
      : room?.monthlyRate ?? 1200000,
  );

  if (!isOpen || !room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("ກະລຸນາລະບຸຊື່ ແລະ ນາມສະກຸນ");
      return;
    }
    if (!phone.trim()) {
      setError("ກະລຸນາລະບຸເບີໂທຕິດຕໍ່ (WhatsApp)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/quick-check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          startDate,
          endDate,
          monthlyRent: Number(monthlyRent),
          depositAmount: Number(depositAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ");
      }

      // Optimistic update
      const updated: RoomItem = {
        ...room,
        status: "occupied",
        tenantName: fullName.trim(),
        tenantId: data.data?.tenant?.id ?? null,
      };

      onSuccess(updated, fullName.trim());
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ບັນທຶກບໍ່ສຳເລັດ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <UserPlus className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  ເອົາຜູ້ເຊົ່າເຂົ້າພັກ (Quick Check-in)
                </h3>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  ຫ້ອງ {room.number}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {room.roomTypeName || "Standard"} · ອາຄານ A
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <User className="size-3.5 text-slate-400" />
              <span>ຊື່ ແລະ ນາມສະກຸນ *</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ຕົວຢ່າງ: ທ້າວ ຄຳດີ ໄຊຍະວົງ"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Phone className="size-3.5 text-slate-400" />
              <span>ເບີໂທຕິດຕໍ່ (WhatsApp) *</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="020 5555 8899"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Calendar className="size-3.5 text-slate-400" />
                <span>ວັນທີເລີ່ມສັນຍາ *</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Calendar className="size-3.5 text-slate-400" />
                <span>ວັນທີສິ້ນສຸດ *</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Rent & Deposit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <DollarSign className="size-3.5 text-slate-400" />
                <span>ຄ່າເຊົ່າຫ້ອງ (LAK/ເດືອນ) *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="10000"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs outline-none transition focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <DollarSign className="size-3.5 text-slate-400" />
                <span>ເງິນມັດຈຳ (LAK) *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="10000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-xs outline-none transition focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Summary notice */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>Real Database Synchronization</span>
            </p>
            <p className="mt-0.5 text-emerald-700">
              ເມື່ອກົດບັນທຶກ ລະບົບຈະສ້າງ Tenant + ສັນຍາເຊົ່າ ແລະ ປ່ຽນສະຖານະຫ້ອງ {room.number} ເປັນ <b>"ມີຜູ້ເຊົ່າ (ສີແດງ)"</b> ໃນ Database ທັນທີ.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>ກຳລັງບັນທຶກລົງ Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>ບັນທຶກ ແລະ ເປີດສັນຍາເຊົ່າ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
