"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronDown,
  ExternalLink,
  FileText,
  Megaphone,
  Printer,
  Receipt,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TenantManagementMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePrint = () => {
    setIsOpen(false);
    window.print();
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Trigger Button - Exactly matching Image 2 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-hidden",
          isOpen && "border-indigo-300 ring-2 ring-indigo-500/10",
        )}
      >
        <span>ຈັດການ</span>
        <ChevronDown
          className={cn(
            "size-4 text-slate-500 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen ? (
        <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            ຈັດການລະບົບຜູ້ເຊົ່າ & ສັນຍາ
          </div>

          <div className="space-y-1">
            {/* Lease Contracts */}
            <Link
              href="/management/residents/contracts"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition hover:bg-slate-50 group"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">ສັນຍາເຊົ່າທັງໝົດ</p>
                <p className="text-[11px] text-slate-500 truncate">
                  ກວດສອບ, ຕໍ່ສັນຍາ ຫຼື ສິ້ນສຸດສັນຍາ
                </p>
              </div>
            </Link>

            {/* Room Reservations */}
            <Link
              href="/management/residents/reservations"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition hover:bg-slate-50 group"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                <CalendarClock className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">ການຈອງຫ້ອງພັກ</p>
                <p className="text-[11px] text-slate-500 truncate">
                  ລາຍການຈອງຫ້ອງພັກລ່ວງໜ້າ
                </p>
              </div>
            </Link>

            {/* Master Data */}
            <Link
              href="/master-data/dormitories"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition hover:bg-slate-50 group"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
                <SlidersHorizontal className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">ຈັດການຂໍ້ມູນພື້ນຖານ</p>
                <p className="text-[11px] text-slate-500 truncate">
                  ໂຄງສ້າງຫໍພັກ, ອາຄານ, ຊັ້ນ & ປະເພດຫ້ອງ
                </p>
              </div>
            </Link>

            {/* Billing */}
            <Link
              href="/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition hover:bg-slate-50 group"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Receipt className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">ໃບບິນ & ການເກັບເງິນ</p>
                <p className="text-[11px] text-slate-500 truncate">
                  ອອກໃບບິນ ແລະ ຕິດຕາມຍອດຄ້າງ
                </p>
              </div>
            </Link>

            {/* Announcements */}
            <Link
              href="/management/services/announcements"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition hover:bg-slate-50 group"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white">
                <Megaphone className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">ປະກາດຫາຜູ້ເຊົ່າ</p>
                <p className="text-[11px] text-slate-500 truncate">
                  ສົ່ງຂ່າວສານ ແລະ ແຈ້ງເຕືອນ
                </p>
              </div>
            </Link>
          </div>

          <div className="my-1.5 border-t border-slate-100" />

          <div className="space-y-1">
            {/* Resident Portal */}
            <Link
              href="/portal"
              target="_blank"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition hover:bg-slate-50 text-slate-700"
            >
              <ExternalLink className="size-4 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">ມຸມມອງຜູ້ເຊົ່າ (Resident Portal)</p>
              </div>
            </Link>

            {/* Print Tenant List */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition hover:bg-slate-50 text-slate-700 text-left"
            >
              <Printer className="size-4 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">ພິມ / ສົ່ງອອກລາຍຊື່ຜູ້ເຊົ່າ (PDF)</p>
              </div>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
