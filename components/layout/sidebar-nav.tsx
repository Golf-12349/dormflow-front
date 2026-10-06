"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut } from "lucide-react";

import { NAV_SECTIONS, isActivePath } from "@/lib/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { t } from "@/lib/i18n";
import { cn, initials } from "@/lib/utils";
import type { AdminUser } from "@/types";

/**
 * Sidebar contents shared by the desktop rail and the mobile drawer.
 *
 * Rendered twice on purpose: only one instance is visible per breakpoint, and
 * keeping a single component avoids two diverging copies of the nav.
 */
export function SidebarNav({
  user,
  onNavigate,
}: {
  user: AdminUser;
  /** Called after a link is followed, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-6 bg-slate-900 px-4 py-5 text-slate-300">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition hover:bg-white/5"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white">
          <Building2 className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-base font-semibold tracking-tight text-white">
            DormHub
          </span>
          <span className="truncate text-xs text-slate-400">
            {t.shell.consoleSubtitle}
          </span>
        </span>
      </Link>

      <nav
        aria-label={t.shell.mainNavigationLabel}
        className="scrollbar-thin flex-1 space-y-6 overflow-y-auto"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-1">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
              user.avatarClass,
            )}
            aria-hidden="true"
          >
            {initials(user.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">
              {user.name}
            </span>
            <span className="block truncate text-xs text-slate-400 capitalize">
              {t.roles[user.role] ?? user.role}
            </span>
          </span>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            {t.nav.signOut}
          </button>
        </form>
      </div>
    </div>
  );
}