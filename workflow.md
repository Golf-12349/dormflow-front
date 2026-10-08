# Dormitory Management System — Frontend Development Roadmap

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · lucide-react
**Backend:** not available yet → **frontend-first** with a mocked data layer (`lib/mock-data.ts`).

Checkboxes are ticked as tasks are completed. Unfinished work for a phase stays unchecked so the
next session can pick it up without re-reading the whole codebase.

## Locked decisions

| Topic | Decision |
| --- | --- |
| UI language | Lao only for now; every user-facing string lives in `lib/i18n/lo.ts` (English keys, Lao values); no i18n library |
| UI font | Noto Sans Lao via `next/font/google` (subset lao) for Lao text, Geist stays first in the stack for Latin text and digits |
| Numbers and currency | keep en-US grouping (comma thousands) until a Lao speaker confirms; dates and relative time use the lo-LA locale |
| Routing | App Router, `app/` at project root, no `src/` folder |
| Aliases | `@/*` → project root (`@/types`, `@/lib/utils`, `@/components/...`) |
| Data access | Pages are **Server Components** and call async functions from `lib/mock-data.ts`; the mock layer is the only place that owns data so swapping in `fetch()` later is a one-file change |
| HTTP client | native fetch, one shared helper in `lib/api/client.ts`; handles auth header, response envelope unwrapping, and refresh-token rotation |
| Mutations | Server Actions in `lib/actions/*` (Next 16: `'use server'`, `redirect` outside `try/catch`) |
| Session | `httpOnly` cookie `dms_session` holding a base64url JSON payload; guards live in `lib/session.ts` (`getSession`, `verifySession`) |
| Route protection | Per-layout guard via `verifySession()` + `proxy.ts` (Next 16 renamed `middleware` → `proxy`) |
| Icons | `lucide-react` only |
| Theme | Single light admin theme; semantic tokens kept in `app/globals.css` |
| Currency | `CURRENCY` constant in `lib/utils.ts` (currently `USD`) |

## Commands

```bash
npm run dev    # next dev (Turbopack)
npm run build  # production build = type-check + compile
npm run lint   # eslint CLI (Next 16 removed `next lint`)
```

## Definition of done (per phase)

1. `npx tsc --noEmit` passes (explicit type-check).
2. `npm run lint` passes with no new errors or warnings.
3. `npm run build` passes (Next also type-checks and validates route/segment structure).
4. `workflow.md` checkboxes updated, with notes appended to the progress log.

> **Verification policy (do not change without agreement):** verification is limited to the three
> commands above plus running `npm run dev` and clicking through the affected screens by hand.
> No custom headless-browser, Puppeteer/CDP or ad-hoc E2E scripts are written or kept in the
> project — the temporary harnesses created during Phase 1/2 have been deleted.

---

## Phase 1 — Architecture & Mock Setup

- [x] 1.1 Install `lucide-react` for the shared icon set
- [x] 1.2 Define the domain TypeScript contract in `types/index.ts` (auth, rooms, tenants, utility readings, invoices, activities, dashboard metrics, list filters)
- [x] 1.3 Add shared helpers in `lib/utils.ts` (currency/date/period formatting, `cn`, relative time, status label + badge class maps)
- [x] 1.4 Build mock dataset + mock service API in `lib/mock-data.ts` (async functions, simulated latency, defensive cloning)
- [x] 1.5 Update root layout metadata and theme tokens in `app/globals.css`
- [x] 1.6 Verify `npm run build` + `npm run lint` pass with the mock layer installed

## Phase 2 — Authentication (Login)

- [x] 2.1 Session helpers in `lib/session.ts` (encode/decode `dms_session`, `getSession`, `verifySession` guard)
- [x] 2.2 Server Actions `loginAction` / `logoutAction` in `lib/actions/auth.ts`
- [x] 2.3 Build `/login` page (`app/login/page.tsx`) with brand panel and visible demo credentials
- [x] 2.4 Client login form (`useActionState`) with field validation, password visibility toggle and pending state
- [x] 2.5 Root `/` redirects by session state and `/dashboard` is guarded (placeholder shell until Phase 3/4 land)
- [x] 2.6 Verify the flow end to end: login → dashboard → logout → back to `/login` with redirect intact

**Auth manual QA checklist** (run in the browser via `npm run dev`; the code paths are also enforced
by the guard in `app/(app)/layout.tsx` and by `proxy.ts`)

- [ ] `/login` renders the admin form and the demo credentials card
- [ ] Wrong password → inline alert, stays on `/login`, no session cookie
- [ ] Invalid fields → "Enter a valid email address" / "Password must be at least 6 characters"
- [ ] `admin@dormhub.com` / `admin123` → redirects to `/dashboard`
- [ ] Visiting `/login` while signed in → bounced to `/dashboard`
- [ ] Sign out → back to `/login`, and `/dashboard` is unreachable again
- [ ] Anonymous request to a protected route → redirected to `/login` before render

## Phase 3 — Dashboard Layout & Shell

- [x] 3.1 `app/(app)/layout.tsx`: guarded shell (`verifySession()`) that renders sidebar + topbar around `children`. A route group keeps URLs clean (`/dashboard`, `/rooms`, …) while sharing one guard
- [x] 3.2 `components/layout/sidebar-nav.tsx` + `lib/navigation.ts`: brand block, grouped nav links (Overview, Rooms, Tenants / Billing, Settings) with lucide icons, `aria-current` active highlighting via `usePathname`
- [x] 3.3 `components/layout/topbar.tsx`: page title + description from the nav model, global search form (`GET /rooms?q=`), notification bell with unpaid-invoice count, user chip and sign-out
- [x] 3.4 Responsive behaviour: sticky desktop rail from `lg`, off-canvas drawer (role="dialog") below it, opened from the topbar; the drawer closes by derivation when the path changes
- [x] 3.5 `app/(app)/loading.tsx` skeleton so the mock layer's latency never shows a blank screen
- [x] 3.6 `proxy.ts` (Next 16 replacement for `middleware.ts`) doing a cheap cookie check before render; `verifySession()` remains the authoritative guard
- [x] 3.7 Placeholder routes for `/rooms`, `/tenants`, `/billing` (plus `/settings`) so the nav never 404s; each one renders live counts from the mock service and lists its own roadmap items

**Phase 3 implementation notes**

| Area | Decision |
| --- | --- |
| Shell ownership | `app/(app)/layout.tsx` is a Server Component: it verifies the session and fetches `unpaidInvoices` for the bell, then passes plain props to the shell |
| Client boundary | Only `app-shell.tsx`, `sidebar-nav.tsx` and `topbar.tsx` are Client Components (drawer state + `usePathname`) |
| Drawer state | Derived from `drawerPath === pathname` instead of an effect, which avoids cascading renders and keeps `react-hooks/set-state-in-effect` clean |
| Nav model | `lib/navigation.ts` holds sections, icons, hrefs and topbar descriptions; adding a screen is a one-line change |
| Topbar search | A real `GET` form to `/rooms?q=…`; `/rooms` already consumes `searchParams.q` through `getRooms({ query })` |

## Phase 4 — Dashboard Overview (`/dashboard`)

- [x] 4.1 Metric cards: total rooms, vacant, occupied, expected vs collected revenue (with trend deltas)
- [x] 4.2 Occupancy breakdown: stacked bar per floor + occupancy rate ring (from `getFloorOccupancy()`)
- [x] 4.3 Revenue chart for the last 6 periods (CSS/SVG bars from `getRevenueTrend()`)
- [x] 4.4 Recent activities feed with activity-type icons and relative timestamps
- [x] 4.5 Attention list: overdue invoices and rooms under maintenance ("needs action")
- [x] 4.6 Empty/loading states and accessible labels for every metric

## Phase 5 — Room Management (`/rooms`)

- [x] 5.1 Room grid view (cards with number, type, rate, tenant, status badge)
- [x] 5.2 Room list/table view with a grid ⇄ list view toggle
- [x] 5.3 Status badges via `ROOM_STATUS_BADGE_CLASSES` and legend chip row
- [x] 5.4 Filters: by floor (tabs) and by status (segmented control), plus text search on room number
- [x] 5.5 Filter state kept in the URL (`searchParams`) so views are shareable/refresh-safe
- [x] 5.6 Room detail drawer with tenant snapshot, amenities, meter history and rates
- [x] 5.7 Actions: change status (mark vacant/maintenance) through a mock mutation Server Action

## Localization (Lao)

**Status: complete (L1–L4) — every user-facing string in the app is Lao.** The only remaining
English on screen is data, not UI: the free-text fields in `lib/mock-data.ts` (activity sentences and
actors, room notes, amenity names) and the Latin product name "DormHub". Lao terms invented after L1
are flagged in the glossary below as pending native-speaker review; Phase 6 is written in Lao from the
start (see the notes under the progress log).

- [x] L1 Foundation: Noto Sans Lao font, html lang="lo", line-height safety tokens, skeleton dictionary `lib/i18n/lo.ts` and `lib/i18n/index.ts`
- [x] L2 Shell & Shared: app shell, navigation labels, login page, placeholder pages, status/role label maps, formatters (`lo-LA` dates/relative time), action messages — *L2a done (formatters, status labels, shell chrome, nav model); L2b done (login page + client form, auth + room-status action messages, placeholder wrapper, loading text, metadata titles, role labels). No plural branch anywhere.*
- [x] L3 Dashboard: overview metric cards, charts, activity feed, attention items, empty states in Lao — *L3 done: one new `dashboard` group in `lib/i18n/lo.ts`; every visible and screen-reader string in `app/(app)/dashboard/page.tsx` now comes from it (data-layer strings and the already-Lao formatters/label maps reused).*
- [x] L4 Rooms: room inventory view, cards, table, filter tabs, drawer details, status mutations in Lao — *L4 done: the existing `rooms` group in `lib/i18n/lo.ts` was extended (no new group, no duplicate keys, `errors` + the two success messages untouched); `app/(app)/rooms/**` and `lib/actions/rooms.ts` are Lao end-to-end, including the data-layer error passthrough.*

### Lao UI glossary (suggestions pending native speaker review)

| English | Lao | Notes |
| --- | --- | --- |
| Room | ຫ້ອງ | |
| Tenant | ຜູ້ເຊົ່າ | |
| Occupied | ມີຜູ້ເຊົ່າ | |
| Vacant | ຫວ່າງ | |
| Maintenance | ສ້ອມແປງ | |
| Reserved | ຈອງແລ້ວ | |
| Floor | ຊັ້ນ | |
| Rent | ຄ່າເຊົ່າ | |
| Deposit | ເງິນມັດຈຳ | |
| Invoice | ໃບແຈ້ງໜີ້ | |
| Paid | ຊຳລະແລ້ວ | |
| Partial | ຊຳລະບາງສ່ວນ | |
| Unpaid | ຍັງບໍ່ໄດ້ຊຳລະ | |
| Overdue | ເກີນກຳນົດ | |
| Overview | ພາບລວມ | |
| Billing | ໃບບິນ | |
| Settings | ການຕັ້ງຄ່າ | |
| Sign in | ເຂົ້າສູ່ລະບົບ | |
| Sign out | ອອກຈາກລະບົບ | |
| Password | ລະຫັດຜ່ານ | |
| Email | ອີເມວ | |
| Search | ຄົ້ນຫາ | |
| All | ທັງໝົດ | |
| Electricity | ໄຟຟ້າ | |
| Water | ນ້ຳ | |
| Meter | ມິເຕີ | |
| Lease | ສັນຍາເຊົ່າ | |
| Note | ໝາຍເຫດ | |
| Needs action | ຕ້ອງດຳເນີນການ | |
| Recent activity | ກິດຈະກຳຫຼ້າສຸດ | |
| Operations (nav section) | ການດຳເນີນງານ | |
| Finance & system (nav section) | ການເງິນ ແລະ ລະບົບ | |
| Tenant: active | ກຳລັງເຊົ່າ | |
| Tenant: pending | ລໍຖ້າ | |
| Tenant: inactive | ຢຸດເຊົ່າ | |
| Just now (relative time) | ຫາກໍ່ | sub-minute bucket only; longer spans come from `Intl.RelativeTimeFormat("lo")` |
| Dormitory console | ຄອນໂຊນຈັດການຫໍພັກ | sidebar brand subtitle |
| Role: admin | ຜູ້ດູແລລະບົບ | covers `UserRole`; shown on the shell role chip |
| Role: manager | ຜູ້ຈັດການ | |
| Role: staff | ພະນັກງານ | |
| Work email | ອີເມວທີ່ໃຊ້ວຽກ | login field label |
| Sign in to the admin console | ເຂົ້າສູ່ລະບົບຄອນໂຊນຈັດການ | login heading |
| Keep me signed in | ຢູ່ໃນລະບົບຕໍ່ | login checkbox |
| Forgot password? | ລືມລະຫັດຜ່ານ? | login; hint text points at the system admin |
| Demo credentials | ບັນຊີສາທິດ | login card heading |
| Signing in… | ກຳລັງເຂົ້າສູ່ລະບົບ… | login submit pending state |
| Planned in {phase} | ວາງແຜນໄວ້ໃນ {phase} | `{phase}` is roadmap data and stays English, e.g. "Phase 6" |
| Loading page… | ກຳລັງໂຫຼດໜ້າ... | `(app)` loading skeleton sr-only |
| Email is required. | ກະລຸນາປ້ອນອີເມວ. | login field error, `email` |
| Enter a valid email address. | ກະລຸນາປ້ອນອີເມວທີ່ຖືກຕ້ອງ. | login field error, `email` |
| Password is required. | ກະລຸນາປ້ອນລະຫັດຜ່ານ. | login field error, `password` |
| Password must be at least 6 characters. | ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ. | login field error, `password` |
| Please fix the highlighted fields. | ກະລຸນາແກ້ໄຂຊ່ອງຂໍ້ມູນທີ່ໄຮໄລທ໌ໄວ້. | login form alert |
| Invalid email or password. Use the demo credentials below. | ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ. ໃຊ້ບັນຊີສາທິດຂ້າງລຸ່ມນີ້. | login form alert |
| Room ID is required. | ຕ້ອງມີລະຫັດຫ້ອງ. | room status action |
| Target status must be either vacant or maintenance. | ສະຖານະປາຍທາງຕ້ອງເປັນ ຫວ່າງ ຫຼື ສ້ອມແປງ. | room status action |
| Room not found. | ບໍ່ພົບຫ້ອງ. | room status action |
| Status cannot be changed for {status} rooms. | ບໍ່ສາມາດປ່ຽນສະຖານະຂອງຫ້ອງທີ່ {status} ໄດ້. | `{status}` interpolated from `ROOM_STATUS_LABELS` |
| Room is already {status}. | ຫ້ອງນີ້ຢູ່ໃນສະຖານະ {status} ແລ້ວ. | `{status}` interpolated from `ROOM_STATUS_LABELS` |
| Transition from "{from}" to "{to}" is not allowed. | ບໍ່ອະນຸຍາດໃຫ້ປ່ຽນຈາກ "{from}" ເປັນ "{to}". | `{from}`/`{to}` interpolated from `ROOM_STATUS_LABELS` |
| Room {n} marked as under maintenance. | ຫ້ອງ {n} ຖືກໝາຍເປັນ ສ້ອມແປງ ແລ້ວ. | room status action success |
| Room {n} marked as vacant. | ຫ້ອງ {n} ຖືກໝາຍເປັນ ຫວ່າງ ແລ້ວ. | room status action success |
| Occupancy rate | ອັດຕາການເຂົ້າພັກ | dashboard ring + floor bars; already the wording used by `nav.overviewDescription` |
| Total rooms | ຫ້ອງທັງໝົດ | dashboard metric card |
| Active tenants | ຜູ້ເຊົ່າກຳລັງເຊົ່າ | dashboard metric hint + ring summary label |
| Expected revenue | ລາຍຮັບຄາດຫວັງ | dashboard metric label / chart series |
| Expected monthly revenue | ລາຍຮັບຄາດຫວັງຕໍ່ເດືອນ | dashboard metric card |
| Expected (series) | ຄາດຫວັງ | revenue chart legend + delta chip prefix |
| Collected | ເກັບໄດ້ | revenue chart legend + delta chip prefix |
| Outstanding | ຄ້າງຊຳລະ | revenue hint; keeps the `nav.tenantsDescription` wording |
| vs / versus | ທຽບກັບ | delta caption under each metric card + card aria copy |
| Welcome back | ຍິນດີຕ້ອນຮັບກັບມາ | dashboard heading |
| Snapshot / portfolio | ພາບລວມ | dashboard subtitle (same word as "Overview") |
| Occupancy by floor | ອັດຕາການເຂົ້າພັກແຕ່ລະຊັ້ນ | dashboard 4.2 section title |
| Revenue by period | ລາຍຮັບແຕ່ລະໄລຍະ | dashboard 4.3 section title |
| Billing period | ໄລຍະບິນ | revenue subtitle; period values come from `formatPeriodShort` |
| Billing period (selector label) | ໄລຍະບິນ | `t.billing.periodLabel` |
| Billed amount | ຍອດອອກບິນ | `t.billing.cards.billed` summary card |
| Utility rates (electricity & water) | ອັດຕາຄ່າໄຟຟ້າ ແລະ ນ້ຳ | `t.billing.cards.rates` summary card |
| Previous month | ເດືອນກ່ອນ | `t.billing.periodNav.previous` |
| Next month | ເດືອນຖັດໄປ | `t.billing.periodNav.next` |
| Meter reading | ການຈົດມິເຕີ | `t.billing.meter.sectionTitle` |
| Previous reading | ເລກກ່ອນ | `t.billing.meter.previous` |
| Current reading | ເລກປັດຈຸບັນ | `t.billing.meter.current` |
| Usage | ໃຊ້ໄປ | `t.billing.meter.usage` |
| Estimated cost | ຄ່າໃຊ້ຈ່າຍໂດຍປະມານ | `t.billing.meter.estimatedCost` |
| Recorded | ຈົດແລ້ວ | `t.billing.meter.recorded` |
| Mock data layer | ຊັ້ນຂໍ້ມູນສາທິດ | dashboard side card; consistent with the auth demo-build footer |
| Signed in as | ເຂົ້າສູ່ລະບົບໃນນາມ | value shown next to it comes from `t.roles` |
| due {date} | ກຳນົດ {date} | action-item detail line |
| No note recorded. | ບໍ່ມີໝາຍເຫດ. | maintenance item fallback |
| Nothing needs attention right now. | ຕອນນີ້ບໍ່ມີລາຍການທີ່ຕ້ອງດຳເນີນການ. | attention-list empty state |
| {n} rooms (classifier) | {n} ຫ້ອງ | counts read as "3 ຫ້ອງຈອງແລ້ວ"; Lao has no plural form |
| {n} tenants (classifier) | {n} ຄົນ | "ຜູ້ເຊົ່າກຳລັງເຊົ່າ 12 ຄົນ" |
| Not yet recorded (empty states) | ຍັງບໍ່ມີ… | the three dashboard empty-state sentences

*Note: The product name "DormHub" and digits stay Latin.*

## Phase 6 — Tenant Management (`/tenants`)

- [x] 6.1 Tenant table: avatar initials, contact, room, move-in date, lease expiry, balance, status
- [x] 6.2 Search + status filter + sorting by name/balance/lease end
- [x] 6.3 Tenant profile modal/view: contact details, emergency contact, room info, ledger of invoices
- [x] 6.4 Lease progress indicator and "expiring soon" highlight
- [x] 6.5 Mock mutations: add tenant, edit contact, check-out tenant
- [x] 6.6 Empty state and per-row action menu

## Phase 7 — Billing & Utilities (`/billing`)

- [x] 7.1 Period selector (current billing period default) with previous/next navigation
- [ ] 7.2 Electric + water meter entry form per room with previous/current readings and live consumption preview
- [ ] 7.3 Validation: current reading must be ≥ previous, no duplicate period entry, per-room feedback
- [ ] 7.4 Invoice generation from saved readings (room fee + electric + water + other fees, totals recomputed)
- [ ] 7.5 Invoice table/list with status badges, paid/outstanding totals and a printable invoice view
- [ ] 7.6 Record payment action (partial payments update status to `partial`)
- [ ] 7.7 Utility rate settings (per kWh / per m³) surfaced from the mock service

---

## Cross-cutting backlog (after Phase 7)

- [ ] Replace the mock layer with real fetch calls through `lib/api/client.ts` and delete `lib/mock-data.ts`
- [ ] Toast/notification system for Server Action results
- [ ] Dark theme pass using the existing CSS variables
- [ ] Optional: adopt a standard, framework-based test runner (e.g. Vitest for `lib/*`, Playwright for flows) if the team wants automated coverage — no hand-rolled browser scripts (see the verification policy above)
- [ ] Pagination/virtualisation once the dataset exceeds a few hundred rows

## Progress log

| Date | Phase | Notes |
| --- | --- | --- |
| 2026-09-16 | Phase 1 | `lucide-react` installed; domain contract in `types/index.ts`; helpers in `lib/utils.ts`; mock dataset + service in `lib/mock-data.ts`; root layout metadata + theme tokens updated. `tsc --noEmit`, `eslint` and `next build` all clean |
| 2026-09-16 | Phase 2 | Cookie session layer (`lib/session.ts`), auth Server Actions (`lib/actions/auth.ts`), `/login` page + client form, root redirect and guarded route. Behaviour checked by hand in the browser: wrong password, field validation, login redirect, httpOnly cookie, bounce-back from `/login`, sign-out, guard after sign-out |
| 2026-09-16 | Phase 3 | Authenticated shell: `app/(app)/` route group with guarded layout, `lib/navigation.ts` nav model, `sidebar-nav.tsx`, `topbar.tsx`, `app-shell.tsx`, `app/(app)/loading.tsx`, `proxy.ts` cookie pre-check and placeholders for `/rooms`, `/tenants`, `/billing`, `/settings`. Cleanup: removed the temporary debug route and every ad-hoc test script/log |
| 2026-09-16 | Housekeeping | Verification policy narrowed to `npx tsc --noEmit`, `npm run lint`, `npm run build` (+ manual click-through). `app/api/_debug` and all `%TEMP%` harness files deleted |
| 2026-09-24 | Infrastructure | `axios` added — the first runtime dependency beyond next/react/lucide-react: the real backend answers with a JSON `{ success, message, data?, errors?, traceId? }` envelope, so axios is the agreed HTTP client (see locked decisions). `lib/api/client.ts` (base URL, Bearer header, envelope unwrapping, single 401 refresh + token rotation) lands as infrastructure only — no page is wired to it yet, `lib/mock-data.ts` still owns every screen |
| 2026-09-24 | Infrastructure | axios tried and reverted: `lib/api/client.ts` now uses native `fetch` (still infra only, no page wired to it). Reason: an extra dependency buys nothing here — `fetch()` is built in and Next.js already extends it with caching/revalidation, while envelope unwrapping, the auth header and the single 401 refresh are a few lines of code in the client. `axios` uninstalled; locked decisions + backlog say `fetch()` again |
| 2026-09-25 | Phase 4 | Overview screen complete at `app/(app)/dashboard/page.tsx`: 4.1 metric cards with trend deltas against `shiftPeriod()`; 4.2 floor occupancy stacked bars + pure-SVG occupancy rate ring; 4.3 6-period revenue comparison via pure CSS bars; 4.4 operations activity feed with relative timestamps and Lucide icons; 4.5 unified attention list combining overdue invoices and rooms under maintenance; 4.6 empty states and accessible `aria-label`/`role="img"` attributes across cards, charts, and lists. Build, tsc and lint clean. |
| 2026-09-28 | Phase 5 | Room inventory complete at `app/(app)/rooms/page.tsx`: 5.1/5.2 responsive card grid and list table with toggle; 5.3 status badges with semantic colors and interactive legend row; 5.4/5.5 URL-synchronized filters (floor tabs, status control, debounced room search); 5.6 detail drawer with tenant snapshot, utility rates, amenities chips, meter history; 5.7 status mutation Server Action (vacant ⇄ maintenance, note clearing, revalidation) in `lib/actions/rooms.ts` and mock handler `updateRoomStatus` on `globalThis`. Added `app/(app)/rooms/status-badge.tsx`, `app/(app)/rooms/room-detail-drawer.tsx`, `lib/actions/rooms.ts`; updated `app/(app)/rooms/room-inventory-view.tsx`, `app/(app)/rooms/page.tsx`, `lib/mock-data.ts`, `types/index.ts`. Build, tsc and lint clean. |
| 2026-09-28 | Localization | L1 Foundation complete: Noto Sans Lao via `next/font/google` (`--font-noto-sans-lao`, subset lao) loaded alongside Geist Sans; `<html lang="lo">`; Tailwind v4 typography line-height tokens adjusted to 1.6 in `app/globals.css`; zero-dependency dictionary skeleton in `lib/i18n/lo.ts` and `lib/i18n/index.ts`. Build, tsc and lint clean. |
| 2026-09-29 | Localization | L2a done — dates/times (`formatDate`, `formatDateTime`, `formatPeriod`, `formatPeriodShort`) moved to `lo-LA`; `formatRelativeTime` rewritten on `Intl.RelativeTimeFormat("lo", { numeric: "always" })` with an unchanged threshold/rounding ladder and the literal `ຫາກໍ່` kept for the sub-minute bucket; currency/number formatters untouched (`en-US` grouping is locked). Status label maps translated (`ROOM_STATUS_LABELS`, `TENANT_STATUS_LABELS`, `INVOICE_STATUS_LABELS`; badge/dot class maps untouched). Dictionary gained `nav` and `shell` groups and `lib/navigation.ts` now sources section titles, labels and topbar subtitles from them, so the sidebar and topbar are Lao from one place. Shell clipping fixes: dropped `leading-tight` in `sidebar-nav.tsx` (L38) and `topbar.tsx` (L87), raised `text-[11px]` → `text-xs` at `sidebar-nav.tsx` L42/L54 and L98, and the numeric bell badge `text-[10px]` → `text-[11px]` (`topbar.tsx` L74). Noto Sans Lao was fetched and bundled by `next build`; tsc, lint and build clean. No browser check (headless session). |
| 2026-09-30 | Localization | L2b done, L2 now complete — dictionary gained `auth`, `placeholders`, `loading`, `roles`, `meta` and `rooms` groups (`common` / `nav` / `shell` unchanged). `/login` page + client form wired to `t.auth.*` (headings, field labels, checkbox, "Forgot password?", submit idle/pending, 4 highlights, demo-build footer, demo-credentials card); example data stays Latin (`admin@dormhub.com` placeholder, STAFF_ACCOUNTS emails/passwords, "DormHub", digits). Server Action messages translated with meaning and field attachment unchanged: `lib/actions/auth.ts` (4 field errors + 2 form alerts) and `lib/actions/rooms.ts` (error/success messages; dynamic statuses now interpolate `ROOM_STATUS_LABELS`). `PagePlaceholder` wrapper line → `t.placeholders.plannedIn(phase)` (phase data stays English); `(app)` loading sr-only → `t.loading.page`. Role chips in `sidebar-nav.tsx` / `topbar.tsx` now look up `t.roles` with raw-value fallback (never triggers — `UserRole` is exactly `admin`, `manager`, `staff`; `capitalize` kept for the fallback path). Login demo-card role column also uses `t.roles`. Metadata: `/login` title → `t.auth.title`, `/tenants` / `/billing` / `/settings` titles → `t.nav.*`, root default/description → `t.meta.*`; `%s · DormHub` template left alone (language-neutral). Deliberately untouched: `app/(app)/dashboard/page.tsx` "Dashboard" and `app/(app)/rooms/*` "Rooms" titles (L3/L4 own those files), the two `updateRoomStatus` data-layer error strings inside `lib/mock-data.ts` (returned via `result.error`; do-not-touch), and `settings/page.tsx:45` `toLocaleString("en-US")` (page content is Phase 7 scope). Clipping fixes in touched files: `leading-snug` added to big Lao headings (`login/page.tsx` h1 `text-4xl` L63, h2 `text-2xl` L105, `page-placeholder.tsx` h2 `text-2xl` L30). No `leading-tight`/`leading-none` and no sub-`text-xs` sizes remain anywhere outside L3/L4 files (only the bell badge `text-[11px]` is kept, L2a decision). tsc, lint and build clean. No browser check (headless session). |
| 2026-10-01 | Localization | L3 done — dictionary gained exactly one new `dashboard` group (`common` / `nav` / `shell` / `auth` / `placeholders` / `loading` / `roles` / `meta` / `rooms` unchanged), with parameterized strings as functions and no plural branch. `app/(app)/dashboard/page.tsx` is Lao end-to-end: welcome heading + snapshot line; the four metric cards (labels, hints, delta-chip prefixes, `vs <previous period>` caption, and the composed card `aria-label`); occupancy-by-floor section (title/subtitle/legend, per-floor label, `9/24 … · 38%` summary, stacked-bar `aria-label`); occupancy-rate ring (title, `aria-label`, caption); revenue chart (title/subtitle, `Expected`/`Collected` legend + delta prefixes, per-bar `aria-label`); mock-layer card (title + 3 rows, role value now via `t.roles`); activity-feed chrome (title/subtitle/`aria-label`); needs-action list (`aria-label` count, `Room {n} · <period> · <due date>` detail, room title, floor meta, "no note" fallback) and all four `EmptyState` messages. Metadata `title: "Dashboard"` → `t.nav.overview`, the same reuse pattern L2b used for `/tenants` `/billing` `/settings`. Reused rather than re-translated: `ROOM_STATUS_LABELS`, `INVOICE_STATUS_LABELS`, `formatCurrency`, `formatDate`, `formatPeriod`, `formatPeriodShort`, `formatRelativeTime`, `t.roles`. Deliberately left as data (do-not-touch): `activity.message` / `activity.actor` (English sentences in `lib/mock-data.ts`) and `point.label` (already Lao via `formatPeriodShort`). Clipping: `leading-snug` on the `text-2xl` welcome heading; `text-[11px]` → `text-xs` on the delta chip, the `vs` caption, the ring caption, the chart period label and the status badge; `text-[10px]` → `text-[11px]` on the chart amount list keeping `leading-tight` (pure currency digits, matching the L2a numeric floor); the ring's `leading-none` moved off the flex container onto the numeric `%` span so the Lao caption can no longer clip a tone mark; `truncate` kept on the action-item title as overflow safety only. tsc, lint and build clean (8 routes + proxy); dashboard server chunk verified to contain `t.dashboard.*` lookups and none of the old English literals. No browser check (headless session). |
| 2026-10-02 | Localization | L4 done — the existing `rooms` group in `lib/i18n/lo.ts` was extended (no new group, no duplicate keys); all 5 files under `app/(app)/rooms/**` and `lib/actions/rooms.ts` are Lao end-to-end including the data-layer error passthrough; no English UI-chrome or tenant-slot text remains. |
| 2026-10-07 | Phase 6 | Tenant management complete (`/tenants`): 6.1 record table (avatar initials, contact, room, move-in, lease expiry, balance, status); 6.2 search + status filter + name/balance/lease-end sort; 6.3 profile drawer (contact, emergency, room, lease, invoice ledger) with 6.4 lease progress bar + "expiring soon" highlight; 6.5 mutations — add tenant (`createTenantAction`), edit contact (`updateTenantContactAction`), check-out (`checkOutTenantAction`: tenant → `inactive` and its room → `vacant` in the same write, mirroring the `updateRoomStatus` store style so both `globalThis` stores stay consistent) — each with `useActionState` + pending + inline `role="status"` result and server re-validation; 6.6 zero-result empty state (same treatment as Rooms 5.4) and a per-row kebab menu (view profile / check out; closes on outside click and Escape; viewport-anchored so the table's `overflow-hidden` cannot clip it). Added `app/(app)/tenants/add-tenant-form.tsx`, `app/(app)/tenants/tenant-form-field.tsx`, `app/(app)/tenants/tenant-row-menu.tsx`, `lib/actions/tenants.ts`; updated `app/(app)/tenants/page.tsx`, `app/(app)/tenants/tenant-table.tsx`, `app/(app)/tenants/tenant-detail-drawer.tsx`, `lib/mock-data.ts` (`TENANTS` moved onto `globalThis`; `createTenant` / `updateTenantContact` / `checkOutTenant` added), `lib/i18n/lo.ts` (`tenants` group extended), `types/index.ts` (form-state types). tsc, lint and build clean; `/tenants`, `/rooms` and `/dashboard` verified rendering through `next dev`. |


### Notes for the next session (Phase 7 — Billing & Utilities)

- Phase 6 is closed (6.1–6.6 all `[x]`): `/tenants` now has the record table, search/status filter/sort, the profile drawer with lease progress, and all three mutations (add tenant, edit contact, check-out) as Server Actions. Localization stays fully done (L1–L4).
- Next task is Phase 7 — Billing & Utilities (`/billing`), see its checklist above (7.1 period selector → 7.7 utility rates). The screen is still the `PagePlaceholder`, but it already reads `getInvoices({ period })`, `getUtilityReadings(period)` and `getUtilityRates()` as a Server Component, so the phase can replace it screen-first.
- Phase 7 writes Lao from the start (the established convention): every new user-facing string goes into `lib/i18n/lo.ts` as the component is written — add one new top-level group (e.g. `billing`) rather than localizing after the fact, and never add an English placeholder step. Same clipping rules: no `leading-tight`/`leading-none` beside Lao text, no sub-`text-xs` sizes unless the element is pure digits/currency; English that stays English is data only (mock free-text, "DormHub", digits).
- Reuse rather than re-translate: `INVOICE_STATUS_LABELS` / `INVOICE_STATUS_BADGE_CLASSES`, `ROOM_STATUS_LABELS`, `TENANT_STATUS_LABELS`, `formatCurrency`, `formatPeriod`, `formatPeriodShort`, `formatDate`, `t.common`, `t.roles`.
- Mutations (invoice generation, recording payments, rate changes) follow the `lib/actions/rooms.ts` / `lib/actions/tenants.ts` pattern: `'use server'` async exports, `useActionState` state shape, server re-validation before every write, English mock-data errors localised through a `DATA_LAYER_ERROR_TRANSLATIONS` table, then `revalidatePath` for every screen the change touches.