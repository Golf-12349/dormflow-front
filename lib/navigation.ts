import type { ComponentType } from "react";
import {
  BedDouble,
  BellRing,
  Building2,
  CarFront,
  CalendarDays,
  ChartNoAxesCombined,
  Cog,
  ContactRound,
  CreditCard,
  DoorOpen,
  FileText,
  Gauge,
  Home,
  Landmark,
  Layers,
  LayoutDashboard,
  Megaphone,
  Package,
  PiggyBank,
  Receipt,
  ScrollText,
  ShieldCheck,
  Settings,
  Settings2,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  KeyRound,
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
  children?: NavItem[];
  overviewHref?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const PROPERTY_MODULE_ICONS: Record<string, NavIcon> = {
  organizations: Landmark,
  dormitories: Home,
  buildings: Warehouse,
  floors: Layers,
  "room-types": BedDouble,
  rooms: DoorOpen,
};

const RESIDENT_MODULE_ICONS: Record<string, NavIcon> = {
  tenants: UserRound,
  contracts: FileText,
  reservations: CalendarDays,
};

const FINANCE_MODULE_ICONS: Record<string, NavIcon> = {
  "meter-readings": Gauge,
  invoices: FileText,
  payments: CreditCard,
  deposits: PiggyBank,
  expenses: Wallet,
  receipts: Receipt,
  reports: ChartNoAxesCombined,
};

const SERVICE_MODULE_ICONS: Record<string, NavIcon> = {
  "maintenance-requests": Wrench,
  parcels: Package,
  visitors: ContactRound,
  parking: CarFront,
  announcements: Megaphone,
  notifications: BellRing,
};

const ADMINISTRATION_MODULE_ICONS: Record<string, NavIcon> = {
  users: UserRound,
  roles: ShieldCheck,
  permissions: KeyRound,
  "audit-logs": ScrollText,
  settings: Settings2,
};

function managementNavItem(group: (typeof MANAGEMENT_GROUPS)[number]): NavItem {
  const href = `/management/${group.slug}`;
  const item: NavItem = {
    label: group.title,
    href,
    icon: group.icon,
    description: group.description,
  };

  if (group.slug === "properties") {
    item.overviewHref = href;
    item.children = group.modules.map((module) => ({
      label: module.title,
      href: module.href ?? `${href}/${module.slug}`,
      icon: PROPERTY_MODULE_ICONS[module.slug] ?? Building2,
      description: module.description,
    }));
  }

  if (group.slug === "residents") {
    item.overviewHref = href;
    item.children = group.modules.map((module) => ({
      label: module.title,
      href: module.href ?? `${href}/${module.slug}`,
      icon: RESIDENT_MODULE_ICONS[module.slug] ?? Users,
      description: module.description,
    }));
  }

  if (group.slug === "finance") {
    item.overviewHref = href;
    item.children = group.modules.map((module) => ({
      label: module.title,
      href: module.href ?? `${href}/${module.slug}`,
      icon: FINANCE_MODULE_ICONS[module.slug] ?? Receipt,
      description: module.description,
    }));
  }

  if (group.slug === "services") {
    item.overviewHref = href;
    item.children = group.modules.map((module) => ({
      label: module.title,
      href: module.href ?? `${href}/${module.slug}`,
      icon: SERVICE_MODULE_ICONS[module.slug] ?? Wrench,
      description: module.description,
    }));
  }

  if (group.slug === "administration") {
    item.overviewHref = href;
    item.children = group.modules.map((module) => ({
      label: module.title,
      href: module.href ?? `${href}/${module.slug}`,
      icon: ADMINISTRATION_MODULE_ICONS[module.slug] ?? Cog,
      description: module.description,
    }));
  }

  return item;
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
      ...MANAGEMENT_GROUPS.map(managementNavItem),
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

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) =>
  section.items.flatMap((item) => [...(item.children ?? []), item]),
);

/** True for the item's own route and any nested route beneath it. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Resolves the nav item that owns the current pathname (for the topbar). */
export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
}