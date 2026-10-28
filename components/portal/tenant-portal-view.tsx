"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Droplet,
  FileText,
  Home,
  Loader2,
  Package,
  QrCode,
  Sparkles,
  Upload,
  User,
  Wrench,
  Zap,
} from "lucide-react";

import {
  submitPortalMaintenanceAction,
  submitPortalPaymentAction,
  type PortalMaintenanceState,
  type PortalPaymentState,
} from "@/lib/actions/portal";
import { cn, formatCurrency } from "@/lib/utils";

interface TenantPortalViewProps {
  tenantName: string;
  roomNumber: string;
  buildingName: string;
  floor: number;
  roomId: string;
  tenantId?: string;
}

const INITIAL_MAINT_STATE: PortalMaintenanceState = {
  status: "idle",
  message: null,
};

const INITIAL_PAY_STATE: PortalPaymentState = {
  status: "idle",
  message: null,
};

export function TenantPortalView({
  tenantName = "ທ້າວ ສົມສັກ ວົງວິໄລ",
  roomNumber = "201",
  buildingName = "ອາຄານ A",
  floor = 2,
  roomId = "room-201-id",
  tenantId = "tenant-001",
}: TenantPortalViewProps) {
  // Modal states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Form action hooks
  const [maintState, maintAction, isMaintPending] = useActionState(
    submitPortalMaintenanceAction,
    INITIAL_MAINT_STATE,
  );

  const [payState, payAction, isPayPending] = useActionState(
    submitPortalPaymentAction,
    INITIAL_PAY_STATE,
  );

  // Simulated invoice state for Month 11/2026
  const [isPaidLocally, setIsPaidLocally] = useState(false);

  // Local simulated maintenance tickets list
  const [tickets, setTickets] = useState([
    {
      id: "TKT-101",
      title: "ແອບໍ່ເຢັນ ມີແຕ່ລົມຮ້ອນ",
      category: "AirConditioner",
      categoryName: "ເຄື່ອງປັບອາກາດ (ແອ)",
      priority: "High",
      status: "Reported",
      statusText: "ຮັບເລື່ອງແລ້ວ (ລໍຖ້າຊ່າງ)",
      createdAt: "01/11/2026 11:20",
      description: "ແອເປີດແລ້ວບໍ່ມີຄວາມເຢັນເລີຍ ມີແຕ່ລົມທຳມະດາອອກມາ ຊ່ວຍສົ່ງຊ່າງມາກວດນ້ຳຢາແອໃຫ້ແດ່ຄຮັບ",
    },
  ]);

  const copyAccountNumber = () => {
    navigator.clipboard.writeText("010120001234567001");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Navigation for Demo */}
      <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-xs">
              D
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900">DormHub Resident</h1>
              <p className="text-[10px] text-slate-500">ລະບົບຜູ້ເຊົ່າຫໍພັກອອນລາຍ</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-2xs hover:bg-slate-50"
          >
            <ArrowLeft className="size-3.5" />
            ກັບໜ້າ Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* Resident Profile Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-indigo-700 to-indigo-900 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur-xs">
                {roomNumber}
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-200">
                  {buildingName} • ຊັ້ນ {floor}
                </p>
                <h2 className="text-lg font-bold tracking-tight">{tenantName}</h2>
                <p className="text-xs text-indigo-200">020 5551 2345</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
              ພັກເຊົາປົກກະຕິ
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
            <div>
              <span className="text-indigo-300">ໄລຍະສັນຍາ:</span>
              <p className="font-semibold text-white">01/11/2026 - 30/04/2027</p>
            </div>
            <div>
              <span className="text-indigo-300">ເງິນມັດຈຳປະກັນ:</span>
              <p className="font-semibold text-white">1,200,000 LAK</p>
            </div>
          </div>
        </div>

        {/* Action Highlights: Quick Pay & Quick Maintenance */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsPayModalOpen(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs transition hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <QrCode className="size-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">ຈ່າຍຄ່າເຊົ່າ (QR Code)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMaintModalOpen(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-white p-4 shadow-xs transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Wrench className="size-6" />
            </div>
            <span className="text-xs font-bold text-slate-800">ແຈ້ງສ້ອມແປງດ່ວນ</span>
          </button>
        </div>

        {/* Current Month Invoice Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ໃບບິນຮອບປັດຈຸບັນ
              </span>
              <h3 className="text-base font-bold text-slate-900">ເດືອນ 11/2026 (Nov 2026)</h3>
            </div>
            {isPaidLocally || payState.status === "success" ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                ✓ ຊຳລະແລ້ວ (PAID)
              </span>
            ) : (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-600/20">
                ລໍຖ້າຊຳລະ (UNPAID)
              </span>
            )}
          </div>

          {/* Breakdown list */}
          <div className="mt-4 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Home className="size-3.5 text-slate-400" />
                ຄ່າເຊົ່າຫ້ອງ 201 (ເດືອນ 11/2026)
              </span>
              <span className="font-semibold text-slate-900">1,200,000 LAK</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="size-3.5 text-amber-500" />
                ຄ່າໄຟຟ້າ (170 ໜ່ວຍ x 2,500 LAK)
              </span>
              <span className="font-semibold text-slate-900">425,000 LAK</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Droplet className="size-3.5 text-sky-500" />
                ຄ່ານ້ຳປະປາ (12 m³ x 5,000 LAK)
              </span>
              <span className="font-semibold text-slate-900">60,000 LAK</span>
            </div>
          </div>

          {/* Total & Due date */}
          <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <div>
              <p className="text-[11px] text-slate-400">ກຳນົດຊຳລະ: 05/12/2026</p>
              <p className="text-xs font-semibold text-slate-700">ຍອດລວມທີ່ຕ້ອງຈ່າຍ</p>
            </div>
            <p className="text-xl font-black text-indigo-700">
              {formatCurrency(1685000)}
            </p>
          </div>

          {/* Pay Button */}
          {!isPaidLocally && payState.status !== "success" ? (
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-indigo-500"
            >
              <CreditCard className="size-4" />
              ຊຳລະເງິນຜ່ານ BCEL One QR Code (1,685,000 LAK)
            </button>
          ) : (
            <div className="mt-4 rounded-xl bg-emerald-50 p-2.5 text-center text-xs font-semibold text-emerald-700">
              ✓ ທ່ານໄດ້ຊຳລະຄ່າເຊົ່າຮອບນີ້ຮຽບຮ້ອຍແລ້ວ!
            </div>
          )}
        </section>

        {/* Utility Meter Summary Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">ລາຍລະອຽດມິເຕີເດືອນນີ້ (30/11/2026)</h3>
          <p className="text-xs text-slate-500">ຄິດໄລ່ຈາກເລກຈົດຕົວຈິງ</p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {/* Electric */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Zap className="size-4 text-amber-600" />
                ມິເຕີໄຟຟ້າ
              </div>
              <p className="mt-2 font-mono text-xs text-slate-500">
                1,450 ➔ <span className="font-bold text-slate-800">1,620</span>
              </p>
              <p className="mt-1 text-sm font-extrabold text-amber-700">+170 kWh</p>
              <p className="text-[10px] text-slate-400 mt-0.5">ອັດຕາ: 2,500 LAK/kWh</p>
            </div>

            {/* Water */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                <Droplet className="size-4 text-sky-600" />
                ມິເຕີນ້ຳປະປາ
              </div>
              <p className="mt-2 font-mono text-xs text-slate-500">
                230 ➔ <span className="font-bold text-slate-800">242</span>
              </p>
              <p className="mt-1 text-sm font-extrabold text-sky-700">+12 m³</p>
              <p className="text-[10px] text-slate-400 mt-0.5">ອັດຕາ: 5,000 LAK/m³</p>
            </div>
          </div>
        </section>

        {/* Maintenance Request Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ລາຍການແຈ້ງສ້ອມແປງ</h3>
              <p className="text-xs text-slate-500">ຕິດຕາມສະຖານະການແກ້ໄຂບັນຫາ</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMaintModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600"
            >
              <Wrench className="size-3.5" />
              + ແຈ້ງສ້ອມ
            </button>
          </div>

          {/* Maintenance list */}
          <div className="mt-3 space-y-2.5">
            {tickets.map((tkt) => (
              <div
                key={tkt.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-900">{tkt.title}</div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {tkt.statusText}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 line-clamp-2">{tkt.description}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>ໝວດ: {tkt.categoryName}</span>
                  <span>ວັນທີ: {tkt.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Parcels Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">ພັສດຸຂອງຂ້ອຍ</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              1 ລາຍການ
            </span>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-bold text-indigo-700">
                <Package className="size-3.5" />
                Flash Express
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                ລໍຖ້າຮັບທີ່ເຄົາເຕີ
              </span>
            </div>
            <p className="mt-1 font-mono text-xs font-bold text-slate-800">
              TH019283748281
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">ວັນທີມາຮອດ: 01/11/2026</p>
          </div>
        </section>
      </main>

      {/* MODAL 1: Payment with BCEL One QR Code */}
      {isPayModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsPayModalOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                BCEL OnePay QR Code
              </span>
              <h3 className="mt-2 text-base font-bold text-slate-900">
                ຊຳລະຄ່າເຊົ່າ & ນ້ຳ-ໄຟ ເດືອນ 11/2026
              </h3>
              <p className="text-2xl font-black text-indigo-700 mt-1">1,685,000 LAK</p>
            </div>

            {/* QR Code Graphic Box */}
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4">
              <div className="relative size-44 rounded-xl bg-white p-2 shadow-xs flex items-center justify-center">
                {/* SVG Mock QR Code */}
                <div className="size-full bg-slate-900 flex flex-col items-center justify-center p-2 rounded-lg text-white">
                  <QrCode className="size-24 text-white" />
                  <span className="text-[10px] font-black tracking-widest text-rose-400 mt-1">
                    BCEL OnePay
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-600">
                ສະແກນ QR ຜ່ານແອັບ BCEL One ເພື່ອໂອນເງິນ
              </p>
            </div>

            {/* Account Details with Copy Button */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
              <div>
                <p className="text-[10px] text-slate-400">ເລກບັນຊີ BCEL</p>
                <p className="font-mono font-bold text-slate-800">010-12-00-01234567-001</p>
                <p className="text-[10px] text-slate-500">DormHub Residence</p>
              </div>
              <button
                type="button"
                onClick={copyAccountNumber}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Copy className="size-3" />
                {copiedAccount ? "ຄັດລອກແລ້ວ" : "ຄັດລອກ"}
              </button>
            </div>

            {/* Mock Payment Submission */}
            <form
              action={payAction}
              onSubmit={() => {
                setIsPaidLocally(true);
                setTimeout(() => setIsPayModalOpen(false), 800);
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="invoiceId" value="INV-202611-R201" />
              <input type="hidden" name="amount" value="1685000" />
              <input type="hidden" name="referenceNumber" value="TXN-20261130-998811" />

              <div>
                <label className="block text-[11px] font-semibold text-slate-600">
                  ແນບຮູບສະລິບໂອນເງິນ (Transfer Slip)
                </label>
                <div className="mt-1 flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-3 text-center text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">
                  <Upload className="size-4 mr-1 text-slate-400" />
                  <span>ເລືອກຮູບສະລິບຈາກເຄື່ອງ...</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700"
                >
                  ປິດອອກ
                </button>
                <button
                  type="submit"
                  disabled={isPayPending}
                  className="w-1/2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500"
                >
                  {isPayPending ? "ກຳລັງຢືນຢັນ..." : "ຢືນຢັນການໂອນເງິນ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL 2: Report Maintenance (ແຈ້ງສ້ອມແປງແອ) */}
      {isMaintModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMaintModalOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Wrench className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ແຈ້ງສ້ອມແປງ (ຫ້ອງ 201)</h3>
                <p className="text-[10px] text-slate-500">ສົ່ງເລື່ອງຫາເຈົ້າຂອງຫໍພັກ ແລະ ທີມຊ່າງ</p>
              </div>
            </div>

            {maintState.status === "success" ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>{maintState.message}</span>
              </div>
            ) : null}

            <form
              action={maintAction}
              onSubmit={(e) => {
                const formData = new FormData(e.currentTarget);
                const titleVal = String(formData.get("title") || "ແອບໍ່ເຢັນ");
                const descVal = String(formData.get("description") || "");
                setTickets((prev) => [
                  {
                    id: `TKT-${Date.now().toString().slice(-4)}`,
                    title: titleVal,
                    category: "AirConditioner",
                    categoryName: "ເຄື່ອງປັບອາກາດ (ແອ)",
                    priority: "High",
                    status: "Reported",
                    statusText: "ຮັບເລື່ອງແລ້ວ (ລໍຖ້າຊ່າງ)",
                    createdAt: "30/11/2026 14:00",
                    description: descVal,
                  },
                  ...prev,
                ]);
                setTimeout(() => setIsMaintModalOpen(false), 900);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <input type="hidden" name="roomId" value={roomId} />
              <input type="hidden" name="tenantId" value={tenantId} />

              <div>
                <label className="block font-semibold text-slate-700">ໝວດໝູ່ງານສ້ອມ *</label>
                <select
                  name="category"
                  defaultValue="AirConditioner"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                >
                  <option value="AirConditioner">ເຄື່ອງປັບອາກາດ (ແອ)</option>
                  <option value="Electricity">ລະບົບໄຟຟ້າ / ດອກໄຟ</option>
                  <option value="Plumbing">ລະບົບນ້ຳປະປາ / ທໍ່ນ້ຳ</option>
                  <option value="Furniture">ເຟີນີເຈີ / ປະຕູ-ປ່ອງຢ້ຽມ</option>
                  <option value="Other">ອື່ນໆ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">ຫົວຂໍ້ບັນຫາ *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue="ແອບໍ່ເຢັນ, ມີແຕ່ລົມຮ້ອນອອກມາ"
                  placeholder="ລະບຸຫົວຂໍ້ສັ້ນໆ"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">ລາຍລະອຽດເພີ່ມເຕີມ</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue="ແອເປີດແລ້ວບໍ່ມີຄວາມເຢັນເລີຍ ມີແຕ່ລົມທຳມະດາອອກມາ ຊ່ວຍສົ່ງຊ່າງມາກວດນ້ຳຢາແອ ແລະ ລ້າງແອໃຫ້ແດ່ຄຮັບ"
                  placeholder="ອະທິບາຍອາການ ແລະ ຊ່ວງເວລາທີ່ສະດວກໃຫ້ຊ່າງເຂົ້າກວດ"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">ລະດັບຄວາມດ່ວນ</label>
                <select
                  name="priority"
                  defaultValue="High"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                >
                  <option value="Urgent">ດ່ວນທີ່ສຸດ (Urgent)</option>
                  <option value="High">ສູງ (High)</option>
                  <option value="Medium">ປານກາງ (Medium)</option>
                  <option value="Low">ຕ່ຳ (Low)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMaintModalOpen(false)}
                  className="w-1/2 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-700"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isMaintPending}
                  className="w-1/2 rounded-xl bg-amber-500 py-2.5 font-bold text-white shadow-xs hover:bg-amber-600 disabled:opacity-50"
                >
                  {isMaintPending ? "ກຳລັງສົ່ງ..." : "ສົ່ງຄຳຮ້ອງແຈ້ງສ້ອມ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
