import { Construction } from "lucide-react";

import { t } from "@/lib/i18n";

/**
 * Shared shell for routes that are planned but not implemented yet.
 *
 * Keeping the roadmap visible inside the app means the sidebar never dead-ends
 * in a 404 while the later phases are still being built, and it documents what
 * is coming without anyone having to open `workflow.md`.
 */
export function PagePlaceholder({
  title,
  description,
  phase,
  planned,
  children,
}: {
  title: string;
  description: string;
  /** Which roadmap phase delivers this screen, e.g. "Phase 5". */
  phase: string;
  planned: string[];
  /** Optional live-data summary rendered above the roadmap card. */
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-slate-500">{description}</p>
      </div>

      {children}

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-600 uppercase">
          <Construction className="size-4" aria-hidden="true" />
          {t.placeholders.plannedIn(phase)}
        </p>
        <ul className="mt-4 space-y-2.5">
          {planned.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-slate-600">
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}