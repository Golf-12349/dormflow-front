"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Home,
  Layers,
  LucideIcon,
  Sparkles,
  Warehouse,
  Zap,
  DoorOpen,
  BedDouble,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface SetupChecklistProps {
  dormitoriesCount: number;
  buildingsCount: number;
  floorsCount: number;
  roomTypesCount: number;
  roomsCount: number;
  hasUtilityRates: boolean;
}

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  href: string;
  icon: LucideIcon;
}

export function SetupChecklist({
  dormitoriesCount,
  buildingsCount,
  floorsCount,
  roomTypesCount,
  roomsCount,
  hasUtilityRates,
}: SetupChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const steps: ChecklistStep[] = [
    {
      id: "dormitory",
      title: "1. ຂໍ້ມູນຫໍພັກ",
      description: "ສ້າງ ແລະ ກຳນົດຂໍ້ມູນຫໍພັກຫຼັກ",
      isComplete: dormitoriesCount > 0,
      href: "/management/properties/dormitories",
      icon: Home,
    },
    {
      id: "building",
      title: "2. ອາຄານ",
      description: "ສ້າງອາຄານພາຍໃນຫໍພັກ",
      isComplete: buildingsCount > 0,
      href: "/management/properties/buildings",
      icon: Warehouse,
    },
    {
      id: "floor",
      title: "3. ຊັ້ນ",
      description: "ສ້າງຊັ້ນພາຍໃນແຕ່ລະອາຄານ",
      isComplete: floorsCount > 0,
      href: "/management/properties/floors",
      icon: Layers,
    },
    {
      id: "roomType",
      title: "4. ປະເພດຫ້ອງ",
      description: "ກຳນົດປະເພດຫ້ອງ ແລະ ຄ່າເຊົ່າ",
      isComplete: roomTypesCount > 0,
      href: "/management/properties/room-types",
      icon: BedDouble,
    },
    {
      id: "room",
      title: "5. ເພີ່ມຫ້ອງພັກ",
      description: "ສ້າງຫ້ອງພັກຕາມຊັ້ນ ແລະ ອາຄານ",
      isComplete: roomsCount > 0,
      href: "/rooms",
      icon: DoorOpen,
    },
    {
      id: "utilityRates",
      title: "6. ຄ່ານ້ຳ-ຄ່າໄຟ",
      description: "ກຳນົດອັດຕາຄ່ານ້ຳ ແລະ ຄ່າໄຟຟ້າ",
      isComplete: hasUtilityRates,
      href: "/billing",
      icon: Zap,
    },
  ];

  const completedCount = steps.filter((step) => step.isComplete).length;
  const isAllComplete = completedCount === steps.length;
  const percent = Math.round((completedCount / steps.length) * 100);

  if (isDismissed || isAllComplete) {
    return null;
  }

  return (
    <section
      aria-label="ຂັ້ນຕອນການຕັ້ງຄ່າຫໍພັກ"
      className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                ຂັ້ນຕອນການຕັ້ງຄ່າຫໍພັກ (Setup Checklist)
              </h2>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {completedCount}/{steps.length} ຂັ້ນຕອນ
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              ກະລຸນາຕັ້ງຄ່າຂໍ້ມູນໂຄງສ້າງພື້ນຖານໃຫ້ຄົບຖ້ວນ ເພື່ອໃຫ້ລະບົບຈັດການຫໍພັກເຮັດວຽກໄດ້ຢ່າງເຕັມປະສິດທິພາບ.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="ປິດຄຳແນະນຳ"
          className="self-end rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:self-start"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>ຄວາມຄືບໜ້າການຕັ້ງຄ່າ</span>
          <span className="font-semibold text-indigo-600">{percent}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Steps grid */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl border p-3.5 transition",
                step.isComplete
                  ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50/80"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm",
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  step.isComplete
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600",
                )}
              >
                <StepIcon className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                    {step.title}
                  </p>
                  {step.isComplete ? (
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <p className="truncate text-[11px] text-slate-500">
                  {step.description}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
