"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, LayoutGrid, Loader2, TableProperties } from "lucide-react";

import { saveMeterReadingAction } from "@/lib/actions/billing";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import { t } from "@/lib/i18n";
import { cn, formatUnitPrice } from "@/lib/utils";
import type { MeterReadingFormState, Room, UtilityReading } from "@/types";
import { BatchMeterSheet } from "./batch-meter-sheet";

export type MeterRoomKind =
  | { kind: "recorded"; reading: UtilityReading }
  | { kind: "blocked" }
  | {
      kind: "editable";
      previous: { electric: number; water: number } | null;
    };

export interface MeterRoom {
  room: Room;
  kind: MeterRoomKind;
}

interface MeterEntryProps {
  rooms: MeterRoom[];
  period: string;
  periodLabel: string;
  canRecord: boolean;
  rates: { electricPerKwh: number; waterPerCubicMeter: number };
}

type Rates = MeterEntryProps["rates"];
type Previous = { electric: number; water: number } | null;

const INITIAL_STATE: MeterReadingFormState = {
  status: "idle",
  message: null,
};

const INPUT_CLS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none focus:border-indigo-400";

/** Empty string is "not typed yet"; only finite numbers >= 0 are valid. */
function parseInput(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function MeterEntry({
  rooms,
  period,
  periodLabel,
  canRecord,
  rates,
}: MeterEntryProps) {
  const [viewMode, setViewMode] = useState<"sheet" | "cards">("sheet");
  const done = rooms.filter((entry) => entry.kind.kind === "recorded").length;

  return (
    <section aria-labelledby="meter-entry-title" className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="meter-entry-title"
            className="text-base font-semibold text-slate-900"
          >
            {t.billing.meter.sectionTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t.billing.meter.sectionSubtitle(periodLabel)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-500">
            {t.billing.meter.progress(done, rooms.length)}
          </p>

          <div
            role="group"
            className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1"
          >
            <button
              type="button"
              onClick={() => setViewMode("sheet")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
                viewMode === "sheet"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              <TableProperties className="size-3.5" />
              ຕາຕະລາງລວມ (Sheet)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              <LayoutGrid className="size-3.5" />
              ແຍກຕາມຫ້ອງ (Cards)
            </button>
          </div>
        </div>
      </div>
      {rooms.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          {t.billing.meter.empty}
        </p>
      ) : !canRecord ? (
        <p
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm"
        >
          {t.billing.meter.errors.futurePeriod}
        </p>
      ) : viewMode === "sheet" ? (
        <BatchMeterSheet
          rooms={rooms}
          period={period}
          periodLabel={periodLabel}
          canRecord={canRecord}
          rates={rates}
        />
      ) : (
        <div className="grid gap-3">
          {rooms.map((entry) => (
            <MeterRow
              key={entry.room.id}
              room={entry.room}
              kind={entry.kind}
              period={period}
              rates={rates}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * One card per room. Exactly one `useActionState` hook lives here at the top
 * (never inside a branch), and `state.message` renders in `role="status"` for
 * ALL kinds, so the success message survives the row flipping to "recorded"
 * after revalidation.
 */
function MeterRow({
  room,
  kind,
  period,
  rates,
}: {
  room: Room;
  kind: MeterRoomKind;
  period: string;
  rates: Rates;
}) {
  const [state, formAction, isPending] = useActionState(
    saveMeterReadingAction,
    INITIAL_STATE,
  );
  const [electricPrevious, setElectricPrevious] = useState("");
  const [electricCurrent, setElectricCurrent] = useState("");
  const [waterPrevious, setWaterPrevious] = useState("");
  const [waterCurrent, setWaterCurrent] = useState("");

  const isRecorded = kind.kind === "recorded";
  const roomLabel = t.rooms.roomTitle(room.number);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <ActionResultToast state={state} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{roomLabel}</h3>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            isRecorded
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-slate-100 text-slate-600 ring-slate-500/20",
          )}
        >
          {isRecorded ? t.billing.meter.recorded : t.billing.meter.pending}
        </span>
      </div>

      {state.status !== "idle" && state.message ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs",
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {state.status === "success" ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-rose-500"
              aria-hidden="true"
            />
          )}
          <p>{state.message}</p>
        </div>
      ) : null}

      {kind.kind === "recorded" ? (
        <RecordedBody reading={kind.reading} />
      ) : kind.kind === "blocked" ? (
        <p className="mt-3 text-sm text-slate-500">
          {t.billing.meter.errors.laterExists}
        </p>
      ) : (
        <EditableForm
          roomId={room.id}
          roomLabel={roomLabel}
          period={period}
          rates={rates}
          previous={kind.previous}
          state={state}
          formAction={formAction}
          isPending={isPending}
          electricPrevious={electricPrevious}
          setElectricPrevious={setElectricPrevious}
          electricCurrent={electricCurrent}
          setElectricCurrent={setElectricCurrent}
          waterPrevious={waterPrevious}
          setWaterPrevious={setWaterPrevious}
          waterCurrent={waterCurrent}
          setWaterCurrent={setWaterCurrent}
        />
      )}
    </article>
  );
}

/** Read-only previous \u2192 current, usage and cost at the stored rate. */
function RecordedBody({ reading }: { reading: UtilityReading }) {
  const electricUsage = reading.electricCurrent - reading.electricPrevious;
  const waterUsage = reading.waterCurrent - reading.waterPrevious;
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-500">
          {t.billing.meter.electric} (kWh)
        </legend>
        <div className="space-y-1 text-sm text-slate-600">
          <p>
            {t.billing.meter.previous}: {reading.electricPrevious} →{" "}
            {t.billing.meter.current}: {reading.electricCurrent}
          </p>
          <p>
            {t.billing.meter.usage}: {electricUsage} kWh
          </p>
          <p>
            {t.billing.meter.estimatedCost}:{" "}
            {formatUnitPrice(electricUsage * reading.electricRate)}
          </p>
        </div>
      </fieldset>
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-500">
          {t.billing.meter.water} (m³)
        </legend>
        <div className="space-y-1 text-sm text-slate-600">
          <p>
            {t.billing.meter.previous}: {reading.waterPrevious} →{" "}
            {t.billing.meter.current}: {reading.waterCurrent}
          </p>
          <p>
            {t.billing.meter.usage}: {waterUsage} m³
          </p>
          <p>
            {t.billing.meter.estimatedCost}:{" "}
            {formatUnitPrice(waterUsage * reading.waterRate)}
          </p>
        </div>
      </fieldset>
    </div>
  );
}

/**
 * Editable card body: one <form> with hidden roomId/period, two
 * <fieldset>/<legend> blocks (electric kWh, water m3), a live usage + cost
 * preview via formatUnitPrice, a below-previous warning that never blocks
 * submit (the server is the authority), and a pending-aware save button.
 */
function EditableForm({
  roomId,
  roomLabel,
  period,
  rates,
  previous,
  state,
  formAction,
  isPending,
  electricPrevious,
  setElectricPrevious,
  electricCurrent,
  setElectricCurrent,
  waterPrevious,
  setWaterPrevious,
  waterCurrent,
  setWaterCurrent,
}: {
  roomId: string;
  roomLabel: string;
  period: string;
  rates: Rates;
  previous: Previous;
  state: MeterReadingFormState;
  formAction: (payload: FormData) => void;
  isPending: boolean;
  electricPrevious: string;
  setElectricPrevious: (value: string) => void;
  electricCurrent: string;
  setElectricCurrent: (value: string) => void;
  waterPrevious: string;
  setWaterPrevious: (value: string) => void;
  waterCurrent: string;
  setWaterCurrent: (value: string) => void;
}) {
  const hasPrevious = previous !== null;
  const ePrev = hasPrevious ? previous.electric : parseInput(electricPrevious);
  const eCurr = parseInput(electricCurrent);
  const wPrev = hasPrevious ? previous.water : parseInput(waterPrevious);
  const wCurr = parseInput(waterCurrent);
  const eUsage = ePrev !== null && eCurr !== null ? eCurr - ePrev : null;
  const wUsage = wPrev !== null && wCurr !== null ? wCurr - wPrev : null;

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="period" value={period} />
      {hasPrevious ? (
        <>
          <input type="hidden" name="electricPrevious" value={String(previous.electric)} />
          <input type="hidden" name="waterPrevious" value={String(previous.water)} />
        </>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <MeterFieldset unit="kWh" kind="electric" roomId={roomId} roomLabel={roomLabel}
          previous={hasPrevious ? previous.electric : null}
          previousInput={electricPrevious} setPreviousInput={setElectricPrevious}
          currentInput={electricCurrent} setCurrentInput={setElectricCurrent}
          fieldErrorPrevious={state.fieldErrors?.electricPrevious}
          fieldErrorCurrent={state.fieldErrors?.electricCurrent}
          usage={eUsage} rate={rates.electricPerKwh} />
        <MeterFieldset unit="m³" kind="water" roomId={roomId} roomLabel={roomLabel}
          previous={hasPrevious ? previous.water : null}
          previousInput={waterPrevious} setPreviousInput={setWaterPrevious}
          currentInput={waterCurrent} setCurrentInput={setWaterCurrent}
          fieldErrorPrevious={state.fieldErrors?.waterPrevious}
          fieldErrorCurrent={state.fieldErrors?.waterCurrent}
          usage={wUsage} rate={rates.waterPerCubicMeter} />
      </div>
      {hasPrevious ? null : (
        <p className="text-sm text-slate-500">{t.billing.meter.firstReadingHint}</p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? (<>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>{t.billing.meter.saving}</span>
          </>) : (<span>{t.common.save}</span>)}
        </button>
      </div>
      </form>
  );
}

/** One utility (electric kWh or water m3):previous + current + live preview. */
function MeterFieldset({
  unit, kind, roomId, roomLabel, previous,
  previousInput, setPreviousInput, currentInput, setCurrentInput,
  fieldErrorPrevious, fieldErrorCurrent, usage, rate,
}: {
  unit: string;
  kind: "electric" | "water";
  roomId: string;
  roomLabel: string;
  previous: number | null;
  previousInput: string;
  setPreviousInput: (value: string) => void;
  currentInput: string;
  setCurrentInput: (value: string) => void;
  fieldErrorPrevious: string | undefined;
  fieldErrorCurrent: string | undefined;
  usage: number | null;
  rate: number;
}) {
  const title = kind === "electric" ? t.billing.meter.electric : t.billing.meter.water;
  const prevName = kind === "electric" ? "electricPrevious" : "waterPrevious";
  const currName = kind === "electric" ? "electricCurrent" : "waterCurrent";
  return (
    <fieldset className="rounded-xl border border-slate-200 p-3">
      <legend className="px-1 text-xs font-semibold text-slate-500">
        {title} ({unit})
      </legend>
      {previous !== null ? (
        <p className="text-sm text-slate-600">
          {t.billing.meter.previous}: {previous}
        </p>
      ) : (
        <MeterNumberInput
          id={roomId + "-" + kind + "-previous"}
          name={prevName}
          label={t.billing.meter.previous}
          ariaLabel={title + " " + t.billing.meter.previous + " " + roomLabel}
          value={previousInput}
          onChange={setPreviousInput}
          fieldError={fieldErrorPrevious}
        />
      )}
      <div className="mt-2">
        <MeterNumberInput
          id={roomId + "-" + kind + "-current"}
          name={currName}
          label={t.billing.meter.current}
          ariaLabel={title + " " + t.billing.meter.current + " " + roomLabel}
          value={currentInput}
          onChange={setCurrentInput}
          fieldError={fieldErrorCurrent}
          warningId={usage !== null && usage < 0 ? roomId + "-" + kind + "-current-warning" : undefined}
        />
        {usage !== null ? (
          <div className="mt-1">
            <p className="text-xs text-slate-500">
              {t.billing.meter.usage}: {usage} {unit} ·{" "}
              {t.billing.meter.estimatedCost}:{" "}
              {formatUnitPrice(usage * rate)}
            </p>
            {usage < 0 ? (
              <p id={roomId + "-" + kind + "-current-warning"} className="mt-1 text-xs text-amber-700">
                {t.billing.meter.belowPreviousWarning}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

/** Labelled number input with server field-error wiring. */
function MeterNumberInput({
  id, name, label, ariaLabel, value, onChange, fieldError, warningId,
}: {
  id: string;
  name: string;
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  fieldError: string | undefined;
  warningId?: string;
}) {
  const describedBy = [fieldError ? id + "-error" : null, warningId ?? null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={describedBy}
        className={cn(INPUT_CLS, fieldError && "border-rose-300 focus:border-rose-400")}
      />
      {fieldError ? (
        <p id={id + "-error"} className="mt-1 text-xs text-rose-600">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
