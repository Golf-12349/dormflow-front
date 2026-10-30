"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Droplets,
  Layers,
  LayoutGrid,
  Loader2,
  TableProperties,
  Zap,
} from "lucide-react";

import { updateUtilityRatesAction } from "@/lib/actions/billing";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { UtilityRatesFormState, Room, UtilityReading } from "@/types";
import { BatchMeterSheet } from "./batch-meter-sheet";
import { MeterEntry, type MeterRoom, type UtilityTypeTab } from "./meter-entry";

const INITIAL_RATES_STATE: UtilityRatesFormState = {
  status: "idle",
  message: null,
};

const INPUT_CLS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400";

interface BillingUtilitySectionProps {
  rates: { electricPerKwh: number; waterPerCubicMeter: number };
  rooms: MeterRoom[];
  period: string;
  periodLabel: string;
  canRecord: boolean;
}

export function BillingUtilitySection({
  rates,
  rooms,
  period,
  periodLabel,
  canRecord,
}: BillingUtilitySectionProps) {
  const [utilityTab, setUtilityTab] = useState<UtilityTypeTab>("electric");
  const [rateState, rateFormAction, isRatePending] = useActionState(
    updateUtilityRatesAction,
    INITIAL_RATES_STATE,
  );

  const showElectric = utilityTab === "electric" || utilityTab === "all";
  const showWater = utilityTab === "water" || utilityTab === "all";

  return (
    <div className="mt-6 space-y-6">
      <ActionResultToast state={rateState} />

      {/* Main Utility Tabs (EDL-DMS Reference Style) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setUtilityTab("electric")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm",
            utilityTab === "electric"
              ? "border border-amber-300 bg-amber-50/80 text-amber-900 shadow-xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <Zap
            className={cn(
              "size-4",
              utilityTab === "electric"
                ? "fill-amber-500 text-amber-600"
                : "text-slate-400",
            )}
          />
          <span>1. ໄຟຟ້າ (Electricity)</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              utilityTab === "electric"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {rooms.length} ຫ້ອງ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setUtilityTab("water")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm",
            utilityTab === "water"
              ? "border border-sky-300 bg-sky-50/80 text-sky-900 shadow-xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <Droplets
            className={cn(
              "size-4",
              utilityTab === "water"
                ? "fill-sky-500 text-sky-600"
                : "text-slate-400",
            )}
          />
          <span>2. ນ້ຳປະປາ (Water)</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              utilityTab === "water"
                ? "bg-sky-100 text-sky-800"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {rooms.length} ຫ້ອງ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setUtilityTab("all")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm",
            utilityTab === "all"
              ? "border border-indigo-300 bg-indigo-50/80 text-indigo-900 shadow-xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <Layers
            className={cn(
              "size-4",
              utilityTab === "all" ? "text-indigo-600" : "text-slate-400",
            )}
          />
          <span>3. ລວມທັງໝົດ (All in One)</span>
        </button>
      </div>

      {/* Utility Rate Settings Section — Adapts to the selected tab */}
      <section
        aria-labelledby="utility-rates-title"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-4">
          <h2
            id="utility-rates-title"
            className="text-base font-semibold text-slate-900"
          >
            {utilityTab === "electric"
              ? "ຕັ້ງຄ່າອັດຕາຄ່າໄຟຟ້າ"
              : utilityTab === "water"
                ? "ຕັ້ງຄ່າອັດຕາຄ່ານ້ຳປະປາ"
                : t.billing.rates.sectionTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {utilityTab === "electric"
              ? "ອັດຕາຄ່າໄຟໃໝ່ຈະຖືກນຳໃຊ້ໃນການຄຳນວນໃບບິນງວດນີ້ ແລະ ງວດຕໍ່ໄປ."
              : utilityTab === "water"
                ? "ອັດຕາຄ່ານ້ຳໃໝ່ຈະຖືກນຳໃຊ້ໃນການຄຳນວນໃບບິນງວດນີ້ ແລະ ງວດຕໍ່ໄປ."
                : t.billing.rates.sectionSubtitle}
          </p>
        </div>

        {rateState.status !== "idle" && rateState.message ? (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm",
              rateState.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
          >
            {rateState.status === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <p>{rateState.message}</p>
          </div>
        ) : null}

        <form action={rateFormAction} className="space-y-4">
          <div
            className={cn(
              "grid gap-4",
              utilityTab === "all" ? "sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {showElectric ? (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 transition-all">
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shadow-2xs">
                    <Zap className="size-4 fill-amber-500 text-amber-600" />
                  </div>
                  <label
                    htmlFor="rate-electric"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    {t.billing.rates.electricPerKwh} (kWh)
                  </label>
                </div>
                <input
                  id="rate-electric"
                  name="electricPerKwh"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  required
                  defaultValue={rates.electricPerKwh}
                  className={cn(
                    INPUT_CLS,
                    rateState.fieldErrors?.electricPerKwh &&
                      "border-rose-300 focus:border-rose-400",
                  )}
                />
                {rateState.fieldErrors?.electricPerKwh ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {rateState.fieldErrors.electricPerKwh}
                  </p>
                ) : null}
              </div>
            ) : (
              <input
                type="hidden"
                name="electricPerKwh"
                value={rates.electricPerKwh}
              />
            )}

            {showWater ? (
              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/30 p-4 transition-all">
                <div className="mb-2.5 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700 shadow-2xs">
                    <Droplets className="size-4 fill-sky-500 text-sky-600" />
                  </div>
                  <label
                    htmlFor="rate-water"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    {t.billing.rates.waterPerCubicMeter} (m³)
                  </label>
                </div>
                <input
                  id="rate-water"
                  name="waterPerCubicMeter"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  required
                  defaultValue={rates.waterPerCubicMeter}
                  className={cn(
                    INPUT_CLS,
                    rateState.fieldErrors?.waterPerCubicMeter &&
                      "border-rose-300 focus:border-rose-400",
                  )}
                />
                {rateState.fieldErrors?.waterPerCubicMeter ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {rateState.fieldErrors.waterPerCubicMeter}
                  </p>
                ) : null}
              </div>
            ) : (
              <input
                type="hidden"
                name="waterPerCubicMeter"
                value={rates.waterPerCubicMeter}
              />
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isRatePending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRatePending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>{t.billing.rates.saving}</span>
                </>
              ) : (
                <span>
                  {utilityTab === "electric"
                    ? "ບັນທຶກອັດຕາຄ່າໄຟ"
                    : utilityTab === "water"
                      ? "ບັນທຶກອັດຕາຄ່ານ້ຳ"
                      : t.billing.rates.save}
                </span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Meter Entry Component (Sheet / Cards) aligned with the active tab */}
      <MeterEntry
        rooms={rooms}
        period={period}
        periodLabel={periodLabel}
        canRecord={canRecord}
        rates={rates}
        activeTab={utilityTab}
        hideTabs={true}
      />
    </div>
  );
}

