"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Building2, Check, ChevronDown, LogOut, Menu, Search } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";
import { t } from "@/lib/i18n";
import { findNavItem } from "@/lib/navigation";
import { cn, initials } from "@/lib/utils";
import type { AdminUser } from "@/types";

export interface DormitoryItem {
  id: string;
  name: string;
}

export function Topbar({
  user,
  alertCount,
  dormitories = [],
  onOpenNavigation,
}: {
  user: AdminUser;
  /** Number of invoices still awaiting payment. */
  alertCount: number;
  dormitories?: DormitoryItem[];
  onOpenNavigation: () => void;
}) {
  const pathname = usePathname();
  const currentItem = findNavItem(pathname);

  const [activeDormId, setActiveDormId] = useState<string>(() => dormitories[0]?.id ?? "");
  const [isDormDropdownOpen, setIsDormDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read from cookie if present
    const match = document.cookie.match(/(?:^|;\s*)active_dormitory_id=([^;]+)/);
    if (match?.[1] && dormitories.some((d) => d.id === match[1])) {
      setActiveDormId(match[1]);
    } else if (dormitories[0]?.id) {
      setActiveDormId(dormitories[0].id);
    }
  }, [dormitories]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDormDropdownOpen(false);
      }
    }
    if (isDormDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDormDropdownOpen]);

  const activeDorm = dormitories.find((d) => d.id === activeDormId) ?? dormitories[0];

  const handleSelectDorm = (dormId: string) => {
    setActiveDormId(dormId);
    setIsDormDropdownOpen(false);
    document.cookie = `active_dormitory_id=${dormId}; path=/; max-age=31536000; SameSite=Lax`;
  };

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

        <div className="min-w-0 flex-1 flex items-center gap-4">
          <div>
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">
              {currentItem?.label ?? "DormHub"}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              {currentItem?.description ?? t.shell.defaultDescription}
            </p>
          </div>

          {/* Dormitory Switcher Dropdown */}
          {dormitories.length > 0 ? (
            <div ref={dropdownRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsDormDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 focus:border-indigo-500"
              >
                <Building2 className="size-3.5 text-indigo-600" />
                <span className="max-w-[120px] truncate sm:max-w-[170px]">
                  {activeDorm?.name ?? "ເລືອກຫໍພັກ"}
                </span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {isDormDropdownOpen ? (
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    ຫໍພັກ / ສາຂາ
                  </div>
                  <div className="space-y-0.5 max-h-56 overflow-y-auto">
                    {dormitories.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectDorm(d.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left font-medium transition",
                          d.id === activeDorm?.id
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        <span className="truncate">{d.name}</span>
                        {d.id === activeDorm?.id ? (
                          <Check className="size-3.5 text-indigo-600 shrink-0" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
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