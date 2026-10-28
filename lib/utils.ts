/**
 * Small shared helpers used across the Dormitory Management System UI.
 * No React / Next.js imports here so the helpers stay usable on the server
 * and in the browser.
 */

import type { BillingPeriod, RoomStatus, TenantStatus, InvoiceStatus } from "@/types";

/** Single place to change the currency of the whole application. */
export const CURRENCY = "LAK";

/** Joins conditional class names without pulling in a dependency. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number, options?: { compact?: boolean }): string {
  return new Intl.NumberFormat("lo-LA", {
    style: "currency",
    currency: CURRENCY,
    notation: options?.compact ? "compact" : "standard",
    maximumFractionDigits: options?.compact ? 1 : 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Unit prices retain two fractional digits so small utility rates remain
 * visible, unlike the whole-kip totals that `formatCurrency` rounds.
 */
export function formatUnitPrice(value: number): string {
  return new Intl.NumberFormat("lo-LA", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string" || iso.trim() === "") return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("lo-LA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string" || iso.trim() === "") return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("lo-LA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `2026-09` -> `September 2026`. */
export function formatPeriod(period: BillingPeriod): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString("lo-LA", {
    month: "long",
    year: "numeric",
  });
}

/** `2026-09` -> `Sep 2026`. */
export function formatPeriodShort(period: BillingPeriod): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString("lo-LA", {
    month: "short",
    year: "numeric",
  });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Lao relative-time formatter. `numeric: "always"` keeps the number in the
 * output ("3 ມື້ກ່ອນ") instead of the vaguer "ມື້ວານນີ້" style wording, which
 * matches what the hand-written English version used to print.
 *
 * Lao has no plural forms, so there is no singular/plural branch to keep.
 */
const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("lo", {
  numeric: "always",
});

/** Coarse human readable relative time, e.g. "3 ຊົ່ວໂມງກ່ອນ". */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);

  // `Intl.RelativeTimeFormat` has no unit below "second", so the sub-minute
  // bucket keeps a literal Lao string ("just now").
  if (minutes < 1) return "ຫາກໍ່";
  if (minutes < 60) return RELATIVE_TIME_FORMATTER.format(-minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (hours < 24) return RELATIVE_TIME_FORMATTER.format(-hours, "hour");

  const days = Math.round(hours / 24);
  if (days < 30) return RELATIVE_TIME_FORMATTER.format(-days, "day");

  const months = Math.round(days / 30);
  return RELATIVE_TIME_FORMATTER.format(-months, "month");
}

/** Current billing period as `YYYY-MM`. */
export function toBillingPeriod(date: Date = new Date()): BillingPeriod {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  vacant: "ຫວ່າງ",
  occupied: "ມີຜູ້ເຊົ່າ",
  maintenance: "ສ້ອມແປງ",
  reserved: "ຈອງແລ້ວ",
  cleaning: "ກຳລັງອະນາໄມ",
  inactive: "ປິດໃຊ້ງານ",
};

/** Tailwind badge classes per room status (used by the room + dashboard views). */
export const ROOM_STATUS_BADGE_CLASSES: Record<RoomStatus, string> = {
  vacant: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  occupied: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  maintenance: "bg-amber-50 text-amber-700 ring-amber-600/20",
  reserved: "bg-sky-50 text-sky-700 ring-sky-600/20",
  cleaning: "bg-teal-50 text-teal-700 ring-teal-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const ROOM_STATUS_DOT_CLASSES: Record<RoomStatus, string> = {
  vacant: "bg-emerald-500",
  occupied: "bg-indigo-500",
  maintenance: "bg-amber-500",
  reserved: "bg-sky-500",
  cleaning: "bg-teal-500",
  inactive: "bg-slate-400",
};

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: "ກຳລັງເຊົ່າ",
  pending: "ລໍຖ້າ",
  inactive: "ຢຸດເຊົ່າ",
  blacklisted: "ຕິດບັນຊີດຳ",
};

export const TENANT_STATUS_BADGE_CLASSES: Record<TenantStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  blacklisted: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: "ຊຳລະແລ້ວ",
  partial: "ຊຳລະບາງສ່ວນ",
  unpaid: "ຍັງບໍ່ໄດ້ຊຳລະ",
  overdue: "ເກີນກຳນົດ",
  draft: "ສະບັບຮ່າງ",
  cancelled: "ຍົກເລີກແລ້ວ",
};

export const INVOICE_STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  partial: "bg-sky-50 text-sky-700 ring-sky-600/20",
  unpaid: "bg-slate-100 text-slate-600 ring-slate-500/20",
  overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  cancelled: "bg-zinc-100 text-zinc-500 ring-zinc-400/20",
};

export function roomTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}