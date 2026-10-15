import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";

import { LoginForm } from "./login-form";
import { t } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: t.auth.title,
};

const HIGHLIGHTS = [
  {
    icon: Building2,
    title: t.auth.highlights.roomsAndOccupancy.title,
    description: t.auth.highlights.roomsAndOccupancy.description,
  },
  {
    icon: Users,
    title: t.auth.highlights.tenantRecords.title,
    description: t.auth.highlights.tenantRecords.description,
  },
  {
    icon: Receipt,
    title: t.auth.highlights.utilitiesAndBilling.title,
    description: t.auth.highlights.utilitiesAndBilling.description,
  },
  {
    icon: CalendarClock,
    title: t.auth.highlights.leaseTracking.title,
    description: t.auth.highlights.leaseTracking.description,
  },
];

export default async function LoginPage() {
  // Already signed in? Skip the form entirely.
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-dvh bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between bg-slate-900 p-12 text-slate-100 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500 text-white">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">DormHub</span>
        </div>

        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl leading-snug font-semibold tracking-tight text-white">
              {t.auth.panelHeading}
            </h1>
            <p className="text-base leading-relaxed text-slate-300">
              {t.auth.panelDescription}
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-200">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-sm text-slate-400">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t.auth.subheading}
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              DormHub
            </h1>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
              {t.auth.heading}
            </h2>
            <p className="text-sm text-slate-500">{t.auth.subheading}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <LoginForm />
          </div>

        </div>
      </section>
    </main>
  );
}