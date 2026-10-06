/**
 * Route-level loading state for every authenticated page.
 *
 * It lives in the `(app)` route group, so the sidebar and topbar stay mounted
 * while the page data is resolving — the mock service adds ~180ms of latency
 * per call, which is exactly the kind of pause this covers.
 */

import { t } from "@/lib/i18n";

export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-slate-200/70" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />

      <span className="sr-only">{t.loading.page}</span>
    </div>
  );
}