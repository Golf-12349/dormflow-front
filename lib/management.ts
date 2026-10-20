import {
  Banknote,
  Building2,
  Settings,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { t } from "@/lib/i18n";

export interface ManagementModule {
  slug: string;
  title: string;
  description: string;
  endpoint: string;
  href?: string;
  query?: Record<string, string | number>;
}

export interface ManagementGroup {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  modules: ManagementModule[];
}

export const MANAGEMENT_GROUPS: ManagementGroup[] = [
  {
    slug: "properties",
    title: t.management.groups.properties.title,
    description: t.management.groups.properties.description,
    icon: Building2,
    modules: [
      { slug: "organizations", ...t.management.modules.organizations, endpoint: "/organizations" },
      { slug: "dormitories", ...t.management.modules.dormitories, endpoint: "/dormitories" },
      { slug: "buildings", ...t.management.modules.buildings, endpoint: "/buildings" },
      { slug: "floors", ...t.management.modules.floors, endpoint: "/floors" },
      { slug: "room-types", ...t.management.modules["room-types"], endpoint: "/room-types" },
      { slug: "rooms", ...t.management.modules.rooms, endpoint: "/rooms", href: "/rooms" },
    ],
  },
  {
    slug: "residents",
    title: t.management.groups.residents.title,
    description: t.management.groups.residents.description,
    icon: Users,
    modules: [
      { slug: "tenants", ...t.management.modules.tenants, endpoint: "/tenants", href: "/tenants" },
      { slug: "contracts", ...t.management.modules.contracts, endpoint: "/contracts" },
      { slug: "reservations", ...t.management.modules.reservations, endpoint: "/reservations" },
    ],
  },
  {
    slug: "finance",
    title: t.management.groups.finance.title,
    description: t.management.groups.finance.description,
    icon: Banknote,
    modules: [
      { slug: "meter-readings", ...t.management.modules["meter-readings"], endpoint: "/meter-readings", href: "/billing" },
      { slug: "invoices", ...t.management.modules.invoices, endpoint: "/invoices", href: "/billing" },
      { slug: "payments", ...t.management.modules.payments, endpoint: "/payments" },
      { slug: "deposits", ...t.management.modules.deposits, endpoint: "/deposits" },
      { slug: "expenses", ...t.management.modules.expenses, endpoint: "/expenses" },
      { slug: "receipts", ...t.management.modules.receipts, endpoint: "/receipts" },
      {
        slug: "reports",
        ...t.management.modules.reports,
        endpoint: "/reports/revenue",
        query: { periodFrom: `${new Date().getFullYear() - 1}-01-01`, periodTo: `${new Date().getFullYear()}-12-01` },
      },
    ],
  },
  {
    slug: "services",
    title: t.management.groups.services.title,
    description: t.management.groups.services.description,
    icon: Wrench,
    modules: [
      { slug: "maintenance-requests", ...t.management.modules["maintenance-requests"], endpoint: "/maintenance-requests" },
      { slug: "parcels", ...t.management.modules.parcels, endpoint: "/parcels" },
      { slug: "visitors", ...t.management.modules.visitors, endpoint: "/visitors" },
      { slug: "parking", ...t.management.modules.parking, endpoint: "/parking" },
      { slug: "announcements", ...t.management.modules.announcements, endpoint: "/announcements" },
      { slug: "notifications", ...t.management.modules.notifications, endpoint: "/notifications" },
    ],
  },
  {
    slug: "administration",
    title: t.management.groups.administration.title,
    description: t.management.groups.administration.description,
    icon: Settings,
    modules: [
      { slug: "users", ...t.management.modules.users, endpoint: "/users" },
      { slug: "roles", ...t.management.modules.roles, endpoint: "/roles" },
      { slug: "permissions", ...t.management.modules.permissions, endpoint: "/permissions" },
      { slug: "audit-logs", ...t.management.modules["audit-logs"], endpoint: "/audit-logs" },
      { slug: "settings", ...t.management.modules.settings, endpoint: "/settings", href: "/settings" },
    ],
  },
];

export function getManagementGroup(slug: string): ManagementGroup | undefined {
  return MANAGEMENT_GROUPS.find((group) => group.slug === slug);
}

export function getManagementModule(
  groupSlug: string,
  moduleSlug: string,
): { group: ManagementGroup; module: ManagementModule } | undefined {
  const group = getManagementGroup(groupSlug);
  const managementModule = group?.modules.find(
    (item) => item.slug === moduleSlug && !item.href,
  );
  return group && managementModule
    ? { group, module: managementModule }
    : undefined;
}
