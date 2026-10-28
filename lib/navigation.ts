import type { ComponentType } from "react";
import {
  BedDouble,
  BellRing,
  Building2,
  CarFront,
  CalendarDays,
  ChartNoAxesCombined,
  ContactRound,
  CreditCard,
  DoorOpen,
  FileText,
  Home,
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
} from "lucide-react";

import { t } from "@/lib/i18n";

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

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "ການດຳເນີນງານຫຼັກ",
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
        label: "ຜູ້ເຊົ່າ ແລະ ສັນຍາ",
        href: "/tenants",
        icon: Users,
        description: "ຈັດການຂໍ້ມູນຜູ້ເຊົ່າ, ສັນຍາເຊົ່າ ແລະ ການຈອງຫ້ອງ",
        children: [
          {
            label: "ຜູ້ເຊົ່າທັງໝົດ",
            href: "/tenants",
            icon: UserRound,
            description: t.nav.tenantsDescription,
          },
          {
            label: "ສັນຍາເຊົ່າ",
            href: "/management/residents/contracts",
            icon: FileText,
            description: "ສັນຍາເຊົ່າ, ຕໍ່ອາຍຸ ແລະ ການຍົກເລີກ",
          },
          {
            label: "ການຈອງຫ້ອງ",
            href: "/management/residents/reservations",
            icon: CalendarDays,
            description: "ການຈອງຫ້ອງພັກລ່ວງໜ້າ",
          },
        ],
      },
      {
        label: "ຈັດການຫໍພັກ",
        href: "/master-data",
        icon: Building2,
        description: "ຕັ້ງຄ່າໂຄງສ້າງຫໍພັກ, ອາຄານ, ຊັ້ນ ແລະ ປະເພດຫ້ອງ",
        children: [
          {
            label: "ຈັດການຂໍ້ມູນພື້ນຖານ",
            href: "/master-data",
            icon: Settings2,
            description: "ຈັດການຫໍພັກ, ອາຄານ, ຊັ້ນ ແລະ ປະເພດຫ້ອງແບບຄົບວົງຈອນ",
          },
          {
            label: "ຫໍພັກ",
            href: "/management/properties/dormitories",
            icon: Home,
            description: "ລາຍຊື່ຫໍພັກໃນລະບົບ",
          },
          {
            label: "ອາຄານ",
            href: "/management/properties/buildings",
            icon: Warehouse,
            description: "ອາຄານພາຍໃນຫໍພັກ",
          },
          {
            label: "ຊັ້ນ",
            href: "/management/properties/floors",
            icon: Layers,
            description: "ຊັ້ນພາຍໃນອາຄານ",
          },
          {
            label: "ປະເພດຫ້ອງ",
            href: "/management/properties/room-types",
            icon: BedDouble,
            description: "ປະເພດຫ້ອງ ແລະ ອັດຕາຄ່າເຊົ່າ",
          },
        ],
      },
    ],
  },
  {
    title: "ການເງິນ ແລະ ບໍລິການ",
    items: [
      {
        label: "ການເງິນ ແລະ ໃບບິນ",
        href: "/billing",
        icon: Receipt,
        description: "ບັນທຶກມິເຕີ, ອອກໃບບິນ ແລະ ການຊຳລະເງິນ",
        children: [
          {
            label: "ຈັດການໃບບິນ ແລະ ມິເຕີ",
            href: "/billing",
            icon: Receipt,
            description: t.nav.billingDescription,
          },
          {
            label: "ຮອບໃບບິນ",
            href: "/management/finance/billing-periods",
            icon: CalendarDays,
            description: "ກຳນົດຮອບເວລາອອກໃບບິນ",
          },
          {
            label: "ໃບບິນທັງໝົດ",
            href: "/management/finance/invoices",
            icon: FileText,
            description: "ລາຍການໃບບິນ ແລະ ປະຫວັດໃບບິນ",
          },
          {
            label: "ການຊຳລະເງິນ",
            href: "/management/finance/payments",
            icon: CreditCard,
            description: "ບັນທຶກການຊຳລະເງິນຂອງຜູ້ເຊົ່າ",
          },
          {
            label: "ເງິນມັດຈຳ",
            href: "/management/finance/deposits",
            icon: PiggyBank,
            description: "ຈັດການເງິນມັດຈຳ ແລະ ການຄືນເງິນ",
          },
          {
            label: "ລາຍຈ່າຍ",
            href: "/management/finance/expenses",
            icon: Wallet,
            description: "ບັນທຶກລາຍຈ່າຍທົ່ວໄປຂອງຫໍພັກ",
          },
          {
            label: "ລາຍງານການເງິນ",
            href: "/management/finance/reports",
            icon: ChartNoAxesCombined,
            description: "ລາຍງານລາຍຮັບ-ລາຍຈ່າຍ ແລະ ສະຖິຕິ",
          },
        ],
      },
      {
        label: "ບໍລິການຜູ້ພັກອາໄສ",
        href: "/management/services/maintenance-requests",
        icon: Wrench,
        description: "ແຈ້ງສ້ອມແປງ, ພັດສະດຸ, ຜູ້ມາຕິດຕໍ່ ແລະ ບ່ອນຈອດລົດ",
        children: [
          {
            label: "ແຈ້ງສ້ອມແປງ",
            href: "/management/services/maintenance-requests",
            icon: Wrench,
            description: "ລາຍການແຈ້ງສ້ອມແປງ ແລະ ຕິດຕາມສະຖານະ",
          },
          {
            label: "ພັດສະດຸ",
            href: "/management/services/parcels",
            icon: Package,
            description: "ຈັດການພັດສະດຸຂອງຜູ້ເຊົ່າ",
          },
          {
            label: "ຜູ້ມາຕິດຕໍ່",
            href: "/management/services/visitors",
            icon: ContactRound,
            description: "ບັນທຶກການເຂົ້າ-ອອກຂອງຜູ້ມາຕິດຕໍ່",
          },
          {
            label: "ບ່ອນຈອດລົດ",
            href: "/management/services/parking",
            icon: CarFront,
            description: "ຈັດການບ່ອນຈອດລົດ ແລະ ທະບຽນລົດ",
          },
        ],
      },
      {
        label: "ແຈ້ງເຕືອນ ແລະ ປະກາດ",
        href: "/management/services/announcements",
        icon: Megaphone,
        description: "ປະກາດຂ່າວສານ ແລະ ແຈ້ງເຕືອນຜູ້ເຊົ່າ",
        children: [
          {
            label: "ປະກາດຂ່າວສານ",
            href: "/management/services/announcements",
            icon: Megaphone,
            description: "ປະກາດຂ່າວສານເຖິງຜູ້ເຊົ່າ",
          },
          {
            label: "ແຈ້ງເຕືອນລະບົບ",
            href: "/management/services/notifications",
            icon: BellRing,
            description: "ການແຈ້ງເຕືອນລະບົບ ແລະ ຂໍ້ຄວາມ",
          },
        ],
      },
    ],
  },
  {
    title: "ຕັ້ງຄ່າ ແລະ ລະບົບ",
    items: [
      {
        label: "ຕັ້ງຄ່າ ແລະ ຜູ້ດູແລລະບົບ",
        href: "/settings",
        icon: Settings2,
        description: "ຕັ້ງຄ່າລະບົບ, ຜູ້ໃຊ້ງານ ແລະ ບັນທຶກການໃຊ້ງານ",
        children: [
          {
            label: "ຕັ້ງຄ່າທົ່ວໄປ",
            href: "/settings",
            icon: Settings,
            description: t.nav.settingsDescription,
          },
          {
            label: "ຜູ້ໃຊ້ລະບົບ",
            href: "/management/administration/users",
            icon: UserRound,
            description: "ຈັດການບັນຊີຜູ້ໃຊ້ ແລະ ພະນັກງານ",
          },
          {
            label: "ບົດບາດ ແລະ ສິດ",
            href: "/management/administration/roles",
            icon: ShieldCheck,
            description: "ກຳນົດບົດບາດ ແລະ ສິດການເຂົ້າເຖິງ",
          },
          {
            label: "ບັນທຶກການໃຊ້ງານ",
            href: "/management/administration/audit-logs",
            icon: ScrollText,
            description: "ປະຫວັດການດຳເນີນງານໃນລະບົບ",
          },
        ],
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