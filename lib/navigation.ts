import type { ComponentType } from "react";
import {
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

import { t } from "@/lib/i18n";
import { MANAGEMENT_GROUPS } from "@/lib/management";

/**
 * Navigation model for the admin shell.
 *
 * The icon type is declared locally (rather than importing lucide's own type
 * export, which changed names between majors) so this module stays stable.
 *
 * Labels and descriptions come from the Lao catalog (`lib/i18n`): this file is
 * the single source for both the sidebar links and the topbar title/subtitle,
 * so translating here localizes both without a second lookup table.
 */
export type NavIcon = ComponentType<{ className?: string }>;

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
  /** Shown under the page title in the topbar. */
  description: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: t.nav.operations,
    items: [
      {
        label: t.nav.overview,
        href: "/dashboard",
        icon: LayoutDashboard,
        description: t.nav.overviewDescription,
      },
      {
        label: t.nav.rooms,
        href: "/rooms",
        icon: DoorOpen,
        description: t.nav.roomsDescription,
      },
      {
        label: t.nav.tenants,
        href: "/tenants",
        icon: Users,
        description: t.nav.tenantsDescription,
      },
      ...MANAGEMENT_GROUPS.map((group) => ({
        label: group.title,
        href: `/management/${group.slug}`,
        icon: group.icon ?? ClipboardList,
        description: group.description,
      })),
    ],
  },
  {
    title: t.nav.financeAndSystem,
    items: [
      {
        label: t.nav.billing,
        href: "/billing",
        icon: Receipt,
        description: t.nav.billingDescription,
      },
      {
        label: t.nav.settings,
        href: "/settings",
        icon: Settings,
        description: t.nav.settingsDescription,
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(
  (section) => section.items,
);

/** True for the item's own route and any nested route beneath it. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Resolves the nav item that owns the current pathname (for the topbar). */
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
}