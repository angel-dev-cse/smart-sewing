## 🧭 SMART SEWING SOLUTIONS — MASTER PHASE ROADMAP (v4.2 FINAL — patched for Product Master Admin + navigation integrity)

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

## 🟡 PHASE 8D — Unit Tracking (Assets) (ACTIVE / IN PROGRESS)

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
### ✅ 8D.1.5 — Product Master Admin (backfill) + navigation integrity (MVP)
**Why this exists:** Phase 8D depends on being able to create/edit Products and set tracking flags.  
In the current repo snapshot, `/admin/products` and `/admin/products/new` are linked from UI but do not exist (404), so we lock this in as a formal subphase.

- Admin Products module:
  - `/admin/products` list (search, filter by type/isActive/isAssetTracked/serialRequired)
  - `/admin/products/new` create
  - `/admin/products/[id]` edit + detail
- Minimum Product fields to manage from UI (to support 8D+):
  - title, type (MACHINE_SALE / MACHINE_RENT / PART), price, isActive
  - `isAssetTracked` + `serialRequired`
  - (Optional-but-recommended now, to avoid later rework) brand + model fields **on Product** for machine SKUs
- Navigation integrity fixes:
  - Fix any internal admin link that points to a non-existent route (e.g., `/admin/inventory/movement` → `/admin/inventory/movements`)
  - Add a lightweight “link smoke” checklist to each phase: no 404s in sidebar + page CTAs for modules touched in that phase.

> **Acceptance rule 8D.1.5:** You can create a new machine SKU, mark it `isAssetTracked=true`, and all existing “Open products / New product” links stop 404ing. No changes to inventory/ledger behavior yet.

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

### ✅ 8E.1 — Issue tickets / work orders foundation (single-unit tickets)
- **One unit per ticket** (locked)
- Ticket can be for:
  - `CUSTOMER_OWNED` units
  - `OWNED` shop units
  - `RENTED_IN` units (yes — you may service supplier-rented machines too)
- Status: Open → In progress → Resolved → Closed
- Required fields:
  - Party (customer / internal / supplier as applicable)
  - Unit reference (or intake creation if unit not yet created)
  - Problem description + intake notes
- Optional:
  - Photos/attachments
  - Priority flag (optional)

### ✅ 8E.2 — Service intake linkages (unit + party + location)
- Ticket links to:
  - Unit (from 8D: `CUSTOMER_OWNED` / `OWNED` / `RENTED_IN`)
  - Location context (SHOP/SERVICE/WAREHOUSE — as needed)
- Unit status sync (MVP):
  - Ticket opened → unit status can move to `IN_SERVICE` (for CUSTOMER_OWNED / OWNED / RENTED_IN)
  - Ticket closed → status changes depend on outcome (see 8E.4 + 8E.5)

### ✅ 8E.3 — ServiceInvoice (single doc: labor + parts) + payments (MVP)
**Your requirement:** single invoice with labor + parts, partial payments, ledger by payment method.

- New doc: `ServiceInvoice`
- Can be created:
  - From ticket (linked), **OR**
  - Without ticket (walk-in quick repair) — **both supported**
- Pricing model (MVP):
  - **One labor line** (amount + note)
  - Parts lines (inventory products) with qty + rate
- Stock source for parts:
  - **Select location at invoice time** (SHOP/WAREHOUSE) for parts stock deduction
- Posting:
  - Parts reduce `LocationStock` at chosen location + create InventoryMovement refs (doc-driven)
  - Payments create ledger entries per payment method (Cash/Bkash/Nagad/Bank)
  - Supports partial payments like SalesInvoice

### ✅ 8E.4 — Serial-tracked parts installed / replaced (unit-aware)
- When a serial-tracked part is installed:
  - **Select the part-unit asset if available**
  - Else allow free-text serial/tag entry **with mandatory reason note**
- Old part outcomes (must support all):
  - A) Returned to customer (no stock)
  - B) Kept by shop as spare (stock IN via Disassembly/Unbundle-style doc or a service-return subflow)
  - C) Scrapped (write-off / scrap)
- Must preserve traceability:
  - service invoice links to installed part unit (when selected)
  - installed/removed parts update attachment history if 8D.8 is implemented

### ✅ 8E.5 — Warranty model (invoice-level + parts-level)
- Warranty fields stored:
  - warrantyDays (default 7 unless changed)
  - warrantyType: none / labor-only / labor+parts
  - warrantyStartDate = **ServiceInvoice issue date** (locked)
- Warranty applies to:
  - A) the service job overall (invoice-level)
  - B) individual replaced parts (parts-level) — **both supported**
- Repeat issue handling:
  - no auto free-labor; approved staff can override
  - UI requires reason note on override
- Reporting:
  - tickets reopened within warranty window
  - optional report: parts replaced under warranty (later)

> **Commit rule 8E:** only mark DONE when: ticket flow + service invoice flow + location-based parts deduction + partial payments + serial-tracked parts rules + warranty model work end-to-end.


## 🟡 PHASE 8F — Financial Ops Enhancements (NOT STARTED)

### ✅ 8F.1 — Opening balances (parties + ledger) — via wizard
- Opening balances for:
  - Parties (customer/supplier due/advance)
  - Cash account opening
  - Bank/Bkash/Nagad opening
- Implement as an **Opening Balance wizard**:
  - guided forms that post “Opening Balance” ledger entries with clear refs
- Reporting includes opening balances correctly

### ✅ 8F.2 — Cash drawer tracking (daily) — supports multi-register
- Support:
  - single drawer (MVP)
  - **multiple registers/drawers** (enabled as an option)
- Daily close workflow (required):
  - Start-of-day cash
  - Expected cash auto-calculated from ledger cash entries
  - End-of-day counted cash
  - Discrepancy stored (+/-) with **mandatory reason note** (locked)
- Optional:
  - “Close day” report print/export

### ✅ 8F.3 — Rental billing calendar + exclusions + idle periods (MVP)
- Default weekly non-billable: **Friday** (locked)
- Per-contract excluded dates selected per billing period and stored on the generated bill
- Add a **monthly template option**:
  - store month template (holidays/weekends)
  - applied during bill generation but editable per bill (company-specific closures can be added)
- Inclusive day count (locked):
  - billedDays = endDate − startDate + 1, then subtract excluded days
- Per-unit usage:
  - asset-level rental units can have active/idle periods
  - `IDLE_AT_CUSTOMER` stops billing from a date (approved staff; reason required)
- Generation workflow:
  - Generate bill → apply month template (optional) → add/remove excluded dates → preview → finalize

### ✅ 8F.4 — Rental settlements: partial return + damage/missing fees (MVP)
- Partial return at unit-level
- Damage/missing fees must support:
  - line item on RentalBill
  - optional “Penalty Invoice” doc for large company orders
- Default ledger category for penalties:
  - **Other income / penalty income** (locked)
- Print:
  - serial/tag list as comma-separated column when required

### ✅ 8F.5 — Supplier billing generation for RENTED_IN (MVP staged)
- Auto-generate supplier bills from:
  - actual units allocated + billable days
  - supports partial return to supplier
  - supports supplier non-billable days too (global Friday + per-supplier overrides)
- Bills are Draft → editable (rates/exclusions/unit list) → Final (locked)
- Grouping:
  - one supplier bill per supplier per month (locked)
- Rate handling:
  - supports both stored daily rates and per-bill custom overrides (locked)

### ✅ 8F.6 — Settlement journal entries (MVP)
- Support “pay the difference” via ledger journal entry referencing:
  - your bill and their bill (or related supplier/customer bills)

### ✅ 8F.7 — Bank reconciliation (MVP) — Bank + Bkash + Nagad
- Import statement lines (CSV) for:
  - Bank
  - Bkash
  - Nagad
- Match ledger entries to statement items (manual match)
- Mark reconciled (protected record, admin override only)

> **Commit rule 8F:** only mark DONE when: opening balance wizard + cash drawer close + rental exclusions/idle billing + supplier bill generation + settlement journals + reconciliation flows work and are auditable.


## 🟡 PHASE 8G — Compliance + Print Options (Bangladesh-ready) (NOT STARTED)

### ✅ 8G.1 — VAT/tax fields + document numbering + rounding (MVP)
- VAT per invoice:
  - VAT inclusive OR VAT exclusive (toggle per invoice)
  - show VAT% separately on prints (locked)
- VAT%:
  - shop default VAT% exists
  - editable per invoice
- Rounding rules (locked):
  - Cash totals: round to nearest **1 BDT**
  - Digital totals (Bkash/Nagad/Bank): keep **2 decimals**
- **Document numbering: separate yearly sequences for ALL document types** (locked)
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

### ✅ 8G.2 — Print templates (MVP)
- Print size (MVP locked):
  - **A4** invoice/bill print
- Bilingual print:
  - Per print toggle: EN / BN / Bilingual

### ✅ 8G.3 — Print/legal footer templates (OPTION)
- Standard terms blocks (returns policy, warranty text, etc.)
- Configurable by admin

> **Commit rule 8G:** only mark DONE when: VAT inclusive/exclusive works + VAT% shown + rounding rules applied + yearly sequences for all docs + A4 print templates + bilingual toggle work.


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
  - refurb cost creates ledger expenses (locked)
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
  - extend LocationStock with an `ownershipBucket` (OWNED / CONSIGNMENT)
  - owned stock remains the default OWNED bucket
  - consignment stock is tracked separately per supplier (no mixing)
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

**Goals:** proper login, module permissions, audit trails, controlled edits with restore, and strict “no delete”.

### ✅ 9A.1 — Authentication foundation (username/phone + password; admin reset)
- Login identifiers (MVP locked):
  - **Username OR phone + password** (allow both)
  - Email is not required (Bangladesh shop reality)
- User table fields (MVP):
  - username (unique)
  - phone (unique, optional but recommended)
  - passwordHash
  - roleId (links to Role)
  - flags:
    - `isApprovedEditor` (independent of role)
    - `isDisabled`
- Sessions:
  - server-side route protection for all admin routes
  - secure cookies
  - basic login rate limiting
- Password reset (MVP locked):
  - **Admin resets staff password** (no email reset flow)

> **Commit rule 9A.1:** only mark DONE when: login works via username OR phone, sessions persist, admin routes are protected server-side, and admin can reset staff passwords.

### ✅ 9A.2 — Roles catalog (first-class roles + future roles)
- Roles are first-class and configurable.
- Seed the initial roles you listed:
  - Admin, CEO, Manager, Staff, Accountant, Engineer, Helper
- Allow “other roles created later”:
  - Role CRUD for Admin (create/rename/disable roles)
- Role names are business-facing labels; permissions are assigned separately (9A.3).

> **Commit rule 9A.2:** only mark DONE when: role table exists, default roles are seeded, and admin can manage roles.

### ✅ 9A.3 — Permissions (module-level, enforce on API + UI)
- Permission model:
  - seed **predefined permission templates per role** (Admin/CEO/Manager/Staff/Accountant/Engineer/Helper)
  - allow manual adjustments later (locked)
  - module-level permissions (view/create/edit/issue/cancel/pay/finalize/export/approve) per module
- Minimum modules to cover:
  - POS, Sales Invoices, Purchases, Rentals, Inventory, Returns/Corrections, Transfers, Assets/Units, Service, Parties, Ledger, Reports, Settings
- Enforce permissions:
  - on API routes (hard enforcement)
  - in UI navigation (hide/disable) — but API remains the source of truth

> **Commit rule 9A.3:** only mark DONE when: permissions are enforced server-side across modules and the UI respects them.

### ✅ 9A.4 — “Approved editor” + sensitive approvals
- `isApprovedEditor` flag is independent of role (locked).
- Use this flag to gate:
  - controlled edits of issued documents (9A.6)
  - marking `IDLE_AT_CUSTOMER` (Phase 8F)
  - approving offline-created drafts (Phase 10C)
- Keep Admin override for everything, but require reason + audit.

> **Commit rule 9A.4:** only mark DONE when: the flag gates the intended sensitive actions.

### ✅ 9A.5 — Audit log + revision retention (hybrid, forever + 30-day pool)
- AuditLog retention: **keep forever** (locked).
- Hybrid capture (locked):
  - snapshots (full before/after) for:
    - issued documents
    - payments / ledger-linked actions
  - diffs for other routine edits
- Additional shop requirement (locked):
  - keep a **full copy/revision of every other document** for **30 days**, then allow Admin to decide what to keep/discard.
  - admin “discard revision copies older than 30 days” action must itself be audited.
- Audit must include:
  - who, action, entity, timestamp
  - reason note (when required)
  - metadata (old/new ids, amounts, counts, etc.)

> **Commit rule 9A.5:** only mark DONE when: audit logging is comprehensive and retention/cleanup actions are traceable.

### ✅ 9A.6 — Controlled edits of issued documents (approved editors; reverse & repost; restore)
- Editable by approved editors (locked list):
  - SalesInvoice, POS Bill, PurchaseBill, RentalBill, ServiceInvoice
  - Returns docs, Transfers, Write-offs/Scrap
  - Supplier (RENTED_IN) bills
- Edit flow (MVP):
  - require **Edit Reason Category** + free-text note
  - create DocumentRevision snapshot “before”
  - apply edit → create snapshot “after”
- Restore:
  - restore is a new revision that reverts to a chosen snapshot (keeps audit chain)
- Inventory/ledger integrity (locked):
  - on edit/restore: **reverse old movements/ledger entries and repost new ones**
  - all reversals/reposts must be linked to the edit revision id for traceability

> **Commit rule 9A.6:** only mark DONE when: edit + restore works and inventory/ledger is correct via reverse & repost with full traceability.

### ✅ 9A.7 — Protected records + strict no-delete rule (system-wide)
- Protected by default (admin override only, with reason + audit + snapshot):
  - ledger entries/payments
  - reconciled bank matches (Phase 8F.7)
  - finalized supplier bills (Phase 8D/8F)
- Strict no-delete rule:
  - no hard deletes for operational docs
  - enforce cancel/void workflows everywhere
  - keep references intact

> **Commit rule 9A.7:** only mark DONE when: deletes are blocked at API level and protected records behave correctly.

---

## 🟡 PHASE 9B — Employee Management (directory + attribution)

### ✅ 9B.1 — Employee directory foundation (employees may exist without login)
- Employees can exist without a User login (locked).
- Employee fields (MVP):
  - name, phone, role/jobTitle label, status active/inactive
- Optional link:
  - Employee ↔ User (nullable)
- Admin UI:
  - list + create/edit employees

> **Commit rule 9B.1:** only mark DONE when: employees can be managed independently of logins.

### ✅ 9B.2 — Attribution plumbing (“performed by” = both user + employee)
- Documents store both (locked):
  - performedByUserId (auth identity)
  - performedByEmployeeId (HR identity)
- Auto-fill performedBy from current session user on create/issue/pay actions.
- Display “performed by” on document details and prints (optional).

> **Commit rule 9B.2:** only mark DONE when: attribution is consistently stored and visible across docs.

### ✅ 9B.3 — Basic performance trail (MVP)
- Employee detail shows:
  - counts + timeline of linked docs (sales, purchases, rentals, service tickets)
- Simple filters by date range (optional MVP)

> **Commit rule 9B.3:** only mark DONE when: employee timeline is usable and accurate.

---

## 🟡 PHASE 9C — Salaries / Payroll (ledger-linked)

### ✅ 9C.1 — Payroll configuration (monthly + early pay / mid-month exit)
- Salary cycle (locked):
  - monthly payroll
  - supports early payout and mid-month exit settlement
- Employee payroll settings:
  - base salary
  - allowances (transport/food)

### ✅ 9C.2 — Advances + deductions (MVP)
- Record advances and deductions linked to:
  - employee + ledger
- Advances can be settled through payroll run.

### ✅ 9C.3 — Payroll run document (monthly)
- PayrollRun doc:
  - period
  - employees included
  - components: base salary, allowances, deductions, advances settlement
  - notes
- Supports marking as paid.

### ✅ 9C.4 — Ledger integration (all payment methods)
- Payroll payments create ledger OUT entries, linked to PayrollRun
- Payment methods supported (locked):
  - Cash, Bank, Bkash, Nagad

### ✅ 9C.5 — Final settlement for quitting (recommended within 9C)
- Generate a settlement calculation:
  - pro-rate salary for days worked
  - add allowances
  - subtract advances/deductions
- Post ledger OUT when paid
- Keep as a doc-linked record

> **Commit rule 9C:** only mark DONE when: payroll runs + advances/deductions + ledger postings work end-to-end and are traceable.


# 🟢 PHASE 10 — Backup, Sync & Deploy (NOT STARTED)

**Goal:** safe multi-PC operations in Bangladesh reality (power/internet outages), without corrupting stock/ledger.

**Hard safety rule (locked):** Offline mode can create **drafts only**. Issuing stock/ledger requires online connection + approval.

## ✅ PHASE 10A — Backup/export (MVP)

### ✅ 10A.1 — PostgreSQL production baseline
- Production target DB: **PostgreSQL** (locked)
- Document a standard “dev/staging/prod” DB setup strategy.

### ✅ 10A.2 — Automated backups (every 6 hours, with smart fallback)
- Backup cadence:
  - attempt every **6 hours** (locked)
  - if backup system is unavailable, fall back to daily and log failures (practical safety)
- Store backups:
  - local disk on the server PC (MVP locked)
  - keep the system open to adding other targets later (external drive/cloud) without redesign

### ✅ 10A.3 — Portable exports (CSV + JSON)
- Export formats (locked):
  - CSV for master data (Products, Parties, Accounts, Employees, Locations, etc.)
  - JSON for documents and their items/revisions (Sales, Purchases, Rentals, Service, Transfers, Movements, Assets/Units, etc.)
- Exports must be re-importable (Phase 10B) and versioned.

> **Commit rule 10A:** only mark DONE when: PostgreSQL baseline is documented + backups run every 6 hours + exports are downloadable and complete.

---

## ✅ PHASE 10B — Restore/import (MVP)

### ✅ 10B.1 — Restore permissions + maintenance mode (locked)
- Restore permission: **Admin only** (locked)
- Restore requires **maintenance mode**:
  - block issuing/critical writes during restore
  - show banner in UI

### ✅ 10B.2 — Restore from DB backup (MVP)
- Provide a step-by-step restore guide:
  - which commands to run
  - where backups are stored
  - how to validate restore success

### ✅ 10B.3 — Import from exports (optional but recommended)
- Import CSV/JSON exports with validation:
  - handle version mismatch safely
  - prevent duplicate keys
- Import is also gated by maintenance mode.

> **Commit rule 10B:** only mark DONE when: admin can restore safely with maintenance mode and validate success.

---

## ✅ PHASE 10C — Multi-PC + Offline Draft Queue + Sync (MVP)

### ✅ 10C.1 — Deployment mode: LAN server now, cloud later (locked)
- Initial: **one shop server PC** running DB + app
- Other devices connect over LAN
- Later: migrate to cloud hosting (planned) without changing data model.

### ✅ 10C.2 — Offline drafts for ALL docs (locked)
- Offline device can create drafts for:
  - all document types (sales/purchase/transfer/service/etc.) (locked)
- Offline UI must show:
  - “stock unknown offline” warning on draft creation where relevant
  - clear indicator: “Draft only — cannot issue offline”

### ✅ 10C.3 — Sync mechanism: event-log (append-only) (locked)
- Sync is implemented as append-only events:
  - create draft
  - update draft
  - attach notes
  - request approval
- Each event is traceable (who/when/device).

### ✅ 10C.4 — Draft approval queue (Admin + Manager; shared ownership)
- After sync, drafts must be approved before issuing by:
  - **Admin + Manager** (locked)
- Draft ownership after sync:
  - **shared** — any approved staff can continue/edit (locked)
- Approval actions are audited (Phase 9A).

### ✅ 10C.5 — Conflict policy (locked)
- If drafts compete for stock:
  - warn at draft time (stock unknown offline)
  - enforce strictly at issue time (online)
  - conflicts block issuing and require manual resolution (no auto-merge)

> **Commit rule 10C:** only mark DONE when: offline drafts work end-to-end, sync is event-log, approval gate exists, and stock safety is guaranteed.

---

## ✅ PHASE 10D — Deploy plan + environment hardening (MVP)

### ✅ 10D.1 — Environments + secrets
- Dev / staging / prod environment variable strategy
- Secrets handling rules (no secrets in repo)

### ✅ 10D.2 — Production migration workflow
- Safe Prisma migration procedure for production:
  - backup before migrate
  - migrate
  - validate critical flows

### ✅ 10D.3 — Remote access: cloud web access
- Preferred remote access:
  - web access via cloud host (locked)
- Document:
  - domain + SSL
  - basic access controls
  - backup policy in cloud environment

> **Commit rule 10D:** only mark DONE when: production hardening steps are documented and repeatable.

---

## ✅ PHASE 10E — Monitoring/logging basics (MVP)

### ✅ 10E.1 — System logs page (admin UI)
- Admin “System Logs” page (locked)
- Log categories:
  - backup failures
  - restore/import actions
  - sync errors
  - stock validation failures at issue time

### ✅ 10E.2 — Audit alignment for blocking errors (locked)
- When system errors block issuing:
  - create AuditLog entry (locked)
  - link error log id to the audit record

> **Commit rule 10E:** only mark DONE when: logs are visible in admin UI and critical blocking events are auditable.


# 🟣 PHASE 11 — AI (Optional, Read-only first) (NOT STARTED)

**Global AI safety rule (locked):**
- AI features are **read-only** (no writes, no issuing, no editing documents).
- AI must respect **Phase 9 permissions**.
- AI runs **cloud-only** for MVP (locked).

---

## 🟣 11A — AI Product Advisor (customer-facing)

**Goal:** help customers choose the right machine/plan (buy vs rent), then drive them to your products with direct links.

### ✅ 11A.1 — Safe customer data layer (read-only)
- AI can read:
- AI can read:
  - product name + description
  - public price
  - rental availability (yes/no)
  - store address/contact
  - (optional) public delivery/arrangement note (“we can arrange delivery/availability on request”)
- Stock visibility (customer-facing):
  - **Default (locked for now): omit stock display** (no “in stock/out of stock”, no exact qty)
  - Advisor can say: “We can arrange what you need — contact us / place order” and route to products.
  - Keep as a future option (toggle) to enable:
    - availability tiers, and later exact quantity if you decide it’s safe.

> **Commit rule 11A.1:** only mark DONE when: AI is strictly read-only and can only access the approved customer-visible fields.

### ✅ 11A.2 — Advisor UX (EN/BN) + “buy vs rent” recommendation
- Language support (locked): **English + Bangla** (toggle/auto-detect)
- Customer chat flow:
  - ask about use case (home/industrial), budget, workload, duration (rent), location
  - recommend a plan:
    - “Buy” plan (with 1–3 best-fit models)
    - “Rent” plan (with recommended rental models + suggested duration)
  - every recommended item must have:
    - clickable link to product page
    - price/rent indicator
    - availability label

> **Commit rule 11A.2:** only mark DONE when: the advisor consistently produces clickable product links and works in EN + BN.

### ✅ 11A.3 — Fallback behavior + human escalation
- When uncertain:
  - provide best recommendation
  - **suggest human contact** (locked) and show contact options
- Must refuse unsafe requests (no policy violations, no account actions).

> **Commit rule 11A.3:** only mark DONE when: uncertainty handling is consistent and human escalation works.

---

## 🟣 11B — AI Admin Assistant (internal)

**Access (locked):** Admin-only.

**Goal:** accelerate admin workflows, search, and insights — still read-only.

### ✅ 11B.1 — NL → clickable links (filters/reports)
- Translate admin queries into existing report links/filters:
  - “unpaid invoices this month”
  - “sales today by cash”
  - “low stock items”
  - “which supplier bills are due”
- Output must be clickable deep links to the relevant admin pages.

> **Commit rule 11B.1:** only mark DONE when: links are accurate and permission-respecting.

### ✅ 11B.2 — Admin search assistant (entities)
- Search across:
  - parties
  - invoices/bills/returns
  - assets/units
  - inventory movements
  - transfers
  - service tickets
- Return ranked results + links (no edits).

> **Commit rule 11B.2:** only mark DONE when: search results are correct, fast, and clickable.

### ✅ 11B.3 — Explain “why stock changed” (traceability)
- Given a product (and optionally a location/unit), AI can explain:
  - which documents/movements caused the change
  - timeline summary with links
- This is powered by:
  - InventoryMovements + LocationStock + document refs (no guessing)

> **Commit rule 11B.3:** only mark DONE when: explanations are traceable and link back to real docs/movements.

### ✅ 11B.4 — Trends + insights (read-only analytics)
- Provide insights such as:
  - seasonal demand trends
  - top customers/companies
  - frequent rental durations
  - late-payment patterns
- Must be grounded in existing reports/data (no hallucinated conclusions).
- Output includes:
  - a short narrative summary
  - links to the underlying reports or filtered lists

> **Commit rule 11B.4:** only mark DONE when: insights always link to underlying data sources and are reproducible.

### ✅ 11B.5 — People-sensitive restrictions (your preference)
You requested: “Only restrict sensitive info of people.”

- Still enforce:
  - **no payroll/personnel-sensitive data** shown unless explicitly on payroll module and Admin is viewing
  - redact unnecessary personal details in summaries (show links instead of repeating full phone/address in the chat)
- This keeps the assistant useful while preventing accidental leakage in AI responses.

> **Commit rule 11B.5:** only mark DONE when: people-sensitive info is protected and behavior is consistent.

---

## 🟣 11C — AI Content Assistant (EN/BN descriptions)

**Goal:** generate product descriptions + SEO drafts to save time.

### ✅ 11C.1 — Draft generation (EN/BN) — approval required
- Generate:
  - product descriptions (EN/BN)
  - SEO title + meta description
- Storage (locked):
  - **draft only**
  - manual approval required

> **Commit rule 11C.1:** only mark DONE when: drafts never auto-publish.

### ✅ 11C.2 — Version history (keep last N)
- Keep last **N** versions per product.
- Default N suggestion: 10 (configurable in settings).
- Record who approved and when.

> **Commit rule 11C.2:** only mark DONE when: version history works and approvals are traceable.

### ✅ 11C.3 — Bulk generation tools (batch select products)
- Select multiple products → generate drafts in batch
- Show queue/progress UI (MVP can be simple)

> **Commit rule 11C.3:** only mark DONE when: batch generation is stable and drafts are reviewable.

---

# NOTE: For each phase and subphase, you must give me some tests before I mark that phase as passed and commit it to GitHub.
### IMPORTANT: You are allowed to add subphases if it's necessary to cleanly implement a phase or a feature.

