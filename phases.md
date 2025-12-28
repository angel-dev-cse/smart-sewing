## 🧭 SMART SEWING SOLUTIONS — MASTER PHASE ROADMAP (v3.6 FINAL — patched for Assets + outsourcing + calendars + offline safety + controlled edits)

> **Design goal:** fast daily shop operations (sales, purchases, stock, payments)  
> **Rule:** documents drive inventory & ledger (no “magic stock changes”)  
> **Ops goal:** everything important is linkable + searchable later (who/what/where/why)

---

## ✅ PHASE 1 — Public Shop Foundation (DONE)

- Product listing & detail pages
- Cart & checkout flow
- Order creation
- Payment instructions (Bkash / Nagad / Bank)
- Basic customer checkout UX

---

## ✅ PHASE 2 — Admin Orders & Payments (DONE)

- Admin dashboard
- Orders list & detail
- Confirm / cancel orders
- Payment status tracking
- Admin route protection

---

## ✅ PHASE 3 — Payment Tracking Enhancements (DONE)

- Manual payment confirmation
- Transaction reference storage
- Admin filters (status / payment)
- Clean order lifecycle

---

## ✅ PHASE 4 — Sales Invoices (DONE)

- Inventory movement model (movements tied to docs)
- Sales invoice draft → issue/cancel
- Inventory OUT on issue
- Printable invoice
- Order → Invoice automation + admin UX improvements

---

## ✅ PHASE 5 — Inventory Ledger & Adjustments (DONE)

- Manual stock adjustments with before/after
- Movements UI + adjustment docs UI + references/filtering

---

## ✅ PHASE 6 — Accounting + Rentals (DONE)

- Ledger accounts/categories/entries + admin UI
- Rental contracts lifecycle (Draft → Active → Closed)
- Stock lock via rental
- Rental bills + admin module (list/detail/print)
- Issue/cancel/mark paid + ledger integration

---

# ✅ PHASE 7 — Daily Operations Documents (DONE)

## ✅ PHASE 7A — Counter Sales (POS / Sales Bills) (DONE)

- Fast POS bill create
- Product search + quick add qty
- Payment selection (Cash/Bkash/Nagad/Bank) → Ledger IN
- Inventory OUT + movement refs
- Print-friendly
- Optional customer info (walk-in)

## ✅ PHASE 7B — Purchases (Supplier Bills / Stock IN) (DONE)

- Purchase bill document
- Stock IN + movement refs
- Pay now / pay later support
- Purchase payments table + ledger OUT integration
- Printable purchase bill (MVP)

## ✅ PHASE 7C — Parties + Contacts (Customers / Suppliers) (DONE)

- Party master (Customer/Supplier/Both behavior as implemented)
- Link parties to documents (sales/purchase/rentals)
- Party detail timeline (linked docs)
- Quick-add party from purchase/POS flows

**Known gap (keep for later):**
- Party selection should auto-fill more fields in rental contract UI (nice-to-have).

## ✅ PHASE 7D — Returns, Corrections, Write-offs (DONE)

- Sales return (Inventory IN back + refund ledger OUT)
- Purchase return (Inventory OUT back + refund ledger IN)
- Write-off/scrap document (Inventory OUT with reason)
- Guardrails to prevent repeated returns beyond remaining qty (added later around 8A.1)

**Known gap (keep for later):**
- Edit existing documents (out of MVP scope for now; requires audit strategy).

---

# 🟡 PHASE 8 — Operations & Tracking (IN PROGRESS)

## ✅ PHASE 8A — Reports (MVP) (DONE)

- Today/month sales summary
- Cash/Bkash/Nagad/Bank summaries (from ledger)
- Low stock
- Unpaid/partial invoices/bills
- Rental income summary

### ✅ PHASE 8A.1 — “Ops glue” improvements (DONE)
*(This was necessary for MVP usability; it’s now a formal subphase.)*

- Add payments against **Sales Invoices** (partial/full) with ledger links
- Fix/guard returns logic (avoid infinite repeated return for same invoice beyond remaining qty)
- Ledger entries page: clickable links for most refs (including Sales Invoice ref link fixed)

---

## ✅ PHASE 8B — Inventory UX Upgrade (DONE)

- Inventory filters + sorting (as committed)

---

## ✅ PHASE 8C — Locations / Warehouses (DONE)

**Purpose:** “Where is it?” and stock by location.

### ✅ PHASE 8C.1 — Location foundation (DONE)
- `Location` table (SHOP/WAREHOUSE/SERVICE)
- `InventoryMovement.fromLocationId / toLocationId` (nullable)
- Seed default locations

### ✅ PHASE 8C.2 — Location stock + transfers (DONE)
- `LocationStock` table (productId + locationId unique, qty)
- Seed/migration helper to initialize SHOP qty from existing `Product.stock`
- Stock-affecting documents should update `LocationStock` (MVP rule: assume SHOP unless specified)
  - Purchases → SHOP +qty
  - Sales/POS → SHOP -qty
  - Sales returns → SHOP +qty
  - Purchase returns → SHOP -qty
  - Write-offs → SHOP -qty
- Transfers:
  - Transfer doc + items
  - Validations: enough stock at FROM location
  - Update `LocationStock` from/to
  - Create `InventoryMovement` with both `fromLocationId` and `toLocationId`
- Admin UI:
  - Transfers list
  - New transfer page
  - (Optional later) transfer detail page

---

## 🟡 PHASE 8D — Unit Tracking (Assets) (ACTIVE / NOT STARTED)

**Purpose:** “Which exact unit is this?” (serial/tag, status, history, owner, location)

**Business reality (must support):**
- `OWNED` units (shop stock)
- `CUSTOMER_OWNED` units (service intake; not stock)
- `RENTED_IN` units (outsourced temporarily to fulfill orders; not owned)

**Core rule alignment (no confusion):**
- **Documents drive inventory & ledger.**
- Units/assets do **not** create stock changes or ledger entries by themselves.
- Units/assets represent **identity + lifecycle**, while documents represent **transactions**.

### ✅ 8D.1 — Unit foundation + product tracking flags + serial policy (MVP)
- Product = SKU/catalog
- Unit/Asset = physical identity record (serial/tag, owner, status, location, notes)

**Add to Product:**
- `Product.isAssetTracked` (default false)
- `Product.serialRequired` (default false)
  - All machines: `serialRequired=true`
  - Some parts: may be true when needed (motor/board/pedal/etc)

**Ownership types (enum):**
- `OWNED`
- `CUSTOMER_OWNED`
- `RENTED_IN`

**Unit fields (MVP):**
- `id`
- `ownershipType`
- `productId`
  - required for `OWNED` and `RENTED_IN`
  - optional for `CUSTOMER_OWNED` (may not exist in catalog)
- `manufacturerSerial` (nullable; required if product.serialRequired=true)
- `uniqueSerialKey` (computed; unique)
  - collision-safe: `BRAND-MODEL-SERIAL` (e.g., `JUKI-708D-000515`)
- `tagCode` (shop tag; required when manufacturerSerial missing for tracked units)
  - internal formats: `SS-M-000001` (machines), `SS-P-000001` (parts)
- `ownerPartyId`
  - required for `CUSTOMER_OWNED` and `RENTED_IN`
  - null for `OWNED`
- `brand` and `model` (mandatory for machines to form serial key correctly)
  - also required for `CUSTOMER_OWNED` if productId is null
- `status` enum
- `currentLocationId` (default SHOP; selectable on intake)
- `notes` (optional)
- `createdAt`

**Status enum (MVP standard):**
- `AVAILABLE`
- `IN_SERVICE`
- `IDLE_AT_CUSTOMER` (billing stops; used in rentals)
- `RENTED_OUT` (future use)
- `RENTED_IN_ACTIVE` (while in your control)
- Terminal:
  - `SOLD`
  - `SCRAPPED`
  - `RETURNED_TO_SUPPLIER`
  - `RETURNED_TO_CUSTOMER`

**Serial policy:**
- Enforce uniqueness on `uniqueSerialKey` (not raw manufacturerSerial), so collisions are handled cleanly.
- Store both manufacturerSerial and uniqueSerialKey for audit.

**Admin UX:**
- Units list: search serial/tag, filter ownershipType/status/location/product
- Create unit:
  - For OWNED/RENTED_IN → product must be asset-tracked
  - For CUSTOMER_OWNED → allow productId or free-text brand/model
- Unit detail/edit: status/location/notes (guard terminal states)

> **Commit rule 8D.1:** only mark DONE when: product flags + ownership types + unit CRUD + serialKey uniqueness + serialRequired enforcement + location selection works + no stock/ledger side effects.

---

### ✅ 8D.2 — Mandatory unit intake on acquisition (OWNED via Purchase Bills)
**Goal:** no shop-owned tracked machine enters stock without a unit identity.

- Purchase Bills:
  - if product.isAssetTracked=true and qty=N → must assign N OWNED units during receiving.
  - Receiving location selectable (default SHOP; can be WAREHOUSE/SERVICE too)
- Purchase still creates:
  - InventoryMovement IN
  - LocationStock increases at chosen location
  - Ledger (as implemented)
- Unit assignment binds identities; does not change stock beyond the purchase doc itself.

> **Commit rule 8D.2:** only mark DONE when: tracked purchase receiving blocked until N units assigned + chosen location respected + stock/ledger correct.

---

### ✅ 8D.3 — Document-driven unit selection + lifecycle sync (OWNED tracked flows)
**Goal:** for tracked OWNED items, documents that represent movement/lifecycle must select units and update them.

- Transfers: qty N → select N units at FROM; update unit location TO
- Sales/POS: qty N → select N units from selling location; mark `SOLD`
- Sales returns: select returned units; restore `AVAILABLE`, set location (default SHOP)
- Purchase returns: select units; mark `RETURNED_TO_SUPPLIER`
- Write-off/scrap: select units; mark `SCRAPPED`

**Guardrails:**
- Cannot sell/transfer terminal units
- Cannot select units from wrong location
- Cannot select same unit twice in a doc
- Manual admin corrections allowed (but doc flow is primary)

> **Commit rule 8D.3:** only mark DONE when: selection required for tracked flows + lifecycle sync works + guardrails enforced + no 8C regressions.

---

### ✅ 8D.4 — CUSTOMER_OWNED intake lifecycle (service tracking without stock pollution)
- CUSTOMER_OWNED units:
  - ownerPartyId required
  - productId OR brand/model required
  - default location SHOP (you requested)
  - status flow: `AVAILABLE` → `IN_SERVICE` → `RETURNED_TO_CUSTOMER` (terminal)
- Guardrails:
  - cannot be sold or included in stock movements
  - can be linked to service tickets (Phase 8E)

> **Commit rule 8D.4:** only mark DONE when: intake works + lifecycle trackable + blocked from inventory/sales flows.

---

### ✅ 8D.5 — RENTED_IN supplier contracts + units (outsourced units)
**Goal:** “rent from other shops to fulfill orders, then return.”

**Doc:** `RentedInContract`
- Party = supplier
- Dates: start, expectedReturn, actualReturn
- Status: Draft → Active → Returned/Closed
- Units:
  - create/select RENTED_IN units, link to contract
  - while Active: status `RENTED_IN_ACTIVE`, location set accordingly
- Supplier billing supports:
  - daily aggregated monthly
  - non-billable days (supplier calendar too; global Friday + per-supplier overrides)
  - partial return to supplier (some units returned earlier than others)

**Ledger:**
- Separate bills + settlement entry as **ledger journal entry** referencing both bills (your preference)
- Supplier billing: draft → edit (rates/exclusions/units) → finalize lock

**No stock changes:**
- RENTED_IN units do NOT change Product.stock / LocationStock (MVP)

**Supplier bill grouping:**
- One supplier bill per supplier per month (your preference), derived from allocations + billable days.

> **Commit rule 8D.5:** only mark DONE when: contract + units + draft/final supplier bill flow + partial returns + no stock pollution.

---

### ✅ 8D.6 — Rentals reserve specific unit (OWNED + RENTED_IN pool) (LATER)
- Allocate units to rental contracts:
  - OWNED `AVAILABLE`
  - RENTED_IN `RENTED_IN_ACTIVE`
- Prevent double-booking
- Rental lifecycle updates:
  - Active → `RENTED_OUT`
  - Closed → `AVAILABLE` (OWNED) OR `RENTED_IN_ACTIVE` (if supplier contract still active)
- Must support partial return + idle periods at customer site

> **Commit rule 8D.6:** only mark DONE when: allocation works + no double-booking + lifecycle correct.

---

### ✅ 8D.7 — Optional: QR/Barcode labels for units (OPTION)
- Print QR/Barcode for unit tags
- Scan-to-search in admin
- Optional per product/unit

---

### ✅ 8D.8 — Unit attachment history (parts that move between machines) (MVP+)
**Goal:** track motors/boards/pedals/etc that get swapped between machines.

- Only for products with `isAssetTracked=true` (serial-required parts or expensive parts)
- Attachment model:
  - one part-unit attached to one machine at a time (enforced)
  - full attachment history with:
    - partUnitId
    - machineUnitId
    - attachDate, detachDate
    - reason note (mandatory)
- No stock changes from attach/detach (tracking-only)
- UI:
  - machine shows attached parts
  - part shows history of machines it was attached to

> **Commit rule 8D.8:** only mark DONE when: attachment history works + one-at-a-time enforced + reason required.

---

### ✅ 8D.9 — Unbundle/Disassembly document (doc-driven stock for extracted components) (MVP)
**Goal:** if you remove a pedal/motor/etc and sell separately, inventory must reflect it.

- New doc: `DisassemblyDoc` (or `UnbundleDoc`)
- Choose a “source machine unit” and components extracted:
  - creates LocationStock IN for component products (e.g., +1 pedal)
  - if the component is serial-required, also creates a new part-unit asset and links it
- Machine is marked with **incomplete kit flag** (your choice) after extraction.
- Traceability:
  - disassembly doc links to source machine unit and created part units (if any)

> **Commit rule 8D.9:** only mark DONE when: disassembly creates stock IN for components + serial parts create part-unit asset + machine incomplete flag set + traceability clear.

---

### ✅ 8D.10 — Unit history timeline (traceability UX) (MVP)
**Goal:** fast ops + full traceability in one place.

- Unit detail page shows timeline of linked docs/events:
  - purchase receiving (OWNED intake)
  - sale/POS selection
  - transfers
  - returns
  - write-offs/scrap
  - service tickets + service invoices
  - rental allocations (later)
  - rented-in contracts (for RENTED_IN units)
  - disassembly/unbundle refs
  - attachment history events (8D.8)
- Must be clickable + searchable.

> **Commit rule 8D.10:** only mark DONE when: unit timeline pulls all refs correctly + links are usable.

---

## 🟡 PHASE 8E — Service & Issue Tracking (NOT STARTED)

### ✅ 8E.1 — Issue tickets / work orders foundation
- Issue tickets/work orders
- Status: Open → In progress → Resolved → Closed

### ✅ 8E.2 — Service intake linkages (unit + party + location)
- Link ticket to:
  - CUSTOMER_OWNED unit (8D.4), OR
  - OWNED unit (8D.1–8D.3)
- Capture issue description, photos (optional), notes
- Location context (SHOP/SERVICE)

### ✅ 8E.3 — ServiceInvoice (single doc: labor + parts) + payments (MVP)
**Your requirement:** single invoice with labor + parts, partial payments, ledger by payment method.

- New doc: `ServiceInvoice`
- Contains:
  - service labor lines
  - parts lines (inventory products)
  - optional captured serial/tag for high-value parts when tracked
- Posting:
  - parts reduce LocationStock + create inventory movement refs (doc-driven)
  - payments create ledger entries per payment method (cash/bkash/nagad/bank)
  - supports partial payments like SalesInvoice

### ✅ 8E.4 — Warranty option (with manual override + reasons)
- Warranty fields stored:
  - warrantyDays (default 7 unless changed)
  - warrantyType: none / labor-only / labor+parts
  - warrantyStartDate (usually issue date)
- Repeat issue behavior:
  - no auto free-labor; approved staff can override
  - UI requires reason note on override
- Reporting:
  - tickets reopened within warranty window

---

## 🟡 PHASE 8F — Financial Ops Enhancements (NOT STARTED)

### ✅ 8F.1 — Opening balances (parties + ledger)
- Opening balances for parties (customer/supplier due)
- Opening balances for cash/bank accounts
- Stored as special “Opening Balance” ledger entry type
- Reporting includes opening balances correctly

### ✅ 8F.2 — Cash drawer tracking (daily)
- Start-of-day cash
- Cash in/out summary from ledger
- End-of-day counted cash + discrepancy record
- Simple “close day” workflow

### ✅ 8F.3 — Rental billing calendar + exclusions + idle periods (MVP)
**Your rule:** billed by daily rate × active billable days; Friday non-billable; custom exclusions; inclusive dates; per-unit idle.

- Contract billing calendar support:
  - default weekly non-billable: Friday
  - per-contract excluded dates selected per billing period and stored on the generated bill
  - supports “company closed” days
- Per-unit usage:
  - asset-level rental units can have active/idle periods
  - `IDLE_AT_CUSTOMER` stops billing from a date (approved staff; reason required)
- Generation workflow:
  - Generate bill for any date range → select excluded dates → preview → finalize

### ✅ 8F.4 — Rental settlements: partial return + damage/missing fees (MVP)
- Partial return at unit-level
- Damage/missing fees:
  - default as line item on settlement bill
  - optional “Penalty Invoice” doc for large company orders
- Print:
  - serial/tag list as comma-separated column when required

### ✅ 8F.5 — Supplier billing generation for RENTED_IN (MVP staged)
- Auto-generate supplier bills from:
  - actual units allocated + billable days
  - supports partial return to supplier
  - supports supplier non-billable days too (global Friday + per-supplier overrides)
- Bills are Draft then editable (rates/exclusions/unit list) then Final (locked)
- Grouping:
  - one supplier bill per supplier per month

### ✅ 8F.6 — Settlement journal entries (MVP)
- Support “pay the difference” via ledger journal entry referencing:
  - your bill and their bill (or related supplier/customer bills)
- Keeps MVP simple while enabling net settlement behavior.

### ✅ 8F.7 — Bank reconciliation (MVP, recommended)
- Import statement lines (CSV)
- Match ledger entries to statement items (manual match)
- Mark reconciled (protected record, admin override only)

---

## 🟡 PHASE 8G — Compliance + Print Options (Bangladesh-ready) (NOT STARTED)

### ✅ 8G.1 — VAT/tax fields + document numbering (MVP)
- VAT per invoice:
  - VAT inclusive OR VAT exclusive (toggle per invoice)
- VAT%:
  - shop default VAT% exists
  - editable per invoice
- **Document numbering: separate yearly sequences for ALL document types** (your requirement)
  - POS bills: `POS-YYYY-0001`
  - Sales invoices: `INV-YYYY-0001`
  - Service invoices: `SRV-YYYY-0001`
  - Purchase bills: `PUR-YYYY-0001`
  - Purchase returns: `PRT-YYYY-0001`
  - Sales returns: `SRT-YYYY-0001`
  - Rental bills: `RNT-YYYY-0001`
  - Rented-in supplier bills: `SUP-YYYY-0001`
  - Transfers: `TRF-YYYY-0001`
  - Write-offs/Scrap: `WOF-YYYY-0001`
  - Disassembly/Unbundle: `DIS-YYYY-0001`
  - Consignment docs: `CON-YYYY-0001`
  - (Any future doc type must declare its own prefix + yearly sequence)

### ✅ 8G.2 — Bilingual print templates (OPTION)
- Per print toggle: EN / BN / Bilingual
- Applies to invoices/bills/receipts

### ✅ 8G.3 — Print/legal footer templates (OPTION)
- Standard terms blocks (returns policy, warranty text, etc.)
- Configurable by admin

---

## 🟡 PHASE 8H — Used Machines (Trade-in / Refurb / Resale) (NOT STARTED)

### ✅ 8H.1 — Trade-in intake (customer → shop)
- Trade-in doc:
  - captures customer details
  - captures unit serial/model/brand
  - unit is tracked
- Payment:
  - can be immediate or later (your choice)
  - must create ledger entry linked to trade-in doc

### ✅ 8H.2 — Used machine grading (internal)
- Customizable grading labels (e.g., Excellent/Good/Fair) with optional short codes
- Stored per used unit

### ✅ 8H.3 — Refurb workflow (ledger-linked)
- Refurb record linked to unit:
  - parts used (stock reduces)
  - labor notes
  - refurb cost creates ledger expenses (your choice)
- After refurb: unit becomes sellable (OWNED AVAILABLE)

### ✅ 8H.4 — Used machine resale
- Sell used unit by selecting the specific unit (like 8D.3)
- Print includes serial/tag + condition notes (optional)

---

## 🟡 PHASE 8I — Consignment Stock (future plan) (NOT STARTED)

**Purpose:** stock in shop but owned by supplier until sold.

- Separate “consignment stock” totals (your choice)
- Consignment stock must be tracked by supplier (Party)

### ✅ 8I.1 — Consignment intake + stock tracking
- Consignment intake doc:
  - supplier Party required
  - items received, into a location
- Stock representation:
  - stored separately from owned stock (no mixing)
- Optional: for consigned machines, allow unit tracking by extending ownershipType later (e.g., `CONSIGNED`) while keeping accounting rules intact.

### ✅ 8I.2 — Consignment sale + payable
- On sale:
  - inventory moves out (consignment stock decreases)
  - customer payment ledger IN
  - supplier payable increases (settled later)

### ✅ 8I.3 — Consignment returns to supplier (unsold)
- Document workflow to return unsold items
- Updates consignment stock down and records refs

---

# 🟡 PHASE 9 — People, Security, Accountability (NOT STARTED)

## 🟡 PHASE 9A — Security & Multi-User
- Proper auth
- Roles (Admin/Staff)
- Permissions per module
- Audit log foundation

### ✅ 9A.1 — Authentication foundation (standard login + session)
- Login + logout + session persistence
- Server-side admin protection
- Security basics: secure cookies, basic rate limit login

### ✅ 9A.2 — Roles + permissions (module-level)
- Roles:
  - Admin
  - Staff
- Per-user flags:
  - `isApprovedEditor` (for controlled edits + certain sensitive actions)
  - optional `isManager` / `canApproveOfflineIssue` (implementation detail; keep consistent)
- Enforce permissions on API routes and UI navigation

### ✅ 9A.3 — Audit log foundation (minimum viable)
- AuditLog table:
  - who, what, entity, action, timestamp, metadata
- Log critical actions:
  - issue/cancel, returns, transfers, payments, unit lifecycle changes, rental billing finalize, supplier bill finalize, offline approvals

### ✅ 9A.4 — Controlled edits of issued documents (approved staff, with full history + restore)
**Your requirement:** edits allowed for approved staff, with mandatory reason + backup copy; admin override exists; restore original version supported.

- For editable docs:
  - require reason note
  - store a full “before” snapshot (DocumentRevision)
  - store “after” snapshot
  - show revision timeline on doc detail
- Restore original:
  - create a new revision that reverts content (audit-safe)
- Inventory/ledger impacts:
  - reverse old movements/ledger entries and repost new ones (traceable standard)
- Future plan:
  - high-risk docs can require 2-person approval later

### ✅ 9A.5 — Protected records (non-editable by default; admin override only)
- Protected by default:
  - ledger entries/payments
  - reconciled bank matches
  - finalized supplier bills
- Admin override allowed with mandatory reason + audit + snapshot (and restore support where applicable)

### ✅ 9A.6 — Strict no-delete rule (system-wide)
- No hard deletes for operational docs
- Enforce cancel/void workflows
- Keep references intact for traceability

## 🟡 PHASE 9B — Employee Management (directory + attribution)
- Employee records (active/inactive)
- “Performed by” links on documents
- Basic performance trail

### ✅ 9B.1 — Employee directory foundation
- Employee records (name, phone, status)
- Link Employee ↔ User (if applicable)

### ✅ 9B.2 — Attribution plumbing (“performed by”)
- Auto-fill performedBy from session user on create/issue/pay actions
- Display on documents and prints (optional)

### ✅ 9B.3 — Basic performance trail
- Employee detail: counts/timeline (sales/purchases/rentals/service)
- Date range filters (optional MVP)

## 🟡 PHASE 9C — Salaries / Payroll (ledger-linked)
- Payroll runs
- Salary/advance/deductions
- Ledger OUT linked to payroll doc

### ✅ 9C.1 — Payroll configuration
- Salary settings per employee
- Period rules

### ✅ 9C.2 — Payroll run document
- PayrollRun doc, mark paid

### ✅ 9C.3 — Ledger integration
- Ledger OUT linked to PayrollRun

### ✅ 9C.4 — Advances + deductions (optional)
- Linked to employee + ledger

---

# 🟢 PHASE 10 — Backup, Sync & Deploy (NOT STARTED)

- Backup/export/restore
- Production hardening
- Deployment plan
- Monitoring/logging basics

### ✅ 10A — Backup/export (MVP)
- DB backup approach documented
- Export critical data as CSV/JSON:
  - products, parties, ledger, documents, movements, location stock, units/assets

### ✅ 10B — Restore/import (MVP)
- Restore steps documented
- Admin-only restore tools (with confirmation)

### ✅ 10C — Multi-device + Offline option + Sync plan (MVP staged)
**Your reality:** outages in Bangladesh → must be prepared.
**Safety boundary locked:** offline can create drafts; issuing stock-changing docs requires connection + approval.

#### ✅ 10C.1 — Standard operating mode (baseline)
- Primary server (eventually cloud hosting) holds authoritative DB
- Shop devices connect when online

#### ✅ 10C.2 — Offline Draft Queue (planned)
- Each device can create Draft documents offline (POS draft, service intake draft, etc.)
- Drafts carry:
  - createdBy, createdAt, deviceId
  - “offline-created” flag
- At draft time:
  - warn “stock unknown offline”
- When online:
  - sync draft events to server (event log)
- Drafts are **shared** after sync (your choice).

#### ✅ 10C.3 — Approval gate for offline-created drafts
- Offline-created drafts require approval before issue:
  - Admin OR Manager (approved staff) can approve
- Approval is audited.

#### ✅ 10C.4 — Online-only issuing for stock-changing docs (safety rule)
- Issue/Finalize of stock-changing docs requires connection to server DB
- Prevents silent stock corruption

#### ✅ 10C.5 — Event-log sync (traceable)
- Sync as append-only event log
- On server, events are applied with validation
- Conflicts:
  - draft conflicts can be handled
  - issuing conflicts avoided by the “online-only issue” rule

#### ✅ 10C.6 — Future: true offline issuing (deferred; manual conflict resolution)
- Only if later required.
- Conflicts block on sync; manual resolution required.
- Must be logged and auditable.

#### ✅ 10C.7 — Mobile readiness (future-safe)
- API contract stability
- Auth strategy compatible with mobile
- Responsive admin pages or app later

### ✅ 10D — Deploy plan + environment hardening
- Secrets handling
- Production build pipeline
- Migration workflow
- Scheduled backups

### ✅ 10E — Monitoring/logging basics (MVP)
- Health check
- Error logging
- Key failure tracking

---

# 🟣 PHASE 11 — AI (Optional, Read-only first) (NOT STARTED)

## 11A — AI Product Advisor (customer-facing)
- Chat UI on shop
- Suggest products based on catalog + availability
- Read-only

## 11B — AI Admin Assistant (internal)
- Natural language → filters/reports
- Read-only

## 11C — AI Content Assistant
- Rewrite descriptions (EN/BN), SEO text

---

# ✅ “Keep for later” backlog (tracked, not blocking current phase)

- Improve Party auto-fill in rental contract UI
- Sales bills list page / better discoverability
- Locations enhancements:
  - Per-document location selection (purchase into WAREHOUSE, sales from SHOP, etc.)
  - Stock by location report page
  - Transfer detail page + print (optional)
- Deeper bank reconciliation automation
- True offline issuing + multi-master sync only if absolutely required

---

# NOTE: For each phase and subphase, you must give me some tests before I mark that phase as passed and commit it to GitHub
(Provide an appropriate commit message, e.g., "Phase 8D.1: Unit tracking foundation (ownership types + serial policy + tags)")

### IMPORTANT: You are allowed to add subphases if it's necessary to cleanly implement a phase or a feature.
