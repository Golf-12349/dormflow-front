#!/usr/bin/env node

/**
 * Script for seeding Somsak Vongvilay (ທ້າວ ສົມສັກ ວົງວິໄລ),
 * Room 201 (ຫ້ອງ 201, ອາຄານ A, ຊັ້ນ 2), Active Lease Contract,
 * Meter Readings (2026-11), and First Invoice (1,685,000 LAK)
 * into DormFlow backend database.
 *
 * Usage:
 *   node scripts/seed-somsak.mjs
 *   node scripts/seed-somsak.mjs --email <admin-email> --password <admin-password>
 *   node scripts/seed-somsak.mjs --token <bearer-token>
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://dormflow-flowerdev.onrender.com/api/v1").replace(/\/+$/, "");

console.log("==================================================");
console.log("🌱 DormFlow Database Seeding: Somsak & Room 201");
console.log(`🌐 Target API: ${API_BASE_URL}`);
console.log("==================================================");

// Parse CLI flags
const args = process.argv.slice(2);
let token = process.env.AUTH_TOKEN || null;
let email = process.env.ADMIN_EMAIL || null;
let password = process.env.ADMIN_PASSWORD || null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--token" && args[i + 1]) token = args[++i];
  if (args[i] === "--email" && args[i + 1]) email = args[++i];
  if (args[i] === "--password" && args[i + 1]) password = args[++i];
}

async function api(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const errorMsg = json.errors ? JSON.stringify(json.errors) : (json.message || res.statusText);
    throw new Error(`[${res.status} ${options.method || "GET"} ${path}] ${errorMsg}`);
  }

  return json.data !== undefined ? json.data : json;
}

async function ensureAuth() {
  if (token) {
    console.log("🔑 Using provided Bearer token.");
    return;
  }

  // If credentials not provided, try common seed admin credentials
  const candidates = [
    { email: email || "admin@dormflow.local", password: password || "change-this-password" },
    { email: "admin@dormflow.local", password: "Admin@123" },
    { email: "admin@dormhub.com", password: "Admin@123" },
    { email: "admin@dormhub.com", password: "admin123" },
  ];

  console.log("🔐 Authenticating with backend...");
  for (const c of candidates) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      if (res.ok) {
        const d = await res.json();
        token = d.data.accessToken;
        console.log(`✅ Authenticated successfully as ${d.data.user.email} (${d.data.user.firstName} ${d.data.user.lastName})`);
        return;
      }
    } catch {}
  }

  console.warn("⚠️ Could not authenticate automatically with default credentials.");
  console.log("💡 You can either:");
  console.log("  1) Run via the Web UI: Open http://localhost:3000/api/seed-somsak in your browser where you are already logged in!");
  console.log("  2) Or supply credentials: node scripts/seed-somsak.mjs --email <email> --password <password>");
  console.log("  3) Or supply token: node scripts/seed-somsak.mjs --token <token>");
  process.exit(1);
}

async function runSeed() {
  await ensureAuth();

  console.log("\n1️⃣ Checking Dormitory...");
  const dorms = await api("/dormitories?pageSize=50");
  let dormList = dorms.items || dorms;
  let dorm = dormList[0];
  if (!dorm) {
    console.log("  Creating default dormitory 'Test Dormitory'...");
    dorm = await api("/dormitories", {
      method: "POST",
      body: { name: "Test Dormitory", code: "DORM-01", address: "ນະຄອນຫຼວງວຽງຈັນ", phone: "020 5555 6666" },
    });
  }
  const dormitoryId = dorm.id;
  console.log(`  ✓ Dormitory: ${dorm.name} (${dormitoryId})`);

  console.log("\n2️⃣ Checking Building A (ອາຄານ A)...");
  const blds = await api(`/buildings?dormitoryId=${dormitoryId}&pageSize=50`);
  let bldList = blds.items || blds;
  let building = bldList.find((b) => b.name === "ອາຄານ A" || b.code === "A");
  if (!building) {
    console.log("  Creating Building A...");
    building = await api("/buildings", {
      method: "POST",
      body: { dormitoryId, code: "A", name: "ອາຄານ A", totalFloors: 3 },
    });
  }
  const buildingId = building.id;
  console.log(`  ✓ Building: ${building.name} (${buildingId})`);

  console.log("\n3️⃣ Checking Floor 2 (ຊັ້ນ 2)...");
  const floors = await api(`/floors?buildingId=${buildingId}&pageSize=50`);
  let floorList = floors.items || floors;
  let floor = floorList.find((f) => f.floorNumber === 2);
  if (!floor) {
    console.log("  Creating Floor 2...");
    floor = await api("/floors", {
      method: "POST",
      body: { buildingId, floorNumber: 2, name: "ຊັ້ນ 2" },
    });
  }
  const floorId = floor.id;
  console.log(`  ✓ Floor: ${floor.name || "Floor 2"} (${floorId})`);

  console.log("\n4️⃣ Checking Room Type 'Standard'...");
  const roomTypes = await api(`/room-types?dormitoryId=${dormitoryId}&pageSize=50`);
  let rtList = roomTypes.items || roomTypes;
  let roomType = rtList.find((rt) => rt.code === "STD" || rt.name.toLowerCase() === "standard");
  if (!roomType) {
    console.log("  Creating Room Type Standard...");
    roomType = await api("/room-types", {
      method: "POST",
      body: {
        dormitoryId,
        code: "STD",
        name: "Standard",
        monthlyRent: 1200000,
        depositAmount: 1200000,
        maximumOccupants: 2,
      },
    });
  }
  const roomTypeId = roomType.id;
  console.log(`  ✓ Room Type: ${roomType.name} (${roomTypeId})`);

  console.log("\n5️⃣ Checking Room 201...");
  const rooms = await api("/rooms?pageSize=100");
  let rmList = rooms.items || rooms;
  let room = rmList.find((r) => r.buildingId === buildingId && r.roomNumber === "201");
  if (!room) {
    console.log("  Creating Room 201...");
    room = await api("/rooms", {
      method: "POST",
      body: {
        buildingId,
        floorId,
        roomTypeId,
        roomNumber: "201",
        monthlyRent: 1200000,
        depositAmount: 1200000,
        maximumOccupants: 2,
        description: "ຫ້ອງພັກ Standard ພ້ອມເຟີນິເຈີ ແລະ ເຄື່ອງປັບອາກາດ",
      },
    });
  }
  const roomId = room.id;
  console.log(`  ✓ Room 201 (${roomId})`);

  console.log("\n6️⃣ Checking Tenant Somsak Vongvilay (ທ້າວ ສົມສັກ ວົງວິໄລ)...");
  const tenants = await api("/tenants?pageSize=100");
  let tntList = tenants.items || tenants;
  let tenant = tntList.find((t) => (t.firstName === "ທ້າວ ສົມສັກ" && t.lastName === "ວົງວິໄລ") || t.phone === "020 5551 2345");
  if (!tenant) {
    console.log("  Creating Tenant Somsak...");
    tenant = await api("/tenants", {
      method: "POST",
      body: {
        firstName: "ທ້າວ ສົມສັກ",
        lastName: "ວົງວິໄລ",
        email: "somsak.vongvilay@dormflow.local",
        phone: "020 5551 2345",
        nationalId: "010203040506",
        address: "ນະຄອນຫຼວງວຽງຈັນ",
        emergencyContactName: "ນາງ ມະນີວອນ",
        emergencyContactPhone: "020 9998 7766",
      },
    });
  }
  const tenantId = tenant.id;
  console.log(`  ✓ Tenant: ${tenant.firstName} ${tenant.lastName} (${tenantId})`);

  console.log("\n7️⃣ Checking Lease Contract...");
  const contracts = await api("/contracts?pageSize=100");
  let cntList = contracts.items || contracts;
  let contract = cntList.find((c) => c.roomId === roomId && c.tenantId === tenantId);
  if (!contract) {
    console.log("  Creating Lease Contract for Room 201...");
    contract = await api("/contracts", {
      method: "POST",
      body: {
        roomId,
        tenantId,
        startDate: "2026-11-01",
        endDate: "2027-04-30",
        monthlyRent: 1200000,
        depositAmount: 1200000,
        waterRatePerUnit: 5000,
        electricityRatePerUnit: 2500,
        notes: "ສັນຍາເຊົ່າ 6 ເດືອນ ຫ້ອງ 201 - ທ້າວ ສົມສັກ ວົງວິໄລ",
      },
    });

    try {
      await api(`/contracts/${contract.id}/activate`, { method: "POST" });
      console.log("  ✓ Contract activated.");
    } catch (e) {
      console.log("  Contract activation notice:", e.message);
    }
  }
  const contractId = contract.id;
  console.log(`  ✓ Contract: ${contractId}`);

  console.log("\n8️⃣ Recording Meter Readings (2026-10 Initial & 2026-11 Current)...");
  try {
    await api("/meter-readings", {
      method: "POST",
      body: { roomId, meterType: "Electricity", periodMonth: "2026-10-01", readingDate: "2026-10-31", currentReading: 1450 },
    });
    console.log("  ✓ October Electricity initial: 1,450 kWh");
  } catch {}

  try {
    await api("/meter-readings", {
      method: "POST",
      body: { roomId, meterType: "Water", periodMonth: "2026-10-01", readingDate: "2026-10-31", currentReading: 230 },
    });
    console.log("  ✓ October Water initial: 230 m³");
  } catch {}

  try {
    await api("/meter-readings", {
      method: "POST",
      body: { roomId, meterType: "Electricity", periodMonth: "2026-11-01", readingDate: "2026-11-30", currentReading: 1620 },
    });
    console.log("  ✓ November Electricity: 1,620 kWh (Usage: 170 kWh)");
  } catch {}

  try {
    await api("/meter-readings", {
      method: "POST",
      body: { roomId, meterType: "Water", periodMonth: "2026-11-01", readingDate: "2026-11-30", currentReading: 242 },
    });
    console.log("  ✓ November Water: 242 m³ (Usage: 12 m³)");
  } catch {}

  console.log("\n9️⃣ Checking Monthly Invoice for 2026-11...");
  const invoices = await api("/invoices?pageSize=100");
  let invList = invoices.items || invoices;
  let invoice = invList.find((i) => i.contractId === contractId && i.periodMonth.startsWith("2026-11"));
  if (!invoice) {
    console.log("  Generating Invoice for 2026-11...");
    invoice = await api("/invoices", {
      method: "POST",
      body: {
        contractId,
        periodMonth: "2026-11-01",
        notes: "ໃບບິນຄ່າເຊົ່າ ແລະ ຄ່ານ້ຳ-ຄ່າໄຟ ປະຈຳເດືອນ 11/2026",
      },
    });

    try {
      await api(`/invoices/${invoice.id}/issue`, { method: "POST" });
      console.log("  ✓ Invoice issued (Status: UNPAID/Issued)");
    } catch {}
  }
  console.log(`  ✓ Invoice: ${invoice.id || invoice.invoiceNumber}`);

  console.log("\n==================================================");
  console.log("🎉 Seeding Completed Successfully!");
  console.log("👉 Please refresh http://localhost:3000/tenants and http://localhost:3000/rooms");
  console.log("==================================================");
}

runSeed().catch((err) => {
  console.error("\n❌ Seeding failed:", err.message);
  process.exit(1);
});
