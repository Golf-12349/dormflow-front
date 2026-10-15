"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { updateUtilityRatesAction } from "@/lib/actions/billing";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { UtilityRatesFormState } from "@/types";

const INITIAL_STATE: UtilityRatesFormState = {
  status: "idle",
  message: null,
};

const INPUT_CLS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400";

export function UtilityRateSettings({
  rates,
}: {
  rates: { electricPerKwh: number; waterPerCubicMeter: number };
}) {
  const [state, formAction, isPending] = useActionState(
    updateUtilityRatesAction,
    INITIAL_STATE,
  );

  return (
    <section
      aria-labelledby="utility-rates-title"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <ActionResultToast state={state} />
      <div className="mb-4">
        <h2
          id="utility-rates-title"
          className="text-base font-semibold text-slate-900"
        >
          {t.billing.rates.sectionTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t.billing.rates.sectionSubtitle}
        </p>
      </div>

      {state.status !== "idle" && state.message ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm",
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <p>{state.message}</p>
        </div>
      ) : null}

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <RateField
          name="electricPerKwh"
          label={t.billing.rates.electricPerKwh}
          unit="kWh"
          rate={rates.electricPerKwh}
          error={state.fieldErrors?.electricPerKwh}
        />
        <RateField
          name="waterPerCubicMeter"
          label={t.billing.rates.waterPerCubicMeter}
          unit="m³"
          rate={rates.waterPerCubicMeter}
          error={state.fieldErrors?.waterPerCubicMeter}
        />
        <div className="flex justify-end sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t.billing.rates.saving}
              </>
            ) : (
              t.billing.rates.save
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

function RateField({
  name,
  label,
  unit,
  rate,
  error,
}: {
  name: "electricPerKwh" | "waterPerCubicMeter";
  label: string;
  unit: string;
  rate: number;
  error?: string;
}) {
  const id = `utility-rate-${name}`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label} ({unit})
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        required
        defaultValue={rate}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(INPUT_CLS, error && "border-rose-300 focus:border-rose-400")}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
