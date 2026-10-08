/**
 * Mock data layer for the Dormitory Management System.
 *
 * Single source of truth for every screen until the real backend exists.
 *
 * Design notes
 *  - Every exported function is `async` and goes through `respond()`, so the UI
 *    already handles promises, latency and cloning exactly like it will with
 *    `fetch()`. Swapping in the backend means re-implementing this file only.
 *  - Data is returned as deep clones, so callers can never mutate the seed data
 *    by accident.
 *  - Staff passwords are plaintext on purpose (mock only). Real auth replaces
 *    `authenticateAdmin` without touching the UI.
 *  - The seed dataset is pinned to `CURRENT_PERIOD` (2026-09) so metrics,
 *    invoices and meter readings stay consistent no matter when the app runs.
 */

import type {
  Activity,
  AdminUser,
  BillingPeriod,
  DashboardMetrics,
  EmergencyContact,
  FloorOccupancy,
  Invoice,
  InvoiceFilters,
  InvoiceStatus,
  MockCredential,
  RevenuePoint,
  Room,
  RoomFilters,
  Tenant,
  TenantFilters,
  UtilityReading,
} from "@/types";
import { formatPeriodShort } from "@/lib/utils";

/** Simulated network latency so loading states behave realistically. */
const MOCK_LATENCY_MS = 180;

/**
 * Two years of "network" behaviour in one helper: wait, then hand back a
 * defensive deep copy of the seed data.
 */
async function respond<T>(value: T): Promise<T> {
  if (MOCK_LATENCY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  }
  return structuredClone(value);
}

/** Billing period every screen defaults to. */
export const CURRENT_PERIOD: BillingPeriod = "2026-09";

/** Surfaced on the login screen as demo credentials. */
export const STAFF_ACCOUNTS: MockCredential[] = [
  {
    email: "admin@dormhub.com",
    password: "admin123",
    user: {
      id: "USR-001",
      name: "Alex Morgan",
      email: "admin@dormhub.com",
      phone: "+1-202-555-0100",
      role: "admin",
      avatarClass: "bg-indigo-500",
    },
  },
  {
    email: "manager@dormhub.com",
    password: "manager123",
    user: {
      id: "USR-002",
      name: "Nora Bennett",
      email: "manager@dormhub.com",
      phone: "+1-202-555-0111",
      role: "manager",
      avatarClass: "bg-emerald-500",
    },
  },
  {
    email: "staff@dormhub.com",
    password: "staff123",
    user: {
      id: "USR-003",
      name: "Idris Khan",
      email: "staff@dormhub.com",
      phone: "+1-202-555-0122",
      role: "staff",
      avatarClass: "bg-amber-500",
    },
  },
];

/** Utility pricing used to turn meter deltas into money. */
export const UTILITY_RATES = {
  electricPerKwh: 0.18,
  waterPerCubicMeter: 3.2,
};

const BASIC_AMENITIES = [
  "Air conditioning",
  "Private bathroom",
  "Study desk",
  "Wi-Fi",
];
const KITCHEN_AMENITIES = [...BASIC_AMENITIES, "Kitchenette"];
const SUITE_AMENITIES = [...KITCHEN_AMENITIES, "Balcony", "Living area"];

/**
 * Collections that support mutations are kept on globalThis so mock writes
 * survive module re-evaluations across Server Action invocations and
 * subsequent page renders.
 */
declare global {
  var __dms_mock_rooms: Room[] | undefined;
  var __dms_mock_tenants: Tenant[] | undefined;
  var __dms_mock_utility_readings: UtilityReading[] | undefined;
}

const SEED_ROOMS: Room[] = [
  { id: "ROOM-101", number: "101", floor: 1, type: "single", status: "occupied", monthlyRate: 320, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: "TEN-001", note: null },
  { id: "ROOM-102", number: "102", floor: 1, type: "double", status: "occupied", monthlyRate: 420, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: "TEN-002", note: null },
  { id: "ROOM-103", number: "103", floor: 1, type: "single", status: "vacant", monthlyRate: 320, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: null, note: null },
  { id: "ROOM-104", number: "104", floor: 1, type: "studio", status: "occupied", monthlyRate: 480, sizeSqm: 28, amenities: KITCHEN_AMENITIES, tenantId: "TEN-003", note: null },
  { id: "ROOM-105", number: "105", floor: 1, type: "single", status: "maintenance", monthlyRate: 320, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: null, note: "AC unit replacement scheduled for 2026-09-22." },
  { id: "ROOM-106", number: "106", floor: 1, type: "double", status: "reserved", monthlyRate: 420, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: null, note: "Held for the October exchange-student intake." },
  { id: "ROOM-201", number: "201", floor: 2, type: "single", status: "occupied", monthlyRate: 330, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: "TEN-004", note: null },
  { id: "ROOM-202", number: "202", floor: 2, type: "double", status: "occupied", monthlyRate: 430, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: "TEN-005", note: null },
  { id: "ROOM-203", number: "203", floor: 2, type: "suite", status: "occupied", monthlyRate: 620, sizeSqm: 36, amenities: SUITE_AMENITIES, tenantId: "TEN-006", note: null },
  { id: "ROOM-204", number: "204", floor: 2, type: "single", status: "vacant", monthlyRate: 330, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: null, note: null },
  { id: "ROOM-205", number: "205", floor: 2, type: "double", status: "occupied", monthlyRate: 430, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: "TEN-007", note: null },
  { id: "ROOM-206", number: "206", floor: 2, type: "studio", status: "vacant", monthlyRate: 490, sizeSqm: 28, amenities: KITCHEN_AMENITIES, tenantId: null, note: null },
  { id: "ROOM-301", number: "301", floor: 3, type: "single", status: "occupied", monthlyRate: 340, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: "TEN-008", note: null },
  { id: "ROOM-302", number: "302", floor: 3, type: "double", status: "vacant", monthlyRate: 440, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: null, note: null },
  { id: "ROOM-303", number: "303", floor: 3, type: "studio", status: "occupied", monthlyRate: 500, sizeSqm: 28, amenities: KITCHEN_AMENITIES, tenantId: "TEN-009", note: null },
  { id: "ROOM-304", number: "304", floor: 3, type: "double", status: "occupied", monthlyRate: 440, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: "TEN-010", note: null },
  { id: "ROOM-305", number: "305", floor: 3, type: "single", status: "maintenance", monthlyRate: 340, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: null, note: "Water leak repair in progress." },
  { id: "ROOM-306", number: "306", floor: 3, type: "suite", status: "occupied", monthlyRate: 640, sizeSqm: 36, amenities: SUITE_AMENITIES, tenantId: "TEN-011", note: null },
  { id: "ROOM-401", number: "401", floor: 4, type: "double", status: "vacant", monthlyRate: 450, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: null, note: null },
  { id: "ROOM-402", number: "402", floor: 4, type: "studio", status: "reserved", monthlyRate: 510, sizeSqm: 28, amenities: KITCHEN_AMENITIES, tenantId: null, note: "Reserved for staff onboarding in October." },
  { id: "ROOM-403", number: "403", floor: 4, type: "single", status: "occupied", monthlyRate: 350, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: "TEN-012", note: null },
  { id: "ROOM-404", number: "404", floor: 4, type: "single", status: "vacant", monthlyRate: 350, sizeSqm: 18, amenities: BASIC_AMENITIES, tenantId: null, note: null },
  { id: "ROOM-405", number: "405", floor: 4, type: "double", status: "occupied", monthlyRate: 450, sizeSqm: 24, amenities: BASIC_AMENITIES, tenantId: "TEN-013", note: null },
  { id: "ROOM-406", number: "406", floor: 4, type: "studio", status: "maintenance", monthlyRate: 510, sizeSqm: 28, amenities: KITCHEN_AMENITIES, tenantId: null, note: "Repainting after the August check-out." },
];

const ROOMS: Room[] = (globalThis.__dms_mock_rooms ??= structuredClone(SEED_ROOMS));

/**
 * Tenants. `roomId` matches the room they rent; TEN-014 is a pending applicant
 * without a room yet, which keeps the "pending" empty-ish state exercised.
 */
const SEED_TENANTS: Tenant[] = [
  {
    id: "TEN-001",
    fullName: "Amara Okafor",
    email: "amara.okafor@example.com",
    phone: "+1-202-555-0142",
    idCard: "8842-1902-3310",
    roomId: "ROOM-101",
    moveInDate: "2025-09-01",
    leaseEndDate: "2027-01-31",
    status: "active",
    balance: 0,
    deposit: 320,
    occupation: "Graduate student",
    emergencyContact: { name: "Chidi Okafor", relationship: "Father", phone: "+1-202-555-0143" },
  },
  {
    id: "TEN-002",
    fullName: "Daniel Rivera",
    email: "daniel.rivera@example.com",
    phone: "+1-202-555-0155",
    idCard: "7719-4408-1120",
    roomId: "ROOM-102",
    moveInDate: "2026-02-15",
    leaseEndDate: "2027-02-14",
    status: "active",
    balance: 0,
    deposit: 420,
    occupation: "Software engineer",
    emergencyContact: { name: "Elena Rivera", relationship: "Sister", phone: "+1-202-555-0156" },
  },
  {
    id: "TEN-003",
    fullName: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "+1-202-555-0168",
    idCard: "5521-8830-4471",
    roomId: "ROOM-104",
    moveInDate: "2026-03-01",
    leaseEndDate: "2026-10-31",
    status: "active",
    balance: 210,
    deposit: 480,
    occupation: "Research assistant",
    emergencyContact: { name: "Rohan Nair", relationship: "Brother", phone: "+1-202-555-0169" },
  },
  {
    id: "TEN-004", fullName: "Chen Wei", email: "chen.wei@example.com", phone: "+1-202-555-0170",
    idCard: "3390-1122-8876", roomId: "ROOM-201", moveInDate: "2025-08-20", leaseEndDate: "2026-12-20",
    status: "active", balance: 0, deposit: 330, occupation: "PhD candidate",
    emergencyContact: { name: "Lin Wei", relationship: "Mother", phone: "+1-202-555-0171" },
  },
  {
    id: "TEN-005", fullName: "Fatima Zahra", email: "fatima.zahra@example.com", phone: "+1-202-555-0182",
    idCard: "9921-3320-1145", roomId: "ROOM-202", moveInDate: "2026-01-10", leaseEndDate: "2027-01-09",
    status: "active", balance: 0, deposit: 430, occupation: "Nurse",
    emergencyContact: { name: "Youssef Zahra", relationship: "Husband", phone: "+1-202-555-0183" },
  },
  {
    id: "TEN-006", fullName: "Mark Osei", email: "mark.osei@example.com", phone: "+1-202-555-0194",
    idCard: "4467-8891-2233", roomId: "ROOM-203", moveInDate: "2025-12-01", leaseEndDate: "2026-11-30",
    status: "active", balance: 480, deposit: 620, occupation: "Lecturer",
    emergencyContact: { name: "Akosua Osei", relationship: "Sister", phone: "+1-202-555-0195" },
  },
  {
    id: "TEN-007", fullName: "Lucia Fernandez", email: "lucia.fernandez@example.com", phone: "+1-202-555-0206",
    idCard: "6634-2210-9908", roomId: "ROOM-205", moveInDate: "2026-04-05", leaseEndDate: "2027-04-04",
    status: "active", balance: 0, deposit: 430, occupation: "UX designer",
    emergencyContact: { name: "Diego Fernandez", relationship: "Father", phone: "+1-202-555-0207" },
  },
  {
    id: "TEN-008", fullName: "Jonas Meyer", email: "jonas.meyer@example.com", phone: "+1-202-555-0218",
    idCard: "1145-7788-3390", roomId: "ROOM-301", moveInDate: "2026-05-01", leaseEndDate: "2026-10-15",
    status: "active", balance: 120, deposit: 340, occupation: "Exchange student",
    emergencyContact: { name: "Heike Meyer", relationship: "Mother", phone: "+1-202-555-0219" },
  },
  {
    id: "TEN-009", fullName: "Aisha Rahman", email: "aisha.rahman@example.com", phone: "+1-202-555-0230",
    idCard: "2278-6641-0099", roomId: "ROOM-303", moveInDate: "2025-10-01", leaseEndDate: "2026-09-30",
    status: "active", balance: 0, deposit: 500, occupation: "Data analyst",
    emergencyContact: { name: "Imran Rahman", relationship: "Brother", phone: "+1-202-555-0231" },
  },
  {
    id: "TEN-010", fullName: "Tomás Silva", email: "tomas.silva@example.com", phone: "+1-202-555-0242",
    idCard: "8807-4123-6678", roomId: "ROOM-304", moveInDate: "2026-06-15", leaseEndDate: "2027-06-14",
    status: "active", balance: 0, deposit: 440, occupation: "Lab technician",
    emergencyContact: { name: "Beatriz Silva", relationship: "Mother", phone: "+1-202-555-0243" },
  },
  {
    id: "TEN-011", fullName: "Grace Kimani", email: "grace.kimani@example.com", phone: "+1-202-555-0254",
    idCard: "5512-9987-3341", roomId: "ROOM-306", moveInDate: "2025-11-11", leaseEndDate: "2026-11-10",
    status: "active", balance: 650, deposit: 640, occupation: "Doctor (resident)",
    emergencyContact: { name: "Peter Kimani", relationship: "Father", phone: "+1-202-555-0255" },
  },
  {
    id: "TEN-012", fullName: "Omar Haddad", email: "omar.haddad@example.com", phone: "+1-202-555-0266",
    idCard: "7734-5561-9922", roomId: "ROOM-403", moveInDate: "2026-07-01", leaseEndDate: "2027-06-30",
    status: "active", balance: 0, deposit: 350, occupation: "Accountant",
    emergencyContact: { name: "Layla Haddad", relationship: "Wife", phone: "+1-202-555-0267" },
  },
  {
    id: "TEN-013", fullName: "Sofia Petrova", email: "sofia.petrova@example.com", phone: "+1-202-555-0278",
    idCard: "1189-3345-7760", roomId: "ROOM-405", moveInDate: "2026-08-01", leaseEndDate: "2027-07-31",
    status: "active", balance: 986, deposit: 450, occupation: "Physiotherapist",
    emergencyContact: { name: "Nikolai Petrov", relationship: "Father", phone: "+1-202-555-0279" },
  },
  {
    id: "TEN-014", fullName: "Ravi Sharma", email: "ravi.sharma@example.com", phone: "+1-202-555-0290",
    idCard: "2298-6673-1104", roomId: null, moveInDate: "2026-10-01", leaseEndDate: "2027-09-30",
    status: "pending", balance: 0, deposit: 0, occupation: "Undergraduate student",
    emergencyContact: { name: "Meera Sharma", relationship: "Mother", phone: "+1-202-555-0291" },
  },
];

const TENANTS: Tenant[] = (globalThis.__dms_mock_tenants ??= structuredClone(SEED_TENANTS));

/**
 * Meter readings. September holds the full round, August is kept so the room
 * detail view can show a history row.
 */
const SEED_UTILITY_READINGS: UtilityReading[] = [
  { id: "RDG-101-2026-09", roomId: "ROOM-101", period: "2026-09", electricPrevious: 1240, electricCurrent: 1318, waterPrevious: 96, waterCurrent: 101, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-05T09:15:00" },
  { id: "RDG-102-2026-09", roomId: "ROOM-102", period: "2026-09", electricPrevious: 1580, electricCurrent: 1675, waterPrevious: 118, waterCurrent: 125, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-05T09:25:00" },
  { id: "RDG-104-2026-09", roomId: "ROOM-104", period: "2026-09", electricPrevious: 2010, electricCurrent: 2119, waterPrevious: 140, waterCurrent: 148, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-05T09:40:00" },
  { id: "RDG-201-2026-09", roomId: "ROOM-201", period: "2026-09", electricPrevious: 1130, electricCurrent: 1195, waterPrevious: 88, waterCurrent: 94, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-05T10:05:00" },
  { id: "RDG-203-2026-09", roomId: "ROOM-203", period: "2026-09", electricPrevious: 3420, electricCurrent: 3540, waterPrevious: 205, waterCurrent: 214, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-05T10:20:00" },
  { id: "RDG-301-2026-09", roomId: "ROOM-301", period: "2026-09", electricPrevious: 980, electricCurrent: 1037, waterPrevious: 74, waterCurrent: 80, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-06T08:50:00" },
  { id: "RDG-303-2026-09", roomId: "ROOM-303", period: "2026-09", electricPrevious: 2240, electricCurrent: 2333, waterPrevious: 152, waterCurrent: 160, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-06T09:10:00" },
  { id: "RDG-306-2026-09", roomId: "ROOM-306", period: "2026-09", electricPrevious: 4100, electricCurrent: 4238, waterPrevious: 246, waterCurrent: 256, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-06T09:30:00" },
  { id: "RDG-403-2026-09", roomId: "ROOM-403", period: "2026-09", electricPrevious: 720, electricCurrent: 771, waterPrevious: 58, waterCurrent: 63, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-06T10:00:00" },
  { id: "RDG-405-2026-09", roomId: "ROOM-405", period: "2026-09", electricPrevious: 640, electricCurrent: 689, waterPrevious: 51, waterCurrent: 57, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-09-06T10:15:00" },
  { id: "RDG-101-2026-08", roomId: "ROOM-101", period: "2026-08", electricPrevious: 1150, electricCurrent: 1240, waterPrevious: 90, waterCurrent: 96, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-08-05T09:10:00" },
  { id: "RDG-102-2026-08", roomId: "ROOM-102", period: "2026-08", electricPrevious: 1480, electricCurrent: 1580, waterPrevious: 110, waterCurrent: 118, electricRate: UTILITY_RATES.electricPerKwh, waterRate: UTILITY_RATES.waterPerCubicMeter, recordedAt: "2026-08-05T09:20:00" },
];

const UTILITY_READINGS: UtilityReading[] = (globalThis.__dms_mock_utility_readings ??= structuredClone(SEED_UTILITY_READINGS));

/**
 * Invoice builder. Totals and status are derived from the fees so the numbers
 * can never drift apart. `overdue` is the only status that depends on the
 * clock: an unpaid invoice becomes overdue once its due date has passed, which
 * is also how the real backend is expected to behave.
 *
 * Tenant balances in `TENANTS` mirror the outstanding amount of this ledger.
 */
function buildInvoice(input: {
  sequence: number;
  tenantId: string;
  roomId: string;
  period: BillingPeriod;
  roomFee: number;
  electricFee: number;
  waterFee: number;
  otherFee?: number;
  paidAmount?: number;
  issuedDate: string;
  dueDate: string;
}): Invoice {
  const otherFee = input.otherFee ?? 0;
  const total = input.roomFee + input.electricFee + input.waterFee + otherFee;
  const paidAmount = input.paidAmount ?? 0;

  const status: InvoiceStatus =
    paidAmount >= total
      ? "paid"
      : paidAmount > 0
        ? "partial"
        : new Date(input.dueDate).getTime() < Date.now()
          ? "overdue"
          : "unpaid";

  const number = `INV-${input.period.replace("-", "")}-${String(input.sequence).padStart(3, "0")}`;

  return {
    id: number,
    invoiceNumber: number,
    tenantId: input.tenantId,
    roomId: input.roomId,
    period: input.period,
    issuedDate: input.issuedDate,
    dueDate: input.dueDate,
    roomFee: input.roomFee,
    electricFee: input.electricFee,
    waterFee: input.waterFee,
    otherFee,
    total,
    paidAmount,
    status,
  };
}

const INVOICES: Invoice[] = [
  buildInvoice({ sequence: 1, tenantId: "TEN-001", roomId: "ROOM-101", period: "2026-09", roomFee: 320, electricFee: 26, waterFee: 19, paidAmount: 365, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 2, tenantId: "TEN-002", roomId: "ROOM-102", period: "2026-09", roomFee: 420, electricFee: 31, waterFee: 22, paidAmount: 473, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 3, tenantId: "TEN-003", roomId: "ROOM-104", period: "2026-09", roomFee: 480, electricFee: 38, waterFee: 26, paidAmount: 334, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 4, tenantId: "TEN-004", roomId: "ROOM-201", period: "2026-09", roomFee: 330, electricFee: 24, waterFee: 18, paidAmount: 372, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 5, tenantId: "TEN-005", roomId: "ROOM-202", period: "2026-09", roomFee: 430, electricFee: 29, waterFee: 21, paidAmount: 480, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 6, tenantId: "TEN-006", roomId: "ROOM-203", period: "2026-09", roomFee: 620, electricFee: 44, waterFee: 30, paidAmount: 214, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 7, tenantId: "TEN-007", roomId: "ROOM-205", period: "2026-09", roomFee: 430, electricFee: 28, waterFee: 20, paidAmount: 478, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 8, tenantId: "TEN-008", roomId: "ROOM-301", period: "2026-09", roomFee: 340, electricFee: 22, waterFee: 17, paidAmount: 259, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 9, tenantId: "TEN-009", roomId: "ROOM-303", period: "2026-09", roomFee: 500, electricFee: 33, waterFee: 24, paidAmount: 557, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 10, tenantId: "TEN-010", roomId: "ROOM-304", period: "2026-09", roomFee: 440, electricFee: 27, waterFee: 19, paidAmount: 486, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 11, tenantId: "TEN-011", roomId: "ROOM-306", period: "2026-09", roomFee: 640, electricFee: 46, waterFee: 32, paidAmount: 68, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 12, tenantId: "TEN-012", roomId: "ROOM-403", period: "2026-09", roomFee: 350, electricFee: 19, waterFee: 15, paidAmount: 384, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 13, tenantId: "TEN-013", roomId: "ROOM-405", period: "2026-09", roomFee: 450, electricFee: 25, waterFee: 18, otherFee: 0, paidAmount: 0, issuedDate: "2026-09-01", dueDate: "2026-09-30" }),
  buildInvoice({ sequence: 14, tenantId: "TEN-003", roomId: "ROOM-104", period: "2026-08", roomFee: 480, electricFee: 41, waterFee: 28, paidAmount: 549, issuedDate: "2026-08-01", dueDate: "2026-08-31" }),
  buildInvoice({ sequence: 15, tenantId: "TEN-006", roomId: "ROOM-203", period: "2026-08", roomFee: 620, electricFee: 47, waterFee: 31, paidAmount: 698, issuedDate: "2026-08-01", dueDate: "2026-08-31" }),
  buildInvoice({ sequence: 16, tenantId: "TEN-009", roomId: "ROOM-303", period: "2026-08", roomFee: 500, electricFee: 35, waterFee: 25, paidAmount: 560, issuedDate: "2026-08-01", dueDate: "2026-08-31" }),
  buildInvoice({ sequence: 17, tenantId: "TEN-011", roomId: "ROOM-306", period: "2026-08", roomFee: 640, electricFee: 50, waterFee: 33, paidAmount: 723, issuedDate: "2026-08-01", dueDate: "2026-08-31" }),
  buildInvoice({ sequence: 18, tenantId: "TEN-013", roomId: "ROOM-405", period: "2026-08", roomFee: 450, electricFee: 25, waterFee: 18, paidAmount: 0, issuedDate: "2026-08-01", dueDate: "2026-08-31" }),
  buildInvoice({ sequence: 19, tenantId: "TEN-001", roomId: "ROOM-101", period: "2026-07", roomFee: 320, electricFee: 27, waterFee: 18, paidAmount: 365, issuedDate: "2026-07-01", dueDate: "2026-07-31" }),
  buildInvoice({ sequence: 20, tenantId: "TEN-006", roomId: "ROOM-203", period: "2026-07", roomFee: 620, electricFee: 45, waterFee: 29, paidAmount: 694, issuedDate: "2026-07-01", dueDate: "2026-07-31" }),
  buildInvoice({ sequence: 21, tenantId: "TEN-011", roomId: "ROOM-306", period: "2026-07", roomFee: 640, electricFee: 48, waterFee: 30, paidAmount: 718, issuedDate: "2026-07-01", dueDate: "2026-07-31" }),
];

/** Activity feed, newest first. Timestamps are close to `CURRENT_PERIOD`. */
const ACTIVITIES: Activity[] = [
  { id: "ACT-009", type: "payment", message: "Amara Okafor settled INV-202609-001 in full ($365).", timestamp: "2026-09-16T08:42:00", actor: "Alex Morgan" },
  { id: "ACT-008", type: "meter", message: "September electric and water readings recorded for 10 occupied rooms.", timestamp: "2026-09-16T08:05:00", actor: "Idris Khan" },
  { id: "ACT-007", type: "maintenance", message: "Room 305 moved to maintenance — water leak repair in progress.", timestamp: "2026-09-15T16:20:00", actor: "Nora Bennett" },
  { id: "ACT-006", type: "invoice", message: "13 invoices issued for September, totalling $6,423.", timestamp: "2026-09-13T09:00:00", actor: "Nora Bennett" },
  { id: "ACT-005", type: "payment", message: "Grace Kimani made a partial payment of $68 on INV-202609-011.", timestamp: "2026-09-12T14:35:00", actor: "Idris Khan" },
  { id: "ACT-004", type: "invoice", message: "Overdue notice sent to Sofia Petrova for INV-202608-018.", timestamp: "2026-09-10T11:15:00", actor: "Alex Morgan" },
  { id: "ACT-003", type: "move-in", message: "Ravi Sharma confirmed for room 106 starting 2026-10-01.", timestamp: "2026-09-09T10:30:00", actor: "Nora Bennett" },
  { id: "ACT-002", type: "move-out", message: "Room 406 check-out completed at the end of the August lease.", timestamp: "2026-09-02T17:10:00", actor: "Nora Bennett" },
];

/** Six periods of revenue history for the dashboard chart. */
const revenuePoint = (
  period: BillingPeriod,
  expected: number,
  collected: number,
): RevenuePoint => ({
  period,
  label: formatPeriodShort(period),
  expected,
  collected,
});

const REVENUE_TREND: RevenuePoint[] = [
  revenuePoint("2026-04", 5300, 5010),
  revenuePoint("2026-05", 5480, 5320),
  revenuePoint("2026-06", 5620, 5560),
  revenuePoint("2026-07", 5750, 5690),
  revenuePoint("2026-08", 5750, 5750),
  revenuePoint("2026-09", 5750, 3797),
];

/* -------------------------------------------------------------------------- */
/* Mock service API                                                            */
/*                                                                            */
/* Everything below is the contract the pages use. When the backend lands,     */
/* only the bodies of these functions change (plus the deletion of the seed    */
/* data above) — no component has to be touched.                               */
/* -------------------------------------------------------------------------- */

/** Billing period the screens default to. */
export function getCurrentPeriod(): BillingPeriod {
  return CURRENT_PERIOD;
}

/** Shifts a `YYYY-MM` period by whole months (handles year boundaries). */
export function shiftPeriod(period: BillingPeriod, months: number): BillingPeriod {
  const [year, month] = period.split("-").map(Number);
  const shifted = new Date(year, month - 1 + months, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

/** Case-insensitive "does any field contain the query" helper. */
function matches(haystack: Array<string | undefined>, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((value) => value?.toLowerCase().includes(needle));
}

/**
 * Mock login. Unknown credentials (or a wrong password) resolve to null and the
 * caller decides how to present the failure.
 */
export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const account = STAFF_ACCOUNTS.find(
    (candidate) =>
      candidate.email === normalizedEmail && candidate.password === password,
  );

  return respond(account?.user ?? null);
}

/* -------------------------------------------------------------------------- */
/* Rooms                                                                      */
/* -------------------------------------------------------------------------- */

export async function getFloors(): Promise<number[]> {
  const floors = [...new Set(ROOMS.map((room) => room.floor))].sort(
    (a, b) => a - b,
  );
  return respond(floors);
}

export async function getRooms(
  filters: Partial<RoomFilters> = {},
): Promise<Room[]> {
  const floor = filters.floor ?? "all";
  const status = filters.status ?? "all";
  const query = filters.query ?? "";

  const rooms = ROOMS.filter((room) => {
    if (floor !== "all" && room.floor !== floor) return false;
    if (status !== "all" && room.status !== status) return false;

    const tenant = TENANTS.find((candidate) => candidate.id === room.tenantId);
    return matches([room.number, room.type, tenant?.fullName], query);
  });

  return respond(rooms);
}

export async function getRoomById(id: string): Promise<Room | null> {
  return respond(ROOMS.find((room) => room.id === id) ?? null);
}

export async function getRoomByNumber(number: string): Promise<Room | null> {
  return respond(ROOMS.find((room) => room.number === number) ?? null);
}

/**
 * Mutates the status of an existing room in the in-memory mock dataset.
 *
 * Allowed transitions (Phase 5.7):
 *  - vacant -> maintenance
 *  - maintenance -> vacant (clears room.note)
 *
 * Invariant preserved: only occupied rooms have a tenantId.
 */
export async function updateRoomStatus(
  roomId: string,
  nextStatus: Room["status"],
): Promise<
  | { success: true; room: Room }
  | { success: false; error: string }
> {
  const room = ROOMS.find((candidate) => candidate.id === roomId);
  if (!room) {
    return respond({ success: false, error: "Room not found." });
  }

  const isVacantToMaintenance =
    room.status === "vacant" && nextStatus === "maintenance";
  const isMaintenanceToVacant =
    room.status === "maintenance" && nextStatus === "vacant";

  if (!isVacantToMaintenance && !isMaintenanceToVacant) {
    return respond({
      success: false,
      error: `Transition from "${room.status}" to "${nextStatus}" is not allowed.`,
    });
  }

  room.status = nextStatus;
  if (nextStatus === "vacant") {
    room.note = null;
  }

  return respond({ success: true, room: structuredClone(room) });
}

/* -------------------------------------------------------------------------- */
/* Tenants                                                                    */
/* -------------------------------------------------------------------------- */

export async function getTenants(
  filters: Partial<TenantFilters> = {},
): Promise<Tenant[]> {
  const status = filters.status ?? "all";
  const query = filters.query ?? "";

  const tenants = TENANTS.filter((tenant) => {
    if (status !== "all" && tenant.status !== status) return false;

    const room = ROOMS.find((candidate) => candidate.id === tenant.roomId);
    return matches([tenant.fullName, tenant.email, tenant.phone, room?.number], query);
  });

  return respond(tenants);
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  return respond(TENANTS.find((tenant) => tenant.id === id) ?? null);
}

export async function getTenantByRoomId(roomId: string): Promise<Tenant | null> {
  return respond(TENANTS.find((tenant) => tenant.roomId === roomId) ?? null);
}

/** Fields the "add tenant" Server Action forwards; the rest are defaulted. */
interface CreateTenantInput {
  fullName: string;
  email: string;
  phone: string;
  idCard: string;
  occupation: string;
  emergencyContact: EmergencyContact;
  /** Optional assignment — `null`/omitted leaves the tenant pending (TEN-014). */
  roomId?: string | null;
}

/** Local-timezone `YYYY-MM-DD` for the generated lease dates. */
function toIsoDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Creates a tenant in the in-memory mock dataset (Phase 6.5 "add tenant").
 *
 * Data-layer rules (the Server Action validates the form fields first):
 *  - `id` follows the existing TEN-XXX scheme: highest existing sequence + 1,
 *    zero-padded to three digits (TEN-001 … TEN-014 exist in the seed).
 *  - `balance` / `deposit` default to 0; the lease window defaults to
 *    "today → one year less a day".
 *  - `status` follows the assignment: room given → "active", no room →
 *    "pending" (the TEN-014 precedent for an applicant without a room).
 *  - A supplied `roomId` must exist and be vacant; the room then flips to
 *    "occupied" and points at the new tenant, preserving the "only occupied
 *    rooms have a tenantId" invariant.
 */
export async function createTenant(
  input: CreateTenantInput,
): Promise<
  { success: true; tenant: Tenant } | { success: false; error: string }
> {
  const room = input.roomId
    ? (ROOMS.find((candidate) => candidate.id === input.roomId) ?? null)
    : null;
  if (input.roomId && !room) {
    return respond({ success: false, error: "Room not found." });
  }
  if (room && room.status !== "vacant") {
    return respond({
      success: false,
      error: `Room "${room.number}" is not vacant.`,
    });
  }

  // TEN-XXX numbering: highest existing sequence + 1, zero-padded to match.
  const maxSequence = TENANTS.reduce((max, tenant) => {
    const match = /^TEN-(\d+)$/.exec(tenant.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  const moveInDate = new Date();
  const leaseEndDate = new Date(moveInDate);
  leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1);
  leaseEndDate.setDate(leaseEndDate.getDate() - 1);

  const tenant: Tenant = {
    id: `TEN-${String(maxSequence + 1).padStart(3, "0")}`,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    idCard: input.idCard,
    roomId: room?.id ?? null,
    moveInDate: toIsoDateString(moveInDate),
    leaseEndDate: toIsoDateString(leaseEndDate),
    status: room ? "active" : "pending",
    balance: 0,
    deposit: 0,
    occupation: input.occupation,
    emergencyContact: { ...input.emergencyContact },
  };

  TENANTS.push(tenant);
  if (room) {
    room.status = "occupied";
    room.tenantId = tenant.id;
  }

  return respond({ success: true, tenant: structuredClone(tenant) });
}

/**
 * Updates the contact fields of an existing tenant (Phase 6.5 "edit
 * contact"): email, phone and the emergency contact. Name, id card, lease
 * dates, money and the room assignment are deliberately not editable here.
 */
export async function updateTenantContact(
  tenantId: string,
  contact: {
    email: string;
    phone: string;
    emergencyContact: EmergencyContact;
  },
): Promise<
  { success: true; tenant: Tenant } | { success: false; error: string }
> {
  const tenant = TENANTS.find((candidate) => candidate.id === tenantId);
  if (!tenant) {
    return respond({ success: false, error: "Tenant not found." });
  }

  tenant.email = contact.email;
  tenant.phone = contact.phone;
  tenant.emergencyContact = { ...contact.emergencyContact };

  return respond({ success: true, tenant: structuredClone(tenant) });
}

/**
 * Checks a tenant out (Phase 6.5/6.6 "check-out tenant") — two records move
 * in one mutation so both stores stay consistent:
 *
 *  - the tenant flips to `inactive` and its `roomId` is cleared;
 *  - the freed room goes `occupied -> vacant` and loses its `tenantId` (plus
 *    its `note`, exactly like `updateRoomStatus` does when a room returns to
 *    `vacant`), so "only occupied rooms have a tenantId" still holds.
 *
 * The room write deliberately mirrors `updateRoomStatus` rather than calling
 * it: that function's Phase 5.7 transition guard only permits
 * `vacant ⇄ maintenance`, so `occupied -> vacant` would be rejected — and
 * widening the guard would change the Phase 5.7 contract. Same style here:
 * find on the module-level `ROOMS` store → mutate → clone via `respond()`.
 *
 * Data-layer rules (the Server Action re-validates these too):
 *  - only an `active` tenant with an assigned room can be checked out;
 *  - the assigned room must exist and still be `occupied` (defence against a
 *    client acting on stale data — the stores may have drifted since render).
 */
export async function checkOutTenant(
  tenantId: string,
): Promise<
  { success: true; tenant: Tenant; room: Room } | { success: false; error: string }
> {
  const tenant = TENANTS.find((candidate) => candidate.id === tenantId);
  if (!tenant) {
    return respond({ success: false, error: "Tenant not found." });
  }
  if (tenant.status !== "active") {
    return respond({ success: false, error: "Tenant is not active." });
  }

  const assignedRoomId = tenant.roomId;
  if (!assignedRoomId) {
    return respond({ success: false, error: "Tenant has no room assigned." });
  }

  const room = ROOMS.find((candidate) => candidate.id === assignedRoomId);
  if (!room) {
    return respond({ success: false, error: "Room not found." });
  }
  if (room.status !== "occupied") {
    return respond({
      success: false,
      error: `Room "${room.number}" is not occupied.`,
    });
  }

  // Room first (module-level ROOMS store, `updateRoomStatus` style), then the
  // tenant — one synchronous block, so no reader sees a half-completed move.
  room.status = "vacant";
  room.tenantId = null;
  room.note = null;

  tenant.status = "inactive";
  tenant.roomId = null;

  return respond({
    success: true,
    tenant: structuredClone(tenant),
    room: structuredClone(room),
  });
}

/* -------------------------------------------------------------------------- */
/* Billing                                                                    */
/* -------------------------------------------------------------------------- */

export async function getInvoices(
  filters: Partial<InvoiceFilters> = {},
): Promise<Invoice[]> {
  const period = filters.period ?? "all";
  const status = filters.status ?? "all";
  const query = filters.query ?? "";

  const invoices = INVOICES.filter((invoice) => {
    if (period !== "all" && invoice.period !== period) return false;
    if (status !== "all" && invoice.status !== status) return false;

    const tenant = TENANTS.find((candidate) => candidate.id === invoice.tenantId);
    const room = ROOMS.find((candidate) => candidate.id === invoice.roomId);
    return matches([invoice.invoiceNumber, tenant?.fullName, room?.number], query);
  }).sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));

  return respond(invoices);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  return respond(INVOICES.find((invoice) => invoice.id === id) ?? null);
}

export async function getInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
  const invoices = INVOICES.filter((invoice) => invoice.tenantId === tenantId).sort(
    (a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber),
  );

  return respond(invoices);
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

export async function getUtilityRates(): Promise<{
  electricPerKwh: number;
  waterPerCubicMeter: number;
}> {
  return respond({ ...UTILITY_RATES });
}

export async function getUtilityReadings(
  period: BillingPeriod = CURRENT_PERIOD,
): Promise<UtilityReading[]> {
  return respond(UTILITY_READINGS.filter((reading) => reading.period === period));
}

export async function getUtilityReading(
  roomId: string,
  period: BillingPeriod = CURRENT_PERIOD,
): Promise<UtilityReading | null> {
  const reading = UTILITY_READINGS.find(
    (candidate) => candidate.roomId === roomId && candidate.period === period,
  );

  return respond(reading ?? null);
}

/** Full meter history for one room, newest first (room detail view). */
export async function getUtilityReadingsByRoom(
  roomId: string,
): Promise<UtilityReading[]> {
  const readings = UTILITY_READINGS.filter(
    (reading) => reading.roomId === roomId,
  ).sort((a, b) => b.period.localeCompare(a.period));

  return respond(readings);
}

/** Fields the "save meter reading" Server Action forwards. */
interface CreateUtilityReadingInput {
  roomId: string;
  period: BillingPeriod;
  electricPrevious: number;
  electricCurrent: number;
  waterPrevious: number;
  waterCurrent: number;
}

/**
 * Records a meter reading in the in-memory mock dataset (Phase 7.2/7.3
 * "save meter reading").
 *
 * Data-layer rules (the Server Action validates the form fields first):
 *  - the room must exist;
 *  - no reading may already exist for that roomId + period (the Server
 *    Action also guards against later periods to protect the cumulative
 *    meter chain).
 *
 * The new reading snapshots the current UTILITY_RATES into
 * electricRate/waterRate and keeps the existing `RDG-<number>-<period>`
 * id scheme.
 */
export async function createUtilityReading(
  input: CreateUtilityReadingInput,
): Promise<
  | { success: true; reading: UtilityReading }
  | { success: false; error: string }
> {
  const room = ROOMS.find((candidate) => candidate.id === input.roomId);
  if (!room) {
    return respond({ success: false, error: "Room not found." });
  }

  const duplicate = UTILITY_READINGS.find(
    (candidate) =>
      candidate.roomId === input.roomId && candidate.period === input.period,
  );
  if (duplicate) {
    return respond({
      success: false,
      error: `Reading for room "${room.number}" in period "${input.period}" already exists.`,
    });
  }

  const reading: UtilityReading = {
    id: `RDG-${room.number}-${input.period}`,
    roomId: room.id,
    period: input.period,
    electricPrevious: input.electricPrevious,
    electricCurrent: input.electricCurrent,
    waterPrevious: input.waterPrevious,
    waterCurrent: input.waterCurrent,
    electricRate: UTILITY_RATES.electricPerKwh,
    waterRate: UTILITY_RATES.waterPerCubicMeter,
    recordedAt: new Date().toISOString(),
  };

  UTILITY_READINGS.push(reading);

  return respond({ success: true, reading: structuredClone(reading) });
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const countByStatus = (status: Room["status"]) =>
    ROOMS.filter((room) => room.status === status).length;

  const totalRooms = ROOMS.length;
  const occupiedRooms = countByStatus("occupied");
  const maintenanceRooms = countByStatus("maintenance");

  const expectedRevenue = ROOMS.filter(
    (room) => room.status === "occupied",
  ).reduce((sum, room) => sum + room.monthlyRate, 0);

  const collectedRevenue = INVOICES.filter(
    (invoice) => invoice.period === CURRENT_PERIOD,
  ).reduce((sum, invoice) => sum + invoice.paidAmount, 0);

  const outstandingBalance = INVOICES.reduce(
    (sum, invoice) => sum + Math.max(invoice.total - invoice.paidAmount, 0),
    0,
  );

  return respond({
    totalRooms,
    occupiedRooms,
    vacantRooms: countByStatus("vacant"),
    maintenanceRooms,
    reservedRooms: countByStatus("reserved"),
    occupancyRate:
      totalRooms === 0
        ? 0
        : Math.round((occupiedRooms / totalRooms) * 1000) / 10,
    activeTenants: TENANTS.filter((tenant) => tenant.status === "active").length,
    expectedRevenue,
    collectedRevenue,
    outstandingBalance,
    unpaidInvoices: INVOICES.filter((invoice) => invoice.status !== "paid").length,
    openMaintenanceIssues: maintenanceRooms,
  });
}

export async function getFloorOccupancy(): Promise<FloorOccupancy[]> {
  const floors = [...new Set(ROOMS.map((room) => room.floor))].sort(
    (a, b) => a - b,
  );

  const perFloor = floors.map((floor) => {
    const rooms = ROOMS.filter((room) => room.floor === floor);
    const countByStatus = (status: Room["status"]) =>
      rooms.filter((room) => room.status === status).length;

    return {
      floor,
      total: rooms.length,
      occupied: countByStatus("occupied"),
      vacant: countByStatus("vacant"),
      maintenance: countByStatus("maintenance"),
      reserved: countByStatus("reserved"),
    };
  });

  return respond(perFloor);
}

export async function getRevenueTrend(): Promise<RevenuePoint[]> {
  return respond(REVENUE_TREND);
}

export async function getRecentActivities(limit = 6): Promise<Activity[]> {
  const activities = [...ACTIVITIES]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);

  return respond(activities);
}