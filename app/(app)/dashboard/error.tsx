"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { t } from "@/lib/i18n";

export default function DashboardError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section
      role="alert"
      className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-amber-200 bg-white px-6 py-10 text-center shadow-sm"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        {t.dashboard.loadError.title}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {t.dashboard.loadError.description}
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        {t.dashboard.loadError.retry}
      </button>
    </section>
  );
}
