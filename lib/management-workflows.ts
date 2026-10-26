export type ManagementSelectOption = {
  value: string;
  label: string;
};

export type ManagementField = {
  name: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "password" | "textarea" | "select";
  required?: boolean;
  array?: boolean;
  options?: string[];
  selectOptions?: ManagementSelectOption[];
};

const id = (name: string): ManagementField => ({ name, required: true });
const text = (name: string, required = false): ManagementField => ({ name, required });
const number = (name: string, required = true): ManagementField => ({ name, type: "number", required });
const date = (name: string, required = true): ManagementField => ({ name, type: "date", required });
const choice = (name: string, options: string[], required = true): ManagementField => ({ name, type: "select", options, required });

export const MANAGEMENT_CREATE_FIELDS: Record<string, ManagementField[]> = {
  organizations: [text("code", true), text("name", true), text("taxId"), text("phone"), { ...text("email"), type: "email" }, text("address")],
  dormitories: [text("organizationId"), text("code", true), text("name", true), text("description"), text("phone"), { ...text("email"), type: "email" }, text("address"), text("province"), text("district"), text("subdistrict"), text("postalCode"), number("latitude", false), number("longitude", false), number("billingDay"), number("paymentDueDay"), number("waterRatePerUnit"), number("electricityRatePerUnit"), choice("lateFeeType", ["Fixed", "Percentage"]), number("lateFeeAmount", false)],
  buildings: [id("dormitoryId"), text("code", true), text("name", true), text("description"), number("totalFloors")],
  floors: [id("buildingId"), number("floorNumber"), text("name"), text("description")],
  "room-types": [id("dormitoryId"), text("code", true), text("name", true), text("description"), number("monthlyRent"), number("dailyRent", false), number("depositAmount"), number("maximumOccupants")],
  contracts: [id("roomId"), id("tenantId"), { name: "coTenantIds", type: "textarea", array: true }, text("reservationId"), date("startDate"), date("endDate"), number("monthlyRent", false), number("depositAmount", false), number("waterRatePerUnit", false), number("electricityRatePerUnit", false), text("notes")],
  reservations: [id("roomId"), id("tenantId"), date("moveInDate"), number("holdDays"), number("reservationFee"), text("notes")],
  payments: [id("invoiceId"), number("amount"), { name: "paymentDate", type: "datetime-local" }, choice("method", ["Cash", "BankTransfer", "QrCode", "Other"]), text("referenceNumber"), text("notes")],
  deposits: [id("contractId"), number("amount", false), text("notes")],
  expenses: [id("dormitoryId"), text("maintenanceRequestId"), text("category", true), number("amount"), date("expenseDate"), text("description", true), text("paidTo"), text("notes")],
  receipts: [id("paymentId"), text("notes")],
  "maintenance-requests": [id("roomId"), text("tenantId"), text("category"), text("title", true), text("description"), choice("priority", ["Low", "Medium", "High", "Urgent"])],
  parcels: [id("roomId"), text("tenantId"), text("courierName"), text("trackingNumber"), text("description"), text("notes")],
  visitors: [id("roomId"), text("tenantId"), text("visitorName", true), text("visitorPhone"), text("idNumber"), text("purpose"), text("notes")],
  parking: [id("roomId"), id("tenantId"), text("licensePlate", true), text("vehicleType", true), text("brand"), text("color"), text("parkingSpotLabel"), text("notes")],
  announcements: [id("dormitoryId"), text("title", true), { name: "content", type: "textarea", required: true }, choice("priority", ["Low", "Normal", "High", "Urgent"]), { name: "expiresAt", type: "datetime-local" }, text("targetRoles"), text("notes")],
  notifications: [id("recipientUserId"), text("title", true), { name: "message", type: "textarea", required: true }],
  users: [{ name: "email", type: "email", required: true }, { name: "password", type: "password", required: true }, text("firstName", true), text("lastName", true), text("phone"), text("organizationId")],
  roles: [text("name", true), text("description")],
};

export const MANAGEMENT_UPDATE_FIELDS: Record<string, ManagementField[]> = {
  organizations: MANAGEMENT_CREATE_FIELDS.organizations,
  dormitories: MANAGEMENT_CREATE_FIELDS.dormitories.slice(1),
  buildings: MANAGEMENT_CREATE_FIELDS.buildings.slice(1),
  floors: MANAGEMENT_CREATE_FIELDS.floors.slice(1),
  "room-types": MANAGEMENT_CREATE_FIELDS["room-types"].slice(1),
  users: [text("firstName", true), text("lastName", true), text("phone"), text("profileImage")],
  roles: MANAGEMENT_CREATE_FIELDS.roles,
};

export const MANAGEMENT_OPERATIONS: Record<string, string[]> = {
  organizations: ["status", "delete"],
  dormitories: ["status", "delete"],
  buildings: ["status", "delete"],
  floors: ["status", "delete"],
  "room-types": ["status", "delete"],
  contracts: ["activate", "terminate", "renew"],
  invoices: ["issue", "cancel"],
  reservations: ["confirm", "cancel"],
  payments: ["confirm", "refund"],
  deposits: ["refund"],
  "maintenance-requests": ["assign", "status", "timeline", "cost"],
  parcels: ["pickup", "return"],
  visitors: ["checkout"],
  parking: ["release"],
  announcements: ["publish", "archive", "cancel"],
  notifications: ["read"],
  users: ["status", "roles"],
  roles: ["permissions", "delete"],
};

export const MANAGEMENT_OPERATION_FIELDS: Record<string, ManagementField[]> = {
  status: [choice("status", ["Active", "Inactive"])],
  terminate: [text("reason")],
  renew: [date("endDate"), number("monthlyRent", false), number("waterRatePerUnit", false), number("electricityRatePerUnit", false)],
  timeline: [text("note", true)],
  cost: [number("amount", true), text("description", true)],
  refund: [number("refundAmount", false), text("reason"), text("deductionReason")],
  assign: [id("technicianId")],
  pickup: [text("pickedUpByName")],
  roles: [{ name: "roles", type: "textarea", required: true }],
  permissions: [{ name: "permissions", type: "textarea", required: true }],
};

export function managementFieldList(resource: string, operation: string) {
  if (operation === "create") return MANAGEMENT_CREATE_FIELDS[resource] ?? [];
  if (operation === "update") return MANAGEMENT_UPDATE_FIELDS[resource] ?? [];
  if (operation === "refund" && resource === "payments") {
    return [{ name: "reason" }];
  }
  if (operation === "refund" && resource === "deposits") {
    return [{ ...number("refundAmount", false) }, text("deductionReason")];
  }
  return MANAGEMENT_OPERATION_FIELDS[operation] ?? [];
}
