"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  LogOut,
} from "lucide-react";

import {
  NAV_SECTIONS,
  isActivePath,
  type NavItem,
} from "@/lib/navigation";
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
  const instanceId = useId();
  const [expansionOverride, setExpansionOverride] = useState<{
    pathname: string;
    expanded: boolean;
  } | null>(null);

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const childActive =
      item.children?.some((child) => isActivePath(pathname, child.href)) ??
      false;
    const active = isActivePath(pathname, item.href) || childActive;

    if (!item.children?.length) {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
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
    }

    const expanded =
      childActive ||
      (expansionOverride?.pathname === pathname &&
        expansionOverride.expanded);
    const submenuId = `${instanceId}-${item.href.replace(/[^a-z0-9]/giu, "-")}`;

    return (
      <div key={item.href}>
        <div
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition",
            active
              ? "bg-indigo-500 text-white shadow-sm"
              : "text-slate-300 hover:bg-white/5 hover:text-white",
          )}
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={submenuId}
            onClick={() =>
              setExpansionOverride({ pathname, expanded: !expanded })
            }
            className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl px-3 py-2 text-left"
          >
            <Icon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{item.label}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
                expanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
          {item.overviewHref ? (
            <Link
              href={item.overviewHref}
              aria-label={t.nav.openGroupOverview(item.label)}
              onClick={onNavigate}
              className="mr-1 rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <div
          id={submenuId}
          aria-hidden={!expanded}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
            expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-2">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const childIsActive = isActivePath(pathname, child.href);

                return (
                  <Link
                    key={`${child.href}-${child.label}`}
                    href={child.href}
                    onClick={onNavigate}
                    aria-current={childIsActive ? "page" : undefined}
                    tabIndex={expanded ? 0 : -1}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                      childIsActive
                        ? "bg-indigo-400/20 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                    )}
                  >
                    <ChildIcon
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {section.items.map(renderItem)}
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