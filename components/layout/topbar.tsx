"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, Search } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";
import { t } from "@/lib/i18n";
import { findNavItem } from "@/lib/navigation";
import { initials } from "@/lib/utils";
import type { AdminUser } from "@/types";

export function Topbar({
  user,
  alertCount,
  onOpenNavigation,
}: {
  user: AdminUser;
  /** Number of invoices still awaiting payment. */
  alertCount: number;
  onOpenNavigation: () => void;
}) {
  const pathname = usePathname();
  const currentItem = findNavItem(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label={t.shell.openNavigation}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">
            {currentItem?.label ?? "DormHub"}
          </h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {currentItem?.description ?? t.shell.defaultDescription}
          </p>
        </div>

        {/* GET form: the query lands in /rooms?q=… which Phase 5 consumes. */}
        <form
          action="/rooms"
          method="get"
          role="search"
          className="relative hidden md:block"
        >
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            placeholder={t.shell.searchRoomsPlaceholder}
            aria-label={t.shell.searchRoomsLabel}
            className="w-44 rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-indigo-400 lg:w-60"
          />
        </form>

        <Link
          href="/dashboard"
          title={t.shell.alertsTitle}
          aria-label={t.shell.alertsLabel(alertCount)}
          className="relative rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Bell className="size-4" aria-hidden="true" />
          {alertCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[11px] font-semibold text-white">
              {alertCount}
            </span>
          ) : null}
        </Link>

        <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 sm:flex">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${user.avatarClass}`}
            aria-hidden="true"
          >
            {initials(user.name)}
          </span>
          <span className="hidden lg:block">
            <span className="block text-sm font-medium text-slate-900">
              {user.name}
            </span>
            <span className="block text-xs text-slate-500 capitalize">
              {t.roles[user.role] ?? user.role}
            </span>
          </span>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t.nav.signOut}</span>
          </button>
        </form>
      </div>
    </header>
  );
}