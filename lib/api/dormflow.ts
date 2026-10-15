import "server-only";

import { cache } from "react";

import {
  ApiError,
  apiRequest,
  type ApiRequestOptions,
} from "@/lib/api/client";
import type {
  Activity,
  DashboardMetrics,
  EmergencyContact,
  FloorOccupancy,
  Invoice,
  InvoiceFilters,
  InvoiceStatus,
  RevenuePoint,
  Room,
  RoomStatus,
  RoomType,
  Tenant,
  TenantStatus,
  UtilityReading,
} from "@/types";

const PAGE_SIZE = 200;
interface PagedData<T> {
  items: T[];
  page: number;
  totalPages: number;
}

interface ApiRoom {
  id: string;
  dormitoryId: string;
  floorName: string;
  roomTypeName: string;
  roomNumber: string;
  monthlyRent: number;
  status: string;
  description: string | null;
}

interface ApiTenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status: string;
  createdAt: string;
}

interface ApiContract {
  id: string;
  roomId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  status: string;
}

interface ApiInvoice {
  id: string;
  contractId: string;
  invoiceNumber: string;
  periodMonth: string;
  issueDate: string;
  dueDate: string;
  rentAmount: number;
  waterAmount: number;
  electricityAmount: number;
  lateFeeAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface ApiMeterReading {
  id: string;
  dormitoryId: string;
  roomId: string;
  meterType: string;
  periodMonth: string;
  previousReading: number;
  currentReading: number;
  createdAt: string;
}

interface ApiDormitory {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  billingDay: number;
  paymentDueDay: number;
  lateFeeType: string;
  lateFeeAmount: number;
  waterRatePerUnit: number;
  electricityRatePerUnit: number;
}

interface ApiDashboardSummary {
  roomStatusCounts: Record<string, number> | null;
  totalRooms: number | null;
  occupancyRate: number | null;
  outstandingInvoicesTotal: number | null;
  outstandingInvoicesCount: number | null;
  revenueThisMonth: number | null;
  revenueTrend: Array<{ label: string; amount: number }> | null;
  openMaintenanceCount: number | null;
  recentActivity: Array<{
    id: string;
    message: string;
    occurredAt: string;
  }> | null;
}

interface ApiSetting {
  key: string;
  value: string;
}

export interface UtilityRates {
  electricPerKwh: number;
  waterPerCubicMeter: number;
}

async function getPage<T>(
  path: string,
  query: ApiRequestOptions["query"] = {},
): Promise<PagedData<T>> {
  return apiRequest<PagedData<T>>(path, {
    query: { page: 1, pageSize: PAGE_SIZE, ...query },
    cache: "no-store",
  });
}

async function getAll<T>(
  path: string,
  query: ApiRequestOptions["query"] = {},
): Promise<T[]> {
  const first = await getPage<T>(path, query);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const result = await getPage<T>(path, { ...query, page });
    items.push(...result.items);
  }
  return items;
}

const getApiRooms = cache(() => getAll<ApiRoom>("/rooms"));
const getApiTenants = cache(() => getAll<ApiTenant>("/tenants"));
const getApiContracts = cache(() => getAll<ApiContract>("/contracts"));
const getApiInvoices = cache(() => getAll<ApiInvoice>("/invoices"));
const getApiDormitories = cache(() => getAll<ApiDormitory>("/dormitories"));

function parseFloor(floorName: string, roomNumber: string): number {
  const fromName = /\d+/u.exec(floorName)?.[0];
  const fromRoom = /^\d/u.exec(roomNumber)?.[0];
  return Number(fromName ?? fromRoom ?? 0);
}

function mapRoomType(name: string): RoomType {
  const normalized = name.toLowerCase();
  if (normalized.includes("suite")) return "suite";
  if (normalized.includes("studio")) return "studio";
  if (normalized.includes("double") || normalized.includes("twin")) {
    return "double";
  }
  return "single";
}

function mapRoomStatus(status: string): RoomStatus {
  switch (status.toLowerCase()) {
    case "available":
      return "vacant";
    case "occupied":
      return "occupied";
    case "reserved":
      return "reserved";
    case "maintenance":
    case "cleaning":
    case "inactive":
      return "maintenance";
    default:
      throw new ApiError(`Unknown room status "${status}" returned by the API.`, {
        status: 502,
      });
  }
}

function activeContracts(contracts: ApiContract[]): ApiContract[] {
  return contracts.filter((contract) => contract.status.toLowerCase() === "active");
}

function mapRoom(
  room: ApiRoom,
  contracts: ApiContract[],
): Room {
  const contract = activeContracts(contracts).find(
    (candidate) => candidate.roomId === room.id,
  );
  return {
    id: room.id,
    number: room.roomNumber,
    floor: parseFloor(room.floorName, room.roomNumber),
    type: mapRoomType(room.roomTypeName),
    status: mapRoomStatus(room.status),
    monthlyRate: room.monthlyRent,
    sizeSqm: 0,
    amenities: [],
    tenantId: contract?.tenantId ?? null,
    note: room.description,
  };
}

function latestContract(
  contracts: ApiContract[],
  tenantId: string,
): ApiContract | undefined {
  return contracts
    .filter((contract) => contract.tenantId === tenantId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
}

function mapTenant(
  tenant: ApiTenant,
  contracts: ApiContract[],
  invoices: ApiInvoice[],
): Tenant {
  const contract = latestContract(contracts, tenant.id);
  const tenantInvoices = contract
    ? invoices.filter(
        (invoice) =>
          invoice.contractId === contract.id &&
          invoice.status.toLowerCase() !== "draft" &&
          invoice.status.toLowerCase() !== "cancelled",
      )
    : [];
  const normalizedStatus = tenant.status.toLowerCase();
  const status: TenantStatus =
    normalizedStatus === "inactive" || normalizedStatus === "blacklisted"
      ? "inactive"
      : contract?.status.toLowerCase() === "active"
        ? "active"
        : contract?.status.toLowerCase() === "terminated"
          ? "inactive"
        : "pending";

  return {
    id: tenant.id,
    fullName: `${tenant.firstName} ${tenant.lastName}`.trim(),
    email: tenant.email ?? "",
    phone: tenant.phone ?? "",
    idCard: tenant.nationalId ?? "",
    roomId: contract?.status.toLowerCase() === "active" ? contract.roomId : null,
    moveInDate: contract?.startDate ?? tenant.createdAt.slice(0, 10),
    leaseEndDate: contract?.endDate ?? "",
    status,
    balance: tenantInvoices.reduce(
      (sum, invoice) =>
        sum + Math.max(invoice.totalAmount - invoice.paidAmount, 0),
      0,
    ),
    deposit: contract?.depositAmount ?? 0,
    occupation: "",
    emergencyContact: {
      name: tenant.emergencyContactName ?? "",
      relationship: "",
      phone: tenant.emergencyContactPhone ?? "",
    },
  };
}

function mapInvoice(
  invoice: ApiInvoice,
  contracts: ApiContract[],
): Invoice {
  const contract = contracts.find((candidate) => candidate.id === invoice.contractId);
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    tenantId: contract?.tenantId ?? "",
    roomId: contract?.roomId ?? "",
    period: invoice.periodMonth.slice(0, 7),
    issuedDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    roomFee: invoice.rentAmount,
    electricFee: invoice.electricityAmount,
    waterFee: invoice.waterAmount,
    otherFee: invoice.lateFeeAmount,
    total: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    status: mapInvoiceStatus(invoice.status),
  };
}

function mapInvoiceStatus(status: string): InvoiceStatus {
  switch (status.toLowerCase()) {
    case "issued":
      return "unpaid";
    case "paid":
      return "paid";
    case "partiallypaid":
    case "partial":
      return "partial";
    case "overdue":
      return "overdue";
    case "draft":
    case "cancelled":
      throw new ApiError(`Invoice with non-issued status "${status}" cannot be mapped.`, {
        status: 502,
      });
    default:
      throw new ApiError(`Unknown invoice status "${status}" returned by the API.`, {
        status: 502,
      });
  }
}

function mapReadingPair(
  readings: ApiMeterReading[],
  ratesByDormitory: Map<string, UtilityRates>,
): UtilityReading[] {
  const groups = new Map<string, ApiMeterReading[]>();
  for (const reading of readings) {
    const period = reading.periodMonth.slice(0, 7);
    const key = `${reading.roomId}:${period}`;
    groups.set(key, [...(groups.get(key) ?? []), reading]);
  }

  const result: UtilityReading[] = [];
  for (const group of groups.values()) {
    const electric = group.find(
      (reading) => reading.meterType.toLowerCase() === "electricity",
    );
    const water = group.find(
      (reading) => reading.meterType.toLowerCase() === "water",
    );
    if (!electric || !water) continue;

    const rates = ratesByDormitory.get(electric.dormitoryId) ?? {
      electricPerKwh: 0,
      waterPerCubicMeter: 0,
    };
    result.push({
      id: `${electric.id}:${water.id}`,
      roomId: electric.roomId,
      period: electric.periodMonth.slice(0, 7),
      electricPrevious: electric.previousReading,
      electricCurrent: electric.currentReading,
      waterPrevious: water.previousReading,
      waterCurrent: water.currentReading,
      electricRate: rates.electricPerKwh,
      waterRate: rates.waterPerCubicMeter,
      recordedAt: electric.createdAt,
    });
  }
  return result.sort((a, b) => a.period.localeCompare(b.period));
}

async function getMappedInvoices(): Promise<Invoice[]> {
  const [invoices, contracts] = await Promise.all([
    getApiInvoices(),
    getApiContracts(),
  ]);
  return invoices
    .filter((invoice) => {
      const status = invoice.status.toLowerCase();
      return status !== "draft" && status !== "cancelled";
    })
    .map((invoice) => mapInvoice(invoice, contracts));
}

async function getMappedTenants(): Promise<Tenant[]> {
  const [tenants, contracts, invoices] = await Promise.all([
    getApiTenants(),
    getApiContracts(),
    getApiInvoices(),
  ]);
  return tenants.map((tenant) => mapTenant(tenant, contracts, invoices));
}

async function getMappedRooms(): Promise<Room[]> {
  const [rooms, contracts] = await Promise.all([
    getApiRooms(),
    getApiContracts(),
  ]);
  return rooms.map((room) => mapRoom(room, contracts));
}

async function getCurrentDormitories(): Promise<ApiDormitory[]> {
  const dormitories = await getApiDormitories();
  if (dormitories.length === 0) {
    throw new ApiError("No dormitory is configured for this organization.", {
      status: 404,
    });
  }
  return dormitories;
}

export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftPeriod(period: string, offset: number): string {
  const [year, month] = period.split("-").map(Number);
  const shifted = new Date(year, month - 1 + offset, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

export async function getRooms(): Promise<Room[]> {
  return getMappedRooms();
}

export async function getRoomById(id: string): Promise<Room | null> {
  try {
    const [room, contracts] = await Promise.all([
      apiRequest<ApiRoom>(`/rooms/${encodeURIComponent(id)}`, {
        cache: "no-store",
      }),
      getApiContracts(),
    ]);
    return mapRoom(room, contracts);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getTenants(): Promise<Tenant[]> {
  return getMappedTenants();
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  try {
    const [tenant, contracts, invoices] = await Promise.all([
      apiRequest<ApiTenant>(`/tenants/${encodeURIComponent(id)}`, {
        cache: "no-store",
      }),
      getApiContracts(),
      getApiInvoices(),
    ]);
    return mapTenant(tenant, contracts, invoices);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getTenantByRoomId(roomId: string): Promise<Tenant | null> {
  return (await getMappedTenants()).find((tenant) => tenant.roomId === roomId) ?? null;
}

export async function getInvoices(
  filters: Partial<InvoiceFilters> = {},
): Promise<Invoice[]> {
  const [invoices, tenants, rooms] = await Promise.all([
    getMappedInvoices(),
    getMappedTenants(),
    getMappedRooms(),
  ]);
  const tenantNames = new Map(tenants.map((tenant) => [tenant.id, tenant.fullName]));
  const roomNumbers = new Map(rooms.map((room) => [room.id, room.number]));
  const query = filters.query?.trim().toLowerCase() ?? "";

  return invoices
    .filter((invoice) => filters.period === undefined
      || filters.period === "all"
      || invoice.period === filters.period)
    .filter((invoice) => filters.status === undefined
      || filters.status === "all"
      || invoice.status === filters.status)
    .filter((invoice) => !query
      || invoice.invoiceNumber.toLowerCase().includes(query)
      || (tenantNames.get(invoice.tenantId) ?? "").toLowerCase().includes(query)
      || (roomNumbers.get(invoice.roomId) ?? "").toLowerCase().includes(query))
    .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoice = (await getMappedInvoices()).find((item) => item.id === id);
  return invoice ?? null;
}

export async function getInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
  return (await getMappedInvoices())
    .filter((invoice) => invoice.tenantId === tenantId)
    .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
}

export async function getUtilityRates(): Promise<UtilityRates> {
  const dormitories = await getCurrentDormitories();
  return {
    electricPerKwh: dormitories[0].electricityRatePerUnit,
    waterPerCubicMeter: dormitories[0].waterRatePerUnit,
  };
}

export async function updateUtilityRates(
  rates: UtilityRates,
): Promise<{ success: true } | { success: false; error: string }> {
  if (
    !Number.isFinite(rates.electricPerKwh)
    || rates.electricPerKwh < 0
    || !Number.isFinite(rates.waterPerCubicMeter)
    || rates.waterPerCubicMeter < 0
  ) {
    return { success: false, error: "Utility rates must be finite, non-negative numbers." };
  }

  try {
    const dormitories = await getCurrentDormitories();
    for (const dormitory of dormitories) {
      await apiRequest(`/dormitories/${encodeURIComponent(dormitory.id)}`, {
        method: "PUT",
        body: {
          code: dormitory.code,
          name: dormitory.name,
          description: dormitory.description,
          phone: dormitory.phone,
          email: dormitory.email,
          address: dormitory.address,
          province: dormitory.province,
          district: dormitory.district,
          subdistrict: dormitory.subdistrict,
          postalCode: dormitory.postalCode,
          latitude: dormitory.latitude,
          longitude: dormitory.longitude,
          billingDay: dormitory.billingDay,
          paymentDueDay: dormitory.paymentDueDay,
          lateFeeType: dormitory.lateFeeType,
          lateFeeAmount: dormitory.lateFeeAmount,
          waterRatePerUnit: rates.waterPerCubicMeter,
          electricityRatePerUnit: rates.electricPerKwh,
        },
      });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
  return { success: true };
}

export async function getUtilityReadings(
  period = getCurrentPeriod(),
): Promise<UtilityReading[]> {
  const [readings, dormitories] = await Promise.all([
    getAll<ApiMeterReading>("/meter-readings", {
      periodMonth: `${period}-01`,
    }),
    getCurrentDormitories(),
  ]);
  const ratesByDormitory = new Map(
    dormitories.map((dormitory) => [
      dormitory.id,
      {
        electricPerKwh: dormitory.electricityRatePerUnit,
        waterPerCubicMeter: dormitory.waterRatePerUnit,
      },
    ]),
  );
  return mapReadingPair(readings, ratesByDormitory);
}

export async function getUtilityReadingsByRoom(
  roomId: string,
): Promise<UtilityReading[]> {
  const [readings, dormitories] = await Promise.all([
    getAll<ApiMeterReading>("/meter-readings", { roomId }),
    getCurrentDormitories(),
  ]);
  return mapReadingPair(
    readings,
    new Map(dormitories.map((dormitory) => [
      dormitory.id,
      {
        electricPerKwh: dormitory.electricityRatePerUnit,
        waterPerCubicMeter: dormitory.waterRatePerUnit,
      },
    ])),
  );
}

export async function createUtilityReading(input: {
  roomId: string;
  period: string;
  electricPrevious?: number;
  electricCurrent: number;
  waterPrevious?: number;
  waterCurrent: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const readingDate = new Date().toISOString().slice(0, 10);
    for (const reading of [
      { meterType: "Electricity", currentReading: input.electricCurrent },
      { meterType: "Water", currentReading: input.waterCurrent },
    ]) {
      await apiRequest("/meter-readings", {
        method: "POST",
        body: {
          roomId: input.roomId,
          meterType: reading.meterType,
          periodMonth: `${input.period}-01`,
          readingDate,
          currentReading: reading.currentReading,
        },
      });
    }
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function createInvoice(input: {
  roomId: string;
  period: string;
  otherFee: number;
}): Promise<{ success: true; invoice: Invoice } | { success: false; error: string }> {
  try {
    if (input.otherFee > 0) {
      return {
        success: false,
        error: "The backend does not support additional invoice fees yet.",
      };
    }
    const contracts = await getApiContracts();
    const contract = activeContracts(contracts).find(
      (item) => item.roomId === input.roomId,
    );
    if (!contract) {
      return { success: false, error: "Room has no active lease contract." };
    }
    const invoice = await apiRequest<ApiInvoice>(
      "/invoices",
      {
        method: "POST",
        body: {
          contractId: contract.id,
          periodMonth: `${input.period}-01`,
        },
      },
    );
    const issued = await apiRequest<ApiInvoice>(`/invoices/${invoice.id}/issue`, {
      method: "POST",
    });
    return {
      success: true,
      invoice: mapInvoice(issued, contracts),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
): Promise<{ success: true; invoice: Invoice } | { success: false; error: string }> {
  try {
    const payment = await apiRequest<{ id: string }>("/payments", {
      method: "POST",
      body: {
        invoiceId,
        amount,
        method: "Cash",
      },
    });
    await apiRequest(`/payments/${payment.id}/confirm`, { method: "POST" });
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return { success: false, error: "Invoice was not found after payment confirmation." };
    }
    return { success: true, invoice };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function createTenant(input: {
  fullName: string;
  email: string;
  phone: string;
  idCard: string;
  occupation?: string;
  emergencyContact: EmergencyContact;
  roomId?: string | null;
}): Promise<{ success: true; tenant: Tenant } | { success: false; error: string }> {
  try {
    const nameParts = input.fullName.trim().split(/\s+/u);
    const created = await apiRequest<ApiTenant>("/tenants", {
      method: "POST",
      body: {
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        email: input.email,
        phone: input.phone,
        nationalId: input.idCard,
        emergencyContactName: input.emergencyContact.name,
        emergencyContactPhone: input.emergencyContact.phone,
      },
    });

    if (input.roomId) {
      const room = await apiRequest<ApiRoom>(`/rooms/${encodeURIComponent(input.roomId)}`);
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
      const contract = await apiRequest<ApiContract>("/contracts", {
        method: "POST",
        body: {
          roomId: room.id,
          tenantId: created.id,
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
        },
      });
      await apiRequest(`/contracts/${contract.id}/activate`, { method: "POST" });
    }

    const tenant = await getTenantById(created.id);
    if (!tenant) {
      return { success: false, error: "The tenant was created but could not be reloaded." };
    }
    return { success: true, tenant };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function updateTenantContact(
  tenantId: string,
  contact: { email: string; phone: string; emergencyContact: EmergencyContact },
): Promise<{ success: true; tenant: Tenant } | { success: false; error: string }> {
  try {
    const existing = await apiRequest<ApiTenant>(
      `/tenants/${encodeURIComponent(tenantId)}`,
    );
    const nameParts = `${existing.firstName} ${existing.lastName}`
      .trim()
      .split(/\s+/u);
    await apiRequest(`/tenants/${encodeURIComponent(tenantId)}`, {
      method: "PUT",
      body: {
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        email: contact.email,
        phone: contact.phone,
        nationalId: existing.nationalId,
        emergencyContactName: contact.emergencyContact.name,
        emergencyContactPhone: contact.emergencyContact.phone,
      },
    });
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return { success: false, error: "The tenant was updated but could not be reloaded." };
    }
    return { success: true, tenant };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function checkOutTenant(
  tenantId: string,
): Promise<
  { success: true; tenant: Tenant; room: Room }
  | { success: false; error: string }
> {
  try {
    const contracts = await getAll<ApiContract>("/contracts", { tenantId });
    const contract = activeContracts(contracts)[0];
    if (!contract) {
      return { success: false, error: "Tenant has no active lease contract." };
    }
    const room = await getRoomById(contract.roomId);
    if (!room) return { success: false, error: "Room not found." };
    await apiRequest(`/contracts/${contract.id}/terminate`, {
      method: "POST",
      body: { reason: "Tenant checked out" },
    });
    const tenant = await getTenantById(tenantId);
    return tenant
      ? { success: true, tenant, room: { ...room, status: "maintenance", tenantId: null } }
      : { success: false, error: "The tenant was checked out but could not be reloaded." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus,
): Promise<{ success: true; room: Room } | { success: false; error: string }> {
  try {
    const backendStatus = status === "vacant" ? "Available" : "Maintenance";
    const updated = await apiRequest<ApiRoom>(
      `/rooms/${encodeURIComponent(roomId)}/status`,
      {
        method: "PATCH",
        body: { status: backendStatus },
      },
    );
    const contracts = await getApiContracts();
    return { success: true, room: mapRoom(updated, contracts) };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

async function getDashboardSummary(): Promise<ApiDashboardSummary> {
  return apiRequest<ApiDashboardSummary>("/dashboard/summary", {
    cache: "no-store",
  });
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [summary, rooms, tenants] = await Promise.all([
    getDashboardSummary(),
    getMappedRooms(),
    getMappedTenants(),
  ]);
  const counts = summary.roomStatusCounts ?? {};
  const totalRooms = summary.totalRooms ?? 0;
  const occupiedRooms = counts.Occupied ?? 0;

  return {
    totalRooms,
    occupiedRooms,
    vacantRooms: counts.Available ?? 0,
    maintenanceRooms: (counts.Maintenance ?? 0) + (counts.Cleaning ?? 0),
    reservedRooms: counts.Reserved ?? 0,
    occupancyRate: summary.occupancyRate ?? 0,
    activeTenants: tenants.filter((tenant) => tenant.status === "active").length,
    expectedRevenue: rooms
      .filter((room) => room.status === "occupied")
      .reduce((total, room) => total + room.monthlyRate, 0),
    collectedRevenue: summary.revenueThisMonth ?? 0,
    outstandingBalance: summary.outstandingInvoicesTotal ?? 0,
    unpaidInvoices: summary.outstandingInvoicesCount ?? 0,
    openMaintenanceIssues: summary.openMaintenanceCount ?? 0,
  };
}

export async function getFloorOccupancy(): Promise<FloorOccupancy[]> {
  const rooms = await getMappedRooms();
  const floors = new Map<number, Room[]>();
  for (const room of rooms) {
    floors.set(room.floor, [...(floors.get(room.floor) ?? []), room]);
  }
  return [...floors.entries()]
    .sort(([a], [b]) => a - b)
    .map(([floor, floorRooms]) => ({
      floor,
      total: floorRooms.length,
      occupied: floorRooms.filter((room) => room.status === "occupied").length,
      vacant: floorRooms.filter((room) => room.status === "vacant").length,
      maintenance: floorRooms.filter((room) => room.status === "maintenance").length,
      reserved: floorRooms.filter((room) => room.status === "reserved").length,
    }));
}

export async function getRevenueTrend(): Promise<RevenuePoint[]> {
  const [summary, rooms] = await Promise.all([
    getDashboardSummary(),
    getMappedRooms(),
  ]);
  const trend = summary.revenueTrend ?? [];
  const current = new Date();
  const expected = rooms
    .filter((room) => room.status === "occupied")
    .reduce((total, room) => total + room.monthlyRate, 0);
  return trend.map((point, index) => {
    const month = new Date(current.getFullYear(), current.getMonth() - (trend.length - index - 1), 1);
    const period = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: point.label,
      period,
      collected: point.amount,
      expected,
    };
  });
}

export async function getRecentActivities(limit = 6): Promise<Activity[]> {
  const summary = await getDashboardSummary();
  return (summary.recentActivity ?? []).slice(0, limit).map((activity) => ({
    id: activity.id,
    type: "invoice",
    message: activity.message,
    timestamp: activity.occurredAt,
    actor: "",
  }));
}

export async function getSettings(): Promise<ApiSetting[]> {
  return getAll<ApiSetting>("/settings");
}
