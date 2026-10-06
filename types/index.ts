/**
 * Domain type contract for the Dormitory Management System (DMS) frontend.
 *
 * These interfaces describe the shapes the real REST API is expected to return.
 * Until the backend exists, `lib/mock-data.ts` implements this same contract so
 * pages and components never consume raw mock objects directly.
 */

/* -------------------------------------------------------------------------- */
/* Auth & staff accounts                                                       */
/* -------------------------------------------------------------------------- */

export type UserRole = "admin" | "manager" | "staff";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  /** Tailwind classes for the avatar bubble. */
  avatarClass: string;
}

export interface AuthSession {
  user: AdminUser;
  /** ISO timestamp of when the session was created. */
  issuedAt: string;
  /** ISO timestamp of when the session expires. */
  expiresAt: string;
  /**
   * Bearer token for the real API. Absent while the mock login is in use, since
   * `authenticateAdmin` issues no tokens yet.
   */
  accessToken?: string;
  /** Rotating refresh token; the server invalidates the previous one on use. */
  refreshToken?: string;
}

/** Mock credential record (replaced by the real auth API later). */
export interface MockCredential {
  email: string;
  password: string;
  user: AdminUser;
}

/** State returned by the login Server Action to the client form. */
export interface LoginFormState {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: { email?: string; password?: string };
  /** Kept so the form can re-hydrate the typed email after a failed attempt. */
  email: string;
}

/** State returned by the room status mutation Server Action (Phase 5.7). */
export interface RoomStatusFormState {
  status: "idle" | "success" | "error";
  message: string | null;
}

/* -------------------------------------------------------------------------- */
/* Rooms                                                                      */
/* -------------------------------------------------------------------------- */

export type RoomStatus = "vacant" | "occupied" | "maintenance" | "reserved";

export type RoomType = "single" | "double" | "studio" | "suite";

export interface Room {
  id: string;
  /** Human readable room number, e.g. "203". */
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  /** Monthly rent in the currency configured in `lib/utils.ts`. */
  monthlyRate: number;
  sizeSqm: number;
  amenities: string[];
  /** Null when nobody is assigned to the room. */
  tenantId: string | null;
  note: string | null;
}

/* -------------------------------------------------------------------------- */
/* Tenants                                                                    */
/* -------------------------------------------------------------------------- */

export type TenantStatus = "active" | "pending" | "inactive";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Tenant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  idCard: string;
  /** Null for tenants that have moved out and are not assigned to a room. */
  roomId: string | null;
  /** ISO date. */
  moveInDate: string;
  /** ISO date. */
  leaseEndDate: string;
  status: TenantStatus;
  /** Positive values mean the tenant owes money. */
  balance: number;
  deposit: number;
  occupation: string;
  emergencyContact: EmergencyContact;
}

/* -------------------------------------------------------------------------- */
/* Utilities & billing                                                        */
/* -------------------------------------------------------------------------- */

export type InvoiceStatus = "paid" | "partial" | "unpaid" | "overdue";

/** Billing period in `YYYY-MM` format. */
export type BillingPeriod = string;

export interface UtilityReading {
  id: string;
  roomId: string;
  period: BillingPeriod;
  electricPrevious: number;
  electricCurrent: number;
  waterPrevious: number;
  waterCurrent: number;
  /** Price per kWh / per m³. */
  electricRate: number;
  waterRate: number;
  /** ISO timestamp of when the meter was read. */
  recordedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  roomId: string;
  period: BillingPeriod;
  /** ISO dates. */
  issuedDate: string;
  dueDate: string;
  roomFee: number;
  electricFee: number;
  waterFee: number;
  otherFee: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
}

/** Payload used when generating an invoice from a meter reading (Phase 7). */
export interface InvoiceDraftInput {
  roomId: string;
  period: BillingPeriod;
  electricPrevious: number;
  electricCurrent: number;
  waterPrevious: number;
  waterCurrent: number;
  otherFee: number;
  note?: string;
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export type ActivityType =
  | "payment"
  | "move-in"
  | "move-out"
  | "invoice"
  | "maintenance"
  | "meter";

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  /** ISO timestamp. */
  timestamp: string;
  actor: string;
}

export interface DashboardMetrics {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  reservedRooms: number;
  /** 0 - 100. */
  occupancyRate: number;
  activeTenants: number;
  /** Sum of the monthly rate of every occupied room. */
  expectedRevenue: number;
  /** Money actually received for the current period. */
  collectedRevenue: number;
  outstandingBalance: number;
  unpaidInvoices: number;
  openMaintenanceIssues: number;
}

export interface RevenuePoint {
  label: string;
  period: BillingPeriod;
  collected: number;
  expected: number;
}

export interface FloorOccupancy {
  floor: number;
  total: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  reserved: number;
}

/* -------------------------------------------------------------------------- */
/* Filters (used by the list screens)                                         */
/* -------------------------------------------------------------------------- */

export interface RoomFilters {
  floor: number | "all";
  status: RoomStatus | "all";
  query: string;
}

export interface TenantFilters {
  status: TenantStatus | "all";
  query: string;
}

export interface InvoiceFilters {
  period: BillingPeriod | "all";
  status: InvoiceStatus | "all";
  query: string;
}