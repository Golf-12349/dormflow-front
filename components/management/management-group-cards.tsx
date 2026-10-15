import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ManagementGroup } from "@/lib/management";

export function ManagementGroupCards({ group }: { group: ManagementGroup }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {group.modules.map((module) => (
        <Link
          key={module.slug}
          href={module.href ?? `/management/${group.slug}/${module.slug}`}
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
        >
          <span className="flex items-start justify-between gap-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <group.icon className="size-5" aria-hidden="true" />
            </span>
            <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-indigo-600" aria-hidden="true" />
          </span>
          <span className="mt-4 block text-base font-semibold text-slate-900">
            {module.title}
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-500">
            {module.description}
          </span>
        </Link>
      ))}
    </div>
  );
}
