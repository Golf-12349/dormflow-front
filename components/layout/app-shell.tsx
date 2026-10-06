"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { t } from "@/lib/i18n";
import type { AdminUser } from "@/types";

/**
 * Responsive authenticated shell: fixed sidebar from `lg` up, off-canvas drawer
 * below it, sticky topbar on every breakpoint.
 *
 * It is a Client Component only because of the drawer's open/close state — all
 * data still arrives as props from the Server Component layout.
 */
export function AppShell({
  user,
  alertCount,
  children,
}: {
  user: AdminUser;
  alertCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /**
   * The drawer stores the path it was opened at, so any navigation closes it by
   * derivation instead of an effect. Besides avoiding a cascading render, this
   * keeps the component clear of `react-hooks/set-state-in-effect`.
   */
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;

  const openDrawer = () => setDrawerPath(pathname);
  const closeDrawer = () => setDrawerPath(null);

  return (
    <div className="min-h-dvh bg-slate-50 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <SidebarNav user={user} />
      </aside>

      {drawerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.shell.navigationLabel}
          className="fixed inset-0 z-40 lg:hidden"
        >
          <button
            type="button"
            aria-label={t.shell.closeNavigation}
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div className="relative h-full w-72 max-w-[85%] shadow-xl">
            <SidebarNav user={user} onNavigate={closeDrawer} />
            <button
              type="button"
              onClick={closeDrawer}
              aria-label={t.shell.closeNavigation}
              className="absolute top-4 right-3 rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Topbar
          user={user}
          alertCount={alertCount}
          onOpenNavigation={openDrawer}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}