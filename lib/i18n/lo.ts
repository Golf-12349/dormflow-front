export const lo = {
  common: {
    search: "ຄົ້ນຫາ",
    all: "ທັງໝົດ",
    close: "ປິດ",
    loading: "ກຳລັງໂຫຼດ...",
    cancel: "ຍົກເລີກ",
    save: "ບັນທຶກ",
  },
  nav: {
    operations: "ການດຳເນີນງານ",
    financeAndSystem: "ການເງິນ ແລະ ລະບົບ",
    overview: "ພາບລວມ",
    rooms: "ຫ້ອງ",
    tenants: "ຜູ້ເຊົ່າ",
    billing: "ໃບບິນ",
    settings: "ການຕັ້ງຄ່າ",
    signOut: "ອອກຈາກລະບົບ",
    /** Topbar subtitles; kept next to the nav labels they describe. */
    overviewDescription: "ອັດຕາການເຂົ້າພັກ, ລາຍຮັບ ແລະ ກິດຈະກຳຫຼ້າສຸດ",
    roomsDescription: "ສະຖານະຫ້ອງແຕ່ລະຊັ້ນ, ຄ່າເຊົ່າ ແລະ ສິ່ງອຳນວຍຄວາມສະດວກ",
    tenantsDescription: "ຂໍ້ມູນຜູ້ເຊົ່າ, ສັນຍາເຊົ່າ ແລະ ຍອດຄ້າງຊຳລະ",
    billingDescription: "ການອ່ານມິເຕີ, ໃບແຈ້ງໜີ້ ແລະ ການຊຳລະ",
    settingsDescription: "ອັດຕາຄ່ານ້ຳ-ໄຟຟ້າ, ບັນຊີພະນັກງານ ແລະ ການຕັ້ງຄ່າຕ່າງໆ",
  },
  shell: {
    consoleSubtitle: "ຄອນໂຊນຈັດການຫໍພັກ",
    defaultDescription: "ລະບົບຈັດການຫໍພັກ",
    mainNavigationLabel: "ເມນູຫຼັກ",
    navigationLabel: "ເມນູ",
    openNavigation: "ເປີດເມນູ",
    closeNavigation: "ປິດເມນູ",
    searchRoomsPlaceholder: "ຄົ້ນຫາຫ້ອງ...",
    searchRoomsLabel: "ຄົ້ນຫາຫ້ອງ",
    alertsTitle: "ໃບແຈ້ງໜີ້ທີ່ຍັງລໍຖ້າການຊຳລະ — ເບິ່ງທີ່ພາບລວມ",
    /** Lao has no plural forms, so the count is interpolated directly. */
    alertsLabel: (count: number) => `${count} ໃບແຈ້ງໜີ້ລໍຖ້າການຊຳລະ`,
  },
  auth: {
    /** Browser-tab title for `/login`. */
    title: "ເຂົ້າສູ່ລະບົບ",
    /** Brand panel copy. */
    panelHeading: "ຈັດການວຽກຫໍພັກທັງໝົດໃນຄອນໂຊນດຽວ",
    panelDescription:
      "ຕິດຕາມທຸກຫ້ອງ ຜູ້ເຊົ່າ ການອ່ານມິເຕີ ແລະ ໃບແຈ້ງໜີ້ຂອງຫໍພັກທັງໝົດ ໂດຍບໍ່ຕ້ອງໃຊ້ສະເປຣດຊີດ.",
    demoBuildNote: "ບິນສາທິດ · ຂໍ້ມູນມາຈາກ mock layer ພາຍໃນເຄື່ອງ",
    highlights: {
      roomsAndOccupancy: {
        title: "ຫ້ອງ ແລະ ອັດຕາການເຂົ້າພັກ",
        description: "ສະຖານະ ຫວ່າງ, ມີຜູ້ເຊົ່າ, ຈອງແລ້ວ ແລະ ສ້ອມແປງ ຂອງແຕ່ລະຊັ້ນ.",
      },
      tenantRecords: {
        title: "ຂໍ້ມູນຜູ້ເຊົ່າ",
        description: "ສັນຍາເຊົ່າ, ຊ່ອງທາງຕິດຕໍ່ ແລະ ຍອດຄ້າງຊຳລະ ໃນໜ້າດຽວ.",
      },
      utilitiesAndBilling: {
        title: "ຄ່ານ້ຳ-ໄຟຟ້າ ແລະ ໃບບິນ",
        description: "ການອ່ານມິເຕີຖືກປ່ຽນເປັນໃບແຈ້ງໜີ້ ພ້ອມປະລິມານໄຟຟ້າ ແລະ ນ້ຳທີ່ໃຊ້.",
      },
      leaseTracking: {
        title: "ຕິດຕາມສັນຍາເຊົ່າ",
        description: "ເຫັນສັນຍາໃດຈະໝົດອາຍຸຕໍ່ໄປ ກ່ອນທີ່ຈະໝົດ.",
      },
    },
    /** Form panel copy. */
    heading: "ເຂົ້າສູ່ລະບົບຄອນໂຊນຈັດການ",
    subheading: "ໃຊ້ບັນຊີພະນັກງານຂອງທ່ານ ເພື່ອຈັດການຫໍພັກ.",
    demoCredentials: "ບັນຊີສາທິດ",
    /** Split around the inline `<code>lib/mock-data.ts</code>` element. */
    demoCredentialsNotePrefix: "Mock auth — ກວດສອບໂດຍ ",
    demoCredentialsNoteSuffix: ", ຈະຖືກແທນດ້ວຍ API ຈິງໃນພາຍຫຼັງ.",
    emailLabel: "ອີເມວທີ່ໃຊ້ວຽກ",
    passwordLabel: "ລະຫັດຜ່ານ",
    showPassword: "ສະແດງລະຫັດຜ່ານ",
    hidePassword: "ເຊື່ອງລະຫັດຜ່ານ",
    keepSignedIn: "ຢູ່ໃນລະບົບຕໍ່",
    forgotPassword: "ລືມລະຫັດຜ່ານ?",
    forgotPasswordHint: "ການຕັ້ງລະຫັດຜ່ານໃໝ່ ໃຫ້ຕິດຕໍ່ຜູ້ດູແລລະບົບ.",
    submit: "ເຂົ້າສູ່ລະບົບ",
    submitting: "ກຳລັງເຂົ້າສູ່ລະບົບ…",
    /** Server Action results (`lib/actions/auth.ts`). */
    errors: {
      emailRequired: "ກະລຸນາປ້ອນອີເມວ.",
      emailInvalid: "ກະລຸນາປ້ອນອີເມວທີ່ຖືກຕ້ອງ.",
      passwordRequired: "ກະລຸນາປ້ອນລະຫັດຜ່ານ.",
      passwordTooShort: "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ.",
      fixFields: "ກະລຸນາແກ້ໄຂຊ່ອງຂໍ້ມູນທີ່ໄຮໄລທ໌ໄວ້.",
      invalidCredentials:
        "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ. ໃຊ້ບັນຊີສາທິດຂ້າງລຸ່ມນີ້.",
    },
  },
  placeholders: {
    /** `phase` is roadmap data (e.g. "Phase 6"), so it is interpolated as-is. */
    plannedIn: (phase: string) => `ວາງແຜນໄວ້ໃນ ${phase}`,
  },
  loading: {
    /** Screen-reader text for the route-level loading skeleton. */
    page: "ກຳລັງໂຫຼດໜ້າ...",
  },
  roles: {
    /** UserRole (`types/index.ts`): admin | manager | staff. */
    admin: "ຜູ້ດູແລລະບົບ",
    manager: "ຜູ້ຈັດການ",
    staff: "ພະນັກງານ",
  },
  meta: {
    /** Root `<title>`; the `%s · DormHub` template stays language-neutral. */
    defaultTitle: "DormHub — ລະບົບຈັດການຫໍພັກ",
    description:
      "ຄອນໂຊນຈັດການສຳລັບວຽກຫໍພັກ: ຫ້ອງ, ຜູ້ເຊົ່າ, ຄ່ານ້ຳ-ໄຟຟ້າ ແລະ ໃບບິນ.",
  },
  rooms: {
    /** Room-status mutation results (`lib/actions/rooms.ts`). */
    errors: {
      roomIdRequired: "ຕ້ອງມີລະຫັດຫ້ອງ.",
      targetStatusInvalid: "ສະຖານະປາຍທາງຕ້ອງເປັນ ຫວ່າງ ຫຼື ສ້ອມແປງ.",
      roomNotFound: "ບໍ່ພົບຫ້ອງ.",
      statusLocked: (status: string) =>
        `ບໍ່ສາມາດປ່ຽນສະຖານະຂອງຫ້ອງທີ່ ${status} ໄດ້.`,
      alreadyInStatus: (status: string) => `ຫ້ອງນີ້ຢູ່ໃນສະຖານະ ${status} ແລ້ວ.`,
      transitionNotAllowed: (from: string, to: string) =>
        `ບໍ່ອະນຸຍາດໃຫ້ປ່ຽນຈາກ "${from}" ເປັນ "${to}".`,
    },
    /** Success messages; one per allowed target status. */
    statusChangedToMaintenance: (roomNumber: string) =>
      `ຫ້ອງ ${roomNumber} ຖືກໝາຍເປັນ ສ້ອມແປງ ແລ້ວ.`,
    statusChangedToVacant: (roomNumber: string) =>
      `ຫ້ອງ ${roomNumber} ຖືກໝາຍເປັນ ຫວ່າງ ແລ້ວ.`,
    /**
     * Phase 5 room inventory (`app/(app)/rooms/**`). Lao has no plural forms,
     * so counts are interpolated directly into the sentence.
     */
    subtitle: (count: number) => `${count} ຫ້ອງໃນທຸກຊັ້ນ.`,
    /** Tenant slot of a card, row or drawer when nobody rents the room. */
    noTenant: "ບໍ່ມີຜູ້ເຊົ່າ",
    noTenantNotice: "ບໍ່ມີຜູ້ເຊົ່າ — ຫ້ອງນີ້ຍັງບໍ່ໄດ້ກຳນົດຜູ້ເຊົ່າ.",
    roomTitle: (roomNumber: string) => `ຫ້ອງ ${roomNumber}`,
    floorLabel: (floor: number) => `ຊັ້ນ ${floor}`,
    /** Opens the detail drawer; names the card / row that triggers it. */
    openDetailsAria: (roomNumber: string) => `ເບິ່ງລາຍລະອຽດຂອງຫ້ອງ ${roomNumber}`,
    closeDetailsAria: "ປິດລາຍລະອຽດຫ້ອງ",
    legendLabel: "ຄຳອະທິບາຍສະຖານະຫ້ອງ",
    viewModeLabel: "ຮູບແບບການສະແດງ",
    /** 5.2 grid ⇄ list toggle. */
    view: {
      grid: "ຕາຫນ່າງ",
      gridAria: "ມຸມມອງແບບຕາຫນ່າງ",
      list: "ລາຍການ",
      listAria: "ມຸມມອງແບບລາຍການ",
    },
    /** 5.4 filter chrome; the status labels themselves come from `ROOM_STATUS_LABELS`. */
    filters: {
      floorLabel: "ກອງຕາມຊັ້ນ",
      allFloors: "ທຸກຊັ້ນ",
      statusLabel: "ກອງຕາມສະຖານະ",
      allStatuses: "ທຸກສະຖານະ",
    },
    searchPlaceholder: "ຄົ້ນຫາເລກຫ້ອງ...",
    searchLabel: "ຄົ້ນຫາເລກຫ້ອງ",
    resultCount: (visible: number, total: number) => `${visible} ຈາກ ${total} ຫ້ອງ`,
    noMatches: "ບໍ່ມີຫ້ອງທີ່ກົງກັບຕົວກອງປັດຈຸບັນ.",
    /** `RoomType` (`types/index.ts`), shown on cards, rows and the drawer header. */
    types: {
      single: "ຫ້ອງດ່ຽວ",
      double: "ຫ້ອງຄູ່",
      studio: "ສະຕູດິໂອ",
      suite: "ຊຸດພັກ",
    },
    /** Field labels: table column headers, card captions and drawer rows. */
    fields: {
      number: "ເລກຫ້ອງ",
      floor: "ຊັ້ນ",
      type: "ປະເພດ",
      rate: "ຄ່າເຊົ່າ",
      tenant: "ຜູ້ເຊົ່າ",
      status: "ສະຖານະ",
      /** Rent unit printed after the `formatCurrency` amount. */
      perMonth: "/ ເດືອນ",
      name: "ຊື່",
      phone: "ເບີໂທ",
      email: "ອີເມວ",
      moveIn: "ວັນເຂົ້າພັກ",
      leaseEnds: "ສັນຍາສິ້ນສຸດ",
      deposit: "ເງິນມັດຈຳ",
      balance: "ຍອດຄ້າງຊຳລະ",
      monthlyRent: "ຄ່າເຊົ່າຕໍ່ເດືອນ",
      size: "ຂະໜາດ",
      /** Also reused as the meter-history column headers. */
      electricity: "ໄຟຟ້າ",
      water: "ນ້ຳ",
      period: "ໄລຍະ",
    },
    /** Drawer section headings. */
    sections: {
      tenant: "ຜູ້ເຊົ່າ",
      rentAndUtilities: "ຄ່າເຊົ່າ ແລະ ຄ່ານ້ຳ-ໄຟຟ້າ",
      amenities: "ສິ່ງອຳນວຍຄວາມສະດວກ",
      meterHistory: "ປະຫວັດການອ່ານມິເຕີ",
      note: "ໝາຍເຫດ",
      changeStatus: "ປ່ຽນສະຖານະ",
    },
    /** Drawer empty state for a room that has no meter readings yet. */
    noReadings: "ຍັງບໍ່ມີບັນທຶກການອ່ານມິເຕີຂອງຫ້ອງນີ້.",
    /** 5.7 status mutation controls; results come from `errors` / the success messages above. */
    actions: {
      updating: "ກຳລັງປ່ຽນສະຖານະ…",
      markAsMaintenance: "ໝາຍເປັນ ສ້ອມແປງ",
      markAsVacant: "ໝາຍເປັນ ຫວ່າງ",
      statusManagedByLease:
        "ຫ້ອງນີ້ຖືກເຊົ່າຢູ່. ການປ່ຽນສະຖານະຈັດການຜ່ານສັນຍາເຊົ່າ.",
      statusManagedByReservation:
        "ຫ້ອງນີ້ຖືກຈອງແລ້ວ. ການປ່ຽນສະຖານະຈັດການຜ່ານການຈອງ.",
    },
  },
  dashboard: {
    /**
     * Phase 4 overview (`app/(app)/dashboard/page.tsx`). Lao has no plural
     * forms, so counts are interpolated directly into the sentence (never a
     * separate singular/plural branch).
     *
     * The status words that already exist elsewhere are NOT repeated here:
     * `ROOM_STATUS_LABELS` / `INVOICE_STATUS_LABELS` (`lib/utils.ts`) and
     * `t.roles` are reused as-is. The browser-tab title reuses `t.nav.overview`.
     */
    /** `name` is the signed-in user's first name (data). */
    welcomeBack: (name: string) => `ຍິນດີຕ້ອນຮັບກັບມາ, ${name}`,
    /** `period` is Lao already (`formatPeriod`); the dash is a plain em dash. */
    snapshot: (period: string) =>
      `ພາບລວມຂອງ ${period} — ອັດຕາການເຂົ້າພັກ, ລາຍຮັບ, ກິດຈະກຳ ແລະ ທຸກຢ່າງທີ່ຕ້ອງດຳເນີນການ.`,
    /** 4.1 — metric card labels and their hint lines. */
    metrics: {
      totalRooms: "ຫ້ອງທັງໝົດ",
      /** Also used as the caption under the occupancy ring. */
      occupied: "ມີຜູ້ເຊົ່າ",
      vacant: "ຫວ່າງ",
      expectedRevenue: "ລາຍຮັບຄາດຫວັງຕໍ່ເດືອນ",
      occupancyHint: (percent: number) => `ອັດຕາການເຂົ້າພັກ ${percent}%`,
      activeTenantsHint: (count: number) =>
        `ຜູ້ເຊົ່າກຳລັງເຊົ່າ ${count} ຄົນ`,
      vacantHint: (reserved: number, inMaintenance: number) =>
        `${reserved} ຫ້ອງຈອງແລ້ວ · ${inMaintenance} ຫ້ອງກຳລັງສ້ອມແປງ`,
      /** Amounts arrive pre-formatted (`formatCurrency`, en-US grouping). */
      revenueHint: (collected: string, outstanding: string) =>
        `${collected} ເກັບໄດ້ · ${outstanding} ຄ້າງຊຳລະ`,
    },
    /** Revenue series names: delta chips (4.1) and chart legend (4.3). */
    expected: "ຄາດຫວັງ",
    collected: "ເກັບໄດ້",
    /** The "vs <previous period>" caption under each metric card. */
    deltaVs: (period: string) => `ທຽບກັບ ${period}`,
    /** 4.2 — stacked occupancy bars per floor plus the occupancy-rate ring. */
    occupancy: {
      byFloorTitle: "ອັດຕາການເຂົ້າພັກແຕ່ລະຊັ້ນ",
      byFloorSubtitle: (floors: number) =>
        `ສະຖານະຫ້ອງໃນທັງໝົດ ${floors} ຊັ້ນ.`,
      floorLabel: (floor: number) => `ຊັ້ນ ${floor}`,
      floorSummary: (occupied: number, total: number, percent: number) =>
        `${occupied}/${total} ມີຜູ້ເຊົ່າ · ${percent}%`,
      barAria: (
        floor: number,
        occupied: number,
        vacant: number,
        inMaintenance: number,
        reserved: number,
        total: number,
      ) =>
        `ຊັ້ນ ${floor}: ມີຜູ້ເຊົ່າ ${occupied}, ຫວ່າງ ${vacant}, ກຳລັງສ້ອມແປງ ${inMaintenance}, ຈອງແລ້ວ ${reserved} ຈາກທັງໝົດ ${total} ຫ້ອງ`,
      rateTitle: "ອັດຕາການເຂົ້າພັກ",
      rateAria: (percent: number, occupied: number, total: number) =>
        `ອັດຕາການເຂົ້າພັກ ${percent}% — ມີຜູ້ເຊົ່າ ${occupied} ຈາກທັງໝົດ ${total} ຫ້ອງ`,
      occupiedRooms: "ຫ້ອງທີ່ມີຜູ້ເຊົ່າ",
      occupiedOfTotal: (occupied: number, total: number) =>
        `${occupied} ໃນ ${total}`,
      activeTenants: "ຜູ້ເຊົ່າກຳລັງເຊົ່າ",
    },
    /** 4.3 — expected vs collected revenue for the charted periods. */
    revenue: {
      title: "ລາຍຮັບແຕ່ລະໄລຍະ",
      subtitle: (periods: number) =>
        `ຄາດຫວັງ ທຽບກັບ ເກັບໄດ້ ໃນ ${periods} ໄລຍະບິນຫຼ້າສຸດ.`,
      /** `period` and both amounts arrive already formatted. */
      barAria: (period: string, expected: string, collected: string) =>
        `${period}: ຄາດຫວັງ ${expected}, ເກັບໄດ້ ${collected}`,
    },
    /** 4.1/4.3 side card that describes where the numbers come from. */
    mockLayer: {
      title: "ຊັ້ນຂໍ້ມູນສາທິດ",
      unpaidInvoices: "ໃບແຈ້ງໜີ້ທີ່ຍັງບໍ່ໄດ້ຊຳລະ",
      openMaintenance: "ວຽກສ້ອມແປງທີ່ຍັງເປີດຢູ່",
      /** The value next to it comes from `t.roles`. */
      signedInAs: "ເຂົ້າສູ່ລະບົບໃນນາມ",
    },
    /** 4.4 — activity feed chrome. Entry text itself is mock data. */
    activity: {
      title: "ກິດຈະກຳຫຼ້າສຸດ",
      subtitle: (count: number) =>
        `ລາຍການຫຼ້າສຸດ ${count} ລາຍການ ຈາກບັນທຶກການດຳເນີນງານ.`,
    },
    /** 4.5 — the combined attention list. */
    needsAction: {
      title: "ຕ້ອງດຳເນີນການ",
      subtitle: "ໃບແຈ້ງໜີ້ເກີນກຳນົດ ແລະ ຫ້ອງທີ່ກຳລັງສ້ອມແປງ.",
      countAria: (count: number) =>
        `${count} ລາຍການທີ່ຕ້ອງດຳເນີນການ`,
      /** `room`, `period` and `due` arrive already formatted. */
      invoiceDetail: (room: string, period: string, due: string) =>
        `ຫ້ອງ ${room} · ${period} · ກຳນົດ ${due}`,
      roomTitle: (room: string) => `ຫ້ອງ ${room}`,
      roomMeta: (floor: number) => `ຊັ້ນ ${floor}`,
      noNote: "ບໍ່ມີໝາຍເຫດ.",
    },
    /** 4.6 — one message per section whose mock collection is empty. */
    empty: {
      noRooms: "ຍັງບໍ່ມີຂໍ້ມູນຫ້ອງ.",
      noRevenueHistory: "ຍັງບໍ່ມີປະຫວັດລາຍຮັບ.",
      noActivity: "ຍັງບໍ່ມີກິດຈະກຳ.",
      noActionItems: "ຕອນນີ້ບໍ່ມີລາຍການທີ່ຕ້ອງດຳເນີນການ.",
    },
    /** Screen-reader-only copy for the cards and charts above. */
    aria: {
      deltaJoiner: " ແລະ ",
      card: (
        label: string,
        value: string,
        hint: string,
        changes: string,
        comparisonPeriod: string,
      ) => `${label}: ${value} (${hint}). ${changes} ທຽບກັບ ${comparisonPeriod}.`,
    },



  },
  /**
   * Phase 6 tenant table (`app/(app)/tenants/page.tsx`). Lao has no plural forms,
   * so counts are interpolated directly into the sentence.
   */
  tenants: {
    /** `count` is the total number of tenant records. */
    subtitle: (count: number) => `${count} ຜູ້ເຊົ່າທັງໝົດ.`,
    /** Shown in the room column when a tenant has no room assigned yet. */
    noRoom: "ຍັງບໍ່ມີຫ້ອງ",
    /** Table column headers. */
    fields: {
      tenant: "ຜູ້ເຊົ່າ",
      room: "ຫ້ອງ",
      moveIn: "ວັນເຂົ້າພັກ",
      leaseEnd: "ສັນຍາສິ້ນສຸດ",
      balance: "ຍອດຄ້າງຊຳລະ",
      status: "ສະຖານະ",
    },
    /** 6.2 — search box (matches name, email, phone and room number). */
    searchPlaceholder: "ຄົ້ນຫາຜູ້ເຊົ່າ...",
    searchLabel: "ຄົ້ນຫາຜູ້ເຊົ່າ",
    /** 6.2 — status filter segmented control. */
    filters: {
      statusLabel: "ກອງຕາມສະຖານະ",
      all: "ທັງໝົດ",
    },
    /** 6.2 — result readout and the zero-result message. */
    resultCount: (visible: number, total: number) => `${visible} ຈາກ ${total} ຜູ້ເຊົ່າ`,
    noMatches: "ບໍ່ມີຜູ້ເຊົ່າທີ່ກົງກັບການຄົ້ນຫາ.",
    /** 6.2 — screen-reader copy for the sortable column headers. */
    sort: {
      ascending: "ຈັດແຖບຈາກນ້ອຍໄປຫາໃຫຍ່",
      descending: "ຈັດແຖບຈາກໃຫຍ່ໄປຫານ້ອຍ",
    },
    /** 6.3 — profile drawer: screen-reader copy for row trigger and close. */
    profile: {
      openDetailsAria: (name: string) => `ເບິ່ງລາຍລະອຽດຂອງຜູ້ເຊົ່າ ${name}`,
      closeDetailsAria: "ປິດລາຍລະອຽດຜູ້ເຊົ່າ",
      /** Drawer section headings. */
      sections: {
        contact: "ຂໍ້ມູນຕິດຕໍ່",
        room: "ຂໍ້ມູນຫ້ອງ",
        lease: "ຂໍ້ມູນສັນຍາ",
        emergency: "ຜູ້ຕິດຕໍ່ສຸກເສີນ",
        invoices: "ປະຫວັດບິນ",
      },
      /** Drawer field labels (the table keeps its own `fields` as headers). */
      fields: {
        email: "ອີເມວ",
        phone: "ເບີໂທ",
        idCard: "ເລກບັດປະຊາຊົນ",
        monthlyRate: "ຄ່າເຊົ່າຕໍ່ເດືອນ",
        deposit: "ເງິນມັດຈຳ",
        occupation: "ອາຊີບ",
        contactName: "ຊື່",
        relationship: "ຄວາມສຳພັນ",
        period: "ໄລຍະ",
        amount: "ຍອດເງິນ",
      },
      /** Ledger message when this tenant has no invoices yet. */
      noInvoices: "ຍັງບໍ່ມີບິນສຳລັບຜູ້ເຊົ່າຄົນນີ້.",
      /** 6.4 — lease progress bar and the "expiring soon" / ended highlights. */
      leaseProgress: {
        label: "ຄວາມຄືບໜ້າຂອງສັນຍາ",
        expiringSoon: (days: number) =>
          days > 0
            ? `ສັນຍາຈະສິ້ນສຸດໃນ ${days} ວັນ`
            : "ສັນຍາຈະສິ້ນສຸດມື້ນີ້",
        leaseEnded: "ສັນຍາໄດ້ສິ້ນສຸດແລ້ວ",
        noActiveLease: "ບໍ່ມີສັນຍາທີ່ກຳລັງມີຜົນບັງຄັບໃຊ້ຢູ່",
      },
    },
    /** 6.5 — cancel button shared by the add-tenant and edit-contact forms. */
    cancel: "ຍົກເລີກ",
    /** 6.5 — "add tenant" trigger + expandable form above the table. */
    add: {
      trigger: "ເພີ່ມຜູ້ເຊົ່າ",
      title: "ເພີ່ມຜູ້ເຊົ່າໃໝ່",
      /** The only field label not already covered by `profile.fields`. */
      fullName: "ຊື່ເຕັມ",
      submit: "ບັນທຶກຜູ້ເຊົ່າ",
      saving: "ກຳລັງບັນທຶກ…",
      success: (name: string) => `ເພີ່ມຜູ້ເຊົ່າ ${name} ແລ້ວ.`,
    },
    /** 6.5 — "edit contact" form inside the 6.3 profile drawer. */
    editContact: {
      trigger: "ດັດແກ້ຂໍ້ມູນຕິດຕໍ່",
      submit: "ບັນທຶກ",
      saving: "ກຳລັງບັນທຶກ…",
      success: (name: string) => `ບັນທຶກຂໍ້ມູນຕິດຕໍ່ຂອງ ${name} ແລ້ວ.`,
    },
    /** 6.5 — server-side validation + data-layer errors for both mutations. */
    errors: {
      fullNameRequired: "ກະລຸນາປ້ອນຊື່ເຕັມ.",
      emailRequired: "ກະລຸນາປ້ອນອີເມວ.",
      emailInvalid: "ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ.",
      phoneRequired: "ກະລຸນາປ້ອນເບີໂທ.",
      idCardRequired: "ກະລຸນາປ້ອນເລກບັດປະຊາຊົນ.",
      occupationRequired: "ກະລຸນາປ້ອນອາຊີບ.",
      emergencyNameRequired: "ກະລຸນາປ້ອນຊື່ຜູ້ຕິດຕໍ່ສຸກເສີນ.",
      emergencyRelationshipRequired:
        "ກະລຸນາປ້ອນຄວາມສຳພັນຂອງຜູ້ຕິດຕໍ່ສຸກເສີນ.",
      emergencyPhoneRequired: "ກະລຸນາປ້ອນເບີໂທຜູ້ຕິດຕໍ່ສຸກເສີນ.",
      tenantIdRequired: "ຕ້ອງມີລະຫັດຜູ້ເຊົ່າ.",
      tenantNotFound: "ບໍ່ພົບຜູ້ເຊົ່າ.",
      roomNotFound: "ບໍ່ພົບຫ້ອງ.",
      roomNotVacant: (roomNumber: string) => `ຫ້ອງ ${roomNumber} ບໍ່ວ່າງ.`,
      checkOutRequiresActive:
        "ມີແຕ່ຜູ້ເຊົ່າທີ່ກຳລັງເຊົ່າເທົ່ານັ້ນທີ່ເຊັກເອົາອອກໄດ້.",
      checkOutRequiresRoom:
        "ຜູ້ເຊົ່ານີ້ຍັງບໍ່ມີຫ້ອງ, ຈຶ່ງເຊັກເອົາອອກບໍ່ໄດ້.",
      roomNotOccupied: (roomNumber: string) =>
        `ຫ້ອງ ${roomNumber} ບໍ່ແມ່ນຫ້ອງທີ່ມີຜູ້ເຊົ່າຢູ່.`,
    },
    /** 6.5 — check-out: destructive, confirmation required, two records move. */
    checkOut: {
      sectionTitle: "ການເຊັກເອົາອອກ",
      hint: "ການເຊັກເອົາອອກຈະປ່ອຍຫ້ອງນີ້ວ່າງ ແລະປ່ຽນສະຖານະຜູ້ເຊົ່າເປັນ ຢຸດເຊົ່າ.",
      trigger: "ເຊັກເອົາອອກ",
      confirmPrompt: (name: string) =>
        `ທ່ານແນ່ໃຈບໍ່ວ່າຈະເຊັກ ${name} ອອກ? ການກະທຳນີ້ຈະປ່ອຍຫ້ອງວ່າງ ແລະບໍ່ສາມາດຍົກເລີກໄດ້.`,
      confirm: "ແນ່ໃຈ, ເຊັກເອົາອອກ",
      saving: "ກຳລັງດຳເນີນການ…",
      success: (name: string, roomNumber: string) =>
        `ເຊັກ ${name} ອອກແລ້ວ — ຫ້ອງ ${roomNumber} ກັບເປັນຫ້ອງວ່າງແລ້ວ.`,
    },
    /** 6.6 — per-row overflow (kebab) menu. */
    rowMenu: {
      /** sr-only header for the action column. */
      actions: "ການກະທຳ",
      triggerLabel: (name: string) => `ການກະທຳຂອງ ${name}`,
      viewProfile: "ເບິ່ງໂປຣໄຟລ໌",
    },
  },
  billing: {
    /** Label for the billing-period selector. */
    periodLabel: "ໄລຍະບິນ",
    /** Summary cards shown for the selected period. */
    cards: {
      billed: "ຍອດອອກບິນ",
      collected: "ເກັບໄດ້",
      outstanding: "ຄ້າງຊຳລະ",
      rates: "ອັດຕາຄ່າໄຟຟ້າ ແລະ ນ້ຳ",
    },
    /** Period navigation labels (previous / next). */
    periodNav: {
      previous: "ເດືອນກ່ອນ",
      next: "ເດືອນຖັດໄປ",
    },
    /** Note displayed below the cards for features still to be built. */
    note: "ການຈົດມິເຕີ, ການອອກໃບແຈ້ງໜີ້, ລາຍການໃບແຈ້ງໜີ້ ແລະ ການບັນທຶກການຊຳລະ ຈະມາໃນຂັ້ນຕອນຕໍ່ໄປ.",
    /** `count` is the number of meter readings recorded for the selected period. */
    readingsCount: (count: number) => `ຈົດມິເຕີແລ້ວ ${count} ລາຍການໃນໄລຍະນີ້.`,
  },
} as const;

export type TranslationCatalog = typeof lo;
