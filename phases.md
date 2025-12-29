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

## 🟡 PHASE 8D — Unit Tracking (Assets) (ACTIVE / START HERE)

**Purpose:** track every physical machine/unit (and some parts) by serial/tag, ownership, status, location, and history.

### 8D Golden Rules (do not violate)
1. **Inventory & ledger are driven ONLY by documents.** Units do not change stock/ledger by themselves.
2. For **unit-tracked (isAssetTracked=true)** products, **every stock-changing document must also specify which Unit(s) moved**.
3. **No hidden overrides:** you cannot sell/transfer/write-off tracked qty without selecting specific units.
4. **No free OWNED units:** a shop-owned unit must come from an acquisition document (Purchase / UsedIntake / ConsignmentIntake), or an explicitly logged admin correction.
5. **Identity is immutable-ish:** once a unit is created by a document, identity edits are tightly controlled and always audited.

### 8D “Phase contract” checklist (apply to EVERY 8D.* subphase before coding)
For each subphase, the implementation must explicitly define:
- **Data model additions** (tables/fields + unique constraints)
- **State machine** (Draft → Issued → Canceled, etc)
- **Invariants** (what must always be true)
- **Who can do what** (role/permission + approved editor)
- **Exactly when stock/ledger posts** (issue time only)
- **API routes** (create/issue/cancel/edit)
- **UI screens** (create/detail/edit)
- **Test checklist** (manual steps you must run before marking DONE)


### Global Engineering & UX Standards (applies to 8D.2 → 11C)

These rules exist so two developers implement the same behavior.

#### S1. Posting actions are atomic + idempotent
**Posting actions** = Issue / Cancel / Return / Transfer / Write-off / Closeout / Reconcile / Approve.

For every posting action:
1) **Validate server-side** business rules + permissions.
2) Execute all DB writes in **one DB transaction**.
3) Be **idempotent**: if the doc is already in the target state, do **zero writes** and return a 409 with a stable error code.
4) On any failure: **no partial posting** (transaction rollback) and create a **SystemLog** entry (AuditLog comes in 9A).

#### S2. Standard API error contract (so UI is consistent)
- **Business-rule block**: HTTP **409** with:
  - `code` (stable machine code)
  - `message` (human)
  - `actionHint` (what user should do next)
- **Validation**: HTTP **400** with `fieldErrors`.
- **Permission**: HTTP **403** with `code: FORBIDDEN`.
- **Not found**: HTTP **404`.

UI must render errors the same way everywhere:
- Top banner with `message`
- Inline highlights from `fieldErrors`
- A clear next step from `actionHint` (link/button)

#### S3. Multi-step UI pattern (stepper + resumable)
Any workflow that requires multiple steps must be a **stepper** and must be **resumable** (state stored in DB):
- Step 1: Draft
- Step 2: Required intake/selection (units, allocations, excluded days, etc.)
- Step 3: Issue/Post complete

If an action is blocked by business rules, the UI should:
- Disable the action button
- Show a tooltip (“Why?”)
- Show a banner explaining how to unblock

#### S4. OWNED Units are never “free-created”
- OWNED units are created **only** by stock-affecting workflows:
  - PurchaseBill issue (8D.2)
  - UsedIntake accept (8H)
  - ConsignmentIntake accept (8I)
- The only exception is **Unitization** (8D.1.7): converting **already-existing tracked stock** into units **without changing stock**.
- `/admin/units/new` must **never** create OWNED.

#### S5. Concurrency + locking standard
- Posting actions must check doc state at the start and at commit time.
- If two tabs try to post at once: one wins, one gets 409 `DOC_ALREADY_<STATE>`.
- Serial/tag uniqueness is enforced at DB level; UI pre-validations are best-effort only.

#### S6. Minimal logging before Phase 9A
Until 9A is implemented, anything that would normally be an AuditLog must at least:
- Write a SystemLog entry (who/what/when/docId)
- Store required reason notes on the document itself (e.g., editReasonNote)


---

### ✅ 8D.1 — Unit foundation + product tracking flag (DONE)
- Unit table + admin CRUD
- Product flag: `Product.isAssetTracked` (true for machines/tools)
- Unit fields include: ownershipType, status, currentLocationId, serial/tag identity fields

> **Acceptance rule 8D.1:** you can’t create a unit for a non-tracked product (UI + API enforce).

---

### 🟡 8D.1.6 — Product Catalog Admin (REQUIRED PREREQ; add if missing)
**Why:** without product create/edit, you cannot safely drive unit tracking, VAT, pricing, or serial rules.

**Deliverables**
- Admin module: `/admin/products`
  - List + search + filters (type/category, isAssetTracked, active/inactive)
  - Create product
  - Edit product
- Fields to support unit tracking + VAT printing + rentals:
  - `isAssetTracked` (toggle)
  - `serialRequired` (toggle; for “sometimes” tracked parts)
  - **Brand + Model fields** (REQUIRED for machine SKUs; strongly recommended for all asset-tracked products)
  - Price fields as you already use (sale price, purchase price optional, etc)
- Guardrails:
  - If `isAssetTracked=true`, **brand+model required**.
  - If `serialRequired=true`, manufacturer serial becomes mandatory for units of that product.

**Test checklist (8D.1.6)**
- Create a non-tracked product (no brand/model required).
- Create a tracked product with brand/model.
- Toggle `serialRequired` ON and confirm unit creation enforces it.

**Commit message example:** `Phase 8D.1.6: Admin Products CRUD + tracking flags`

---



### 🟡 8D.1.7 — Go‑live Unitization for existing tracked stock (NO stock change)

**Why this exists:** If you already have `isAssetTracked=true` products with stock recorded before unit tracking, you must create matching OWNED Units so later phases (8D.3+) can require unit selection.

**What it does:** Converts already-recorded `LocationStock.qty` into **OWNED Units**, without changing stock/ledger.

#### Rules (LOCKED)
- Only for products where `isAssetTracked=true`.
- Unit creation limit per **product + location**:
  - `allowedToCreate = LocationStock.qty - activeOwnedUnitsCount`
  - `activeOwnedUnitsCount` counts OWNED units at that location with status in:
    - `AVAILABLE`, `IN_SERVICE`, `RENTED_OUT`, `IDLE_AT_CUSTOMER`
  - SOLD/SCRAPPED/RETURNED units are excluded.
- Unit identity rules are identical to 8D.2.1 (brand/model required for machines; manufacturerSerial optional; shopTag required if manufacturerSerial missing).
- Permissions: Admin + Approved editor only.
- Must capture a reason note: “Go-live unitization” / “Stock reconciliation”.

#### UI/UX (LOCKED)
- A dedicated screen: **Admin → Products → Unitize stock** (recommended) OR **Admin → Units → Unitize**.
- Show:
  - current LocationStock
  - current active unit count
  - remaining units to create
- Block creation if remaining <= 0.

#### Done when
- You can take any tracked product that has stock, run Unitization, and after that the system forces unit selection on Sales/Transfers.

**Commit message:** `Phase 8D.1.7: unitize existing tracked stock into OWNED units without changing stock`

---
### 🟡 8D.2 — Mandatory unit intake on Purchases (OWNED)

#### 8D.2 Contract (must be true)
- A PurchaseBill cannot be **ISSUED** if it contains any `isAssetTracked=true` line and the required Units are not provided.
- **Issuing** a PurchaseBill is the single moment that posts:
  - LocationStock +qty
  - InventoryMovement IN
  - Ledger entries (if you track payables/payments)
  - OWNED Units creation for tracked lines
- No partial posting: either everything posts or nothing posts.
- Every created unit is placed into the chosen receiving location.

#### 8D.2.1 — Unit identity rules (serial/tag) (LOCKED)
- **Machines**: Unit creation requires `brand` + `model`.
- **Manufacturer serial collisions**:
  - Store `manufacturerSerial` as entered.
  - Store a derived `uniqueSerialKey` that is collision-safe.
- **uniqueSerialKey (LOCKED)**
  - If manufacturer serial exists: `BRAND|MODEL|MANUFACTURER_SERIAL` (normalized)
  - Else: `SHOP_TAG` (server-generated)
- If a machine has **no manufacturer serial**, shop tag is **required**.
- **Shop tag generation (LOCKED)**
  - server-generated and unique
  - format: `SS-M-0000001`, `SS-P-0000001`, etc.
  - separate counters per prefix; never resets
- After a unit is created by Purchase/Used/Consignment/Unitization:
  - identity fields (brand/model/serial/tag) are editable only by **Admin + Approved editor**
  - UI must require a reason note and store a UnitIdentityRevision snapshot

#### 8D.2.2 — PurchaseBill UX + posting flow (LOCKED)
- PurchaseBill is created as **DRAFT** for all purchases.
- “Issue” exists on the bill detail page.
- Issue UI:
  - If **no tracked lines**: show normal Issue confirmation.
  - If **tracked lines exist**: Issue UI becomes a **Unit Intake stepper**:
    - For each tracked line qty N: require N unit rows.
    - Each unit row captures brand/model + manufacturerSerial (optional) + shopTag (auto if needed).
    - Receiving location is chosen at issue time (bill-level selector; default SHOP).
    - Validation must enforce:
      - row count exactly equals qty
      - no duplicate uniqueSerialKey in the form
      - no duplicate uniqueSerialKey in DB

#### 8D.2.3 — UI & API lockdown (no free OWNED units) (LOCKED)
- `/admin/units/new` can create only:
  - CUSTOMER_OWNED units (service intake)
  - RENTED_IN units (supplier rentals)
- The OWNED option is **not shown** in UI.
- API hard-block:
  - `POST /api/admin/units` with `ownershipType=OWNED` returns **403** with code `OWNED_UNIT_CREATION_FORBIDDEN`.
- The ONLY non-document path to create OWNED units is the **Unitization wizard (8D.1.7)**.

#### 8D.2.4 — Transaction, idempotency, and failure UX (LOCKED)
- PurchaseBill issue is executed in a **single DB transaction**.
- If the transaction fails:
  - PurchaseBill remains **DRAFT**
  - **no Units** created
  - **no LocationStock/movement/ledger** written
  - UI shows a blocking error banner and keeps entered unit rows client-side
- Idempotency/concurrency:
  - If already ISSUED: return 409 `DOC_ALREADY_ISSUED` and UI redirects to detail.
  - If two tabs issue simultaneously: one succeeds, one gets 409; no duplicates.

**Commit message:** `Phase 8D.2: Purchase issue requires unit intake + atomic posting + OWNED unit lockdown`

---

### 🟡 8D.3 — Unit selection required for all stock-changing documents
**Goal:** for tracked products, every OUT/IN/move operation identifies exact units.

**LOCKED rules**
- Sales/POS: unit selection happens at **ISSUE** time only.
- Sales return: must select units from the original sale (`soldUnitIds` stored per line).
- Transfers: can only select units currently at FROM location.
- Write-off/scrap: must select units; unit becomes terminal **SCRAPPED** and cannot be reused.
- Purchase return: must select units; unit becomes terminal **RETURNED_TO_SUPPLIER**.
- **No override:** staff cannot post tracked qty without selecting units.

**Implementation expectations**
- Data model:
  - Store `unitIds` on each relevant document line (sales, pos, returns, transfers, writeoffs, purchase returns).
- Posting logic:
  - On issue, validate N unitIds = qty for tracked lines.
  - Update Unit:
    - Sale: status SOLD (terminal)
    - Sale return: status AVAILABLE + location SHOP (or chosen)
    - Transfer: location updated to TO location
    - Write-off: status SCRAPPED (terminal)
    - Purchase return: status RETURNED_TO_SUPPLIER (terminal)

**Test checklist (8D.3)**
- Attempt to issue a SalesInvoice with tracked qty=1 without selecting unit → blocked.
- Sell a unit → unit becomes SOLD and cannot be selected again.
- Return that sale → only that sold unit can be returned; unit becomes AVAILABLE.
- Transfer tracked unit from SHOP to WAREHOUSE → only SHOP units selectable; location updates.
- Write-off a unit → becomes SCRAPPED and never selectable again.

**Commit message example:** `Phase 8D.3: Require unit selection for all tracked stock documents`

---

### 🟡 8D.4 — Rentals reserve specific unit (LATER, keep as roadmap intended)
- Upgrade rental contracts to reserve specific Units
- Prevent double-booking across active rentals
- Rental lifecycle updates unit status:
  - Active → RENTED_OUT
  - Closed/returned → AVAILABLE

> Keep this after 8D.3 so the unit-selection foundation exists first.

---

### 🟡 8D.5 — RENTED_IN supplier rentals (outsourced units)
**Goal:** track supplier-owned machines used temporarily in your business without polluting owned stock.

**LOCKED rules**
- RENTED_IN units **never touch Product.stock/LocationStock**.
- RENTED_IN units still have location + status history.
- RENTED_IN units **cannot be sold** to customers.
  - If you buy it, it becomes OWNED via Purchase flow.

**Supplier billing + settlement (aligned with 8F)**
- Supplier usage allocations drive monthly supplier bills.
- Supplier bills are generated as **Draft → Final** (staff can edit rates/excluded days/unit list before final).
- Non-billable days tracked for both:
  - customer billing
  - supplier billing
- Settlement between shops:
  - **Separate bills + settlement journal entry** referencing both sides.

**Test checklist (8D.5)**
- Create RENTED_IN unit → confirm no Product/LocationStock changes.
- Allocate RENTED_IN unit to a customer rental → tracked in history.
- Generate month-end supplier bill draft → edit → finalize → settlement entry created.

**Commit message example:** `Phase 8D.5: Rented-in units + supplier contracts + month-end bills`

---

### 🟡 8D.6 — Unit attachments (parts moving between machines)
**Goal:** track detachable parts (motor/board/pedal/etc) that move between multiple machines.

**LOCKED rules**
- A part can move between machines over time (YES).
- Enforce: **one part-unit can be attached to only one machine at a time**.
- Attach/detach must require a **reason note**.
- Separation does **not** change stock by itself.

**Data model expectations**
- `UnitAttachmentHistory` (partUnitId, machineUnitId, action ATTACH/DETACH, reason, date, performedBy)
- Optional: `currentParentUnitId` on part-unit for fast lookup

**Test checklist (8D.6)**
- Attach motor-unit to Machine A → shows as attached.
- Attempt attach same motor-unit to Machine B without detaching → blocked.
- Detach with reason → history records.

---

### 🟡 8D.9 — Disassembly / Unbundle (selling separated parts)
**Goal:** if you remove a component and keep/sell it separately, inventory must reflect it.

**LOCKED rules**
- Disassembly doc is required.
- Disassembly creates **stock-IN** for the component (LocationStock +1).
- If the extracted component is serial-tracked:
  - create a new part-unit asset
- Machine unit must be flagged **INCOMPLETE_KIT** when critical parts removed.

**Test checklist (8D.9)**
- Disassemble machine → part stock increases + unit created (if tracked).
- Machine shows INCOMPLETE_KIT.

---

## 🟡 PHASE 8E — Service & Issue Tracking (START AFTER 8D.3)

### 8E Locked policy summary
- **ServiceTicket is required for every ServiceInvoice** (invoice issued from ticket).
- Ticket can be created for: CUSTOMER_OWNED + OWNED + RENTED_IN units.
- One unit per ticket (recommended).
- Service parts posting supports per-line location.
- Old part outcomes supported (keep as spare / return to customer / scrap), and stock must be explicit.

---

### 🟡 8E.1 — ServiceTicket foundation (LOCKED)

ServiceTicket exists so every service job is traceable and can later explain parts use, warranty, and unit history.

#### Ticket scope (LOCKED)
- One **unit** per ticket.
- Ticket can be created for: CUSTOMER_OWNED, OWNED, RENTED_IN units.
- A ServiceInvoice is issued **from a ticket** (ticket required).

#### Ticket status machine (server-enforced) (LOCKED)
Allowed transitions (any invalid transition must return 409 `INVALID_STATUS_TRANSITION`):
- `OPEN → IN_PROGRESS` (any user with Service permission)
- `IN_PROGRESS → RESOLVED` (Service permission; requires resolution note)
- `RESOLVED → CLOSED` (Admin + Manager only)
- Optional admin-only transitions:
  - `OPEN/IN_PROGRESS/RESOLVED → CANCELED` (requires reason; cannot cancel if a ServiceInvoice is already ISSUED)

Timestamps (must be stored): `openedAt`, `startedAt`, `resolvedAt`, `closedAt`.

#### Unit status/location coupling (LOCKED)
- When ticket is created: unit status becomes `IN_SERVICE` and unit location becomes the chosen intake location (default SHOP; can select SERVICE location if you maintain one).
- When ticket becomes `RESOLVED`: unit status becomes `AVAILABLE` (per your earlier lock).
- Closing a ticket does not change stock/ledger; it is an operational marker.

#### ServiceInvoice creation + issuing (LOCKED)
- Ticket can have **one** primary ServiceInvoice (MVP).
- ServiceInvoice is created as DRAFT from the ticket.
- Issuing the ServiceInvoice:
  - must run as one transaction (S1)
  - posts parts stock OUT (by chosen locations) + ledger entries
  - can be partially paid
  - if ticket status is not yet RESOLVED, issuing auto-sets it to RESOLVED

#### UX standards (LOCKED)
- UI must show only the valid next actions based on status + permissions.
- If an operation is blocked by a rule, the UI must:
  - disable the button
  - show tooltip “Why?”
  - show a banner explaining the exact unblock step



### 🟡 8E.2 — ServiceInvoice (from ticket) + payments + numbering
**LOCKED**
- ServiceInvoice has its own annual sequence: `SRV-YYYY-0001`.
- Supports partial payments.
- Ledger entries per payment method (cash/bkash/nagad/bank).
- Warranty:
  - stored fields: warrantyDays, warrantyType, warrantyStartDate (issue date)
  - shown on printed invoice

**Test checklist**
- From a ticket, issue a ServiceInvoice with labor + parts.
- Add partial payment → ledger entry created.
- Print includes warranty terms.

**Commit message:** `Phase 8E.2: ServiceInvoice issuing + payments + SRV numbering`

---

### 🟡 8E.3 — Parts posting + serial handling + salvage automation
**LOCKED**
- Parts used: per-line location selection.
- Serial-tracked part not found in system:
  - allow free-text serial + reason
  - also create placeholder unit (CUSTOMER_OWNED style) for later reference
- Handling old part outcomes (A/B/C):
  - System auto-generates Salvage/Disassembly doc from ServiceInvoice when keeping/scrapping parts.

**Test checklist**
- Install serial-tracked motor from stock (select unit) → stock updated.
- Install motor by free-text serial (not in system) → placeholder unit created + reason stored.
- Replace old motor and keep it as spare → salvage doc created + stock IN.

**Commit message:** `Phase 8E.3: Service parts stock posting + salvage automation`

---

### 🟡 8E.4 — Ticket closeout + warranty repeat behavior
**LOCKED**
- Unit state reverts from IN_SERVICE → AVAILABLE when ticket is Resolved/Closed.
- Warranty repeat tickets:
  - UI warns, staff can still bill, but must provide reason.
- Who can close ticket: Admin + Manager.

**Test checklist**
- Close ticket → unit status updates.
- Create repeat ticket under warranty → warning + reason required to bill.

**Commit message:** `Phase 8E.4: Service ticket closeout + warranty repeat rules`

---

## 🟡 PHASE 8F — Financial Ops Enhancements

### 🟡 8F.1 — Opening balances (wizard)
**LOCKED**
- Posting account: dedicated ledger account `Opening Balance Equity`.
- Timing: one-time opening balances at go-live date.

**Scope**
- Wizard supports opening balances for:
  - Parties (receivable/payable)
  - Ledger accounts (cash/bkash/nagad/bank)
  - Inventory (optional, if you want to start with counted stock)

**Commit message:** `Phase 8F.1: Opening balance wizard (go-live only)`

---

### 🟡 8F.2 — Cash drawer (daily cash control)
**LOCKED**
- Support multiple drawers/registers with IDs.
- Non-document cash movements use a `CashAdjustment` doc.
- Cash close is recommended but not blocking.
- Cash close requires:
  - count cash
  - auto-calc expected from ledger
  - record discrepancy + reason note

**Commit message:** `Phase 8F.2: Cash drawers + cash close + cash adjustments`

---

### 🟡 8F.3 — Reconciliation (Bank + Bkash + Nagad)
**LOCKED**
- Statement input method: CSV upload + manual entry.
- Fees/charges: ledger entries for fees (separate expense category) during reconciliation.
- Reconciled items become protected (admin override only).

**Commit message:** `Phase 8F.3: Reconciliation for Bank/Bkash/Nagad`

---

### 🟡 8F.4 — Rental billing rules (customer + rented-in suppliers)
**LOCKED**
- Billing calendar template: global per month (Friday + holidays) + per-contract additions at bill generation.
- IDLE_AT_CUSTOMER timeline stored.
- IDLE stops billing starting that date (inclusive).
- Damage/missing assessed at rental closeout only.
- Penalty invoice: SalesInvoice with “Penalty” category.
- Supplier bill generation: month-end from allocations/usage.
- Settlement posting: journal entry referencing both bills.

**Commit message:** `Phase 8F.4: Rental billing calendar + idle + penalties + supplier settlement`

---

## 🟡 PHASE 8G — VAT, Numbering, Print

**LOCKED**
- VAT%: shop default, editable per invoice.
- VAT breakdown printing: show only when VAT mode is “added on top”.
- Rounding storage: store exact totals; rounding applied at payment/print time.
- Yearly reset per doc type:
  - PurchaseBill: `PUR-YYYY-0001`
  - RentalBill: `RNT-YYYY-0001`
  - Transfer: `TRN-YYYY-0001`
  - ServiceInvoice: `SRV-YYYY-0001`
  - SalesInvoice: `INV-YYYY-0001`
  - POS: `POS-YYYY-0001`
- SalesInvoice print (A4) must include BD VAT basics:
  - business name/address, VAT/BIN
  - customer info (if provided)
  - invoice date/number
  - VAT% + VAT amount
- Bilingual print: labels/headings only.
- POS vs Invoice VAT behavior: shop default mode, editable.

**Commit message:** `Phase 8G: VAT + numbering + A4 print standardization`

---

## 🟡 PHASE 8H — Used Machines (trade-in/refurb/resale)

### 🟡 8H.1 — Used intake document
**LOCKED**
- Dedicated doc type: `UsedIntake`.
- Used units must always be unit-tracked and become OWNED once accepted.
- Two docs for trade-in-with-sale: UsedIntake + SalesInvoice linked.
- Grade lives on the Unit (custom labels).
- If trade-in payment is later: payable balance to customer (Party balance).

**Commit message:** `Phase 8H.1: UsedIntake doc + used unit grading + payable balance`

---

### 🟡 8H.2 — Refurb tracking
**LOCKED**
- Refurb record attached to Unit with ledger + parts consumption.
- Parts consumption recorded via doc: `RefurbPartsUse`.
- Used machine resale treated like normal sales (VAT rules apply).
- Optional used sale warranty days on SalesInvoice line/unit.
- Separate Used SKU per model (pricing clarity).

**Commit message:** `Phase 8H.2: RefurbRecord + RefurbPartsUse + used resale rules`

---

## 🟡 PHASE 8I — Consignment (define now; implement later)

### 🟡 8I.1 — Consignment intake and stock buckets
**LOCKED**
- Dedicated doc: `ConsignmentIntake`.
- LocationStock bucketed: OWNED vs CONSIGNMENT.
- Consigned machines are unit-tracked immediately.

### 🟡 8I.2 — Selling consignment
**LOCKED**
- Sell via normal SalesInvoice/POS, but mark items as CONSIGNMENT.
- Post payable to supplier (settled later).
- Payout basis: sale price − commission %.
- Selling price: supplier suggested, shop final.
- UI must show ownership bucket and block incorrect mixing.

### 🟡 8I.3 — Consignment returns & reporting
**LOCKED**
- Return to supplier moves stock out of CONSIGNMENT bucket + unit status RETURNED.
- Reports show consignment separately (profit vs payable).
- Consigned units blocked from rentals by default.

---

# 🟡 PHASE 9 — People, Security, Accountability (NOT STARTED)

## 🟡 PHASE 9A — Security & Multi-User + Audit + Controlled Edits

### 🟡 9A.1 — Authentication + sessions (BD shop reality)
**LOCKED**
- Staff login: username/phone + password (email unreliable).
- Password reset: admin resets staff passwords.
- Store identifiers: both optional but at least one required.
- Phone normalized to E.164.
- Session model: cookie session backed by server-side session table.
- Session control: limit to N active sessions per user (N=2).

### 🟡 9A.2 — Roles + permissions (configurable templates)
**LOCKED**
- Seed roles: Admin/CEO/Manager/Staff/Accountant/Engineer/Helper.
- Use RolePermission table (templates per role; editable later).
- Approved editor is **per-module** (e.g., Sales editor vs Accounts editor).

### 🟡 9A.3 — Audit + revisions + restore (non-negotiable)
**LOCKED**
- All doc types editable via **reverse & repost**.
- Reverse & repost mechanics:
  - automatically create reversal movements/ledger entries + repost new.
- Revision storage:
  - store full JSON snapshot for **every issued doc revision forever**.
  - keep snapshots for non-issued docs forever.
- Restore original:
  - create a new revision that reverts content (audit-safe).
- Audit coverage includes:
  - issue/cancel/pay/edit/return/transfer/writeoff
  - reconciliation + cash close
  - unit status changes
- Two-person approval: planning only (not MVP).

**Commit message:** `Phase 9A: Auth + roles + permissions + audit + reverse&repost`

---

## 🟡 PHASE 9B — Employee Management (directory + attribution)

### 🟡 9B.1 — Employee directory
**LOCKED**
- Employee can exist without login.
- Employee optionally links to User.

### 🟡 9B.2 — Attribution plumbing
**LOCKED**
- Store both userId and employeeId on documents.
- Default performedBy = current user + mapped employee if exists.

**Commit message:** `Phase 9B: Employees directory + performed-by attribution`

---

## 🟡 PHASE 9C — Payroll (ledger-linked)

**LOCKED**
- MVP includes: Base salary + Deductions + Advances + Allowances.
- Monthly cycle + supports early pay + mid-month quit settlement.
- Once PayrollRun is marked Paid: protected (admin override only).

**Commit message:** `Phase 9C: PayrollRun + ledger posting + locking`

---

## 🟡 PHASE 9D — Customer Accounts + Portal (NEW; prevents later rework)

### 🟡 9D.1 — CustomerUser identity + linking
**LOCKED**
- Customer signup: both (self-signup + staff-created).
- Customer login: phone + password.
- Guest checkout allowed forever.
- CustomerUser links 1:1 to Party.
- Multiple customer users can map to one Party (company).

### 🟡 9D.2 — Customer portal (read-only by default)
**LOCKED MVP includes**
- Order history
- Payment history + receipts
- Sales invoices history (if shared)
- Rental history
- Download/print invoice PDFs

**Important visibility rule (LOCKED)**
- Staff-created SalesInvoice does **NOT** appear automatically in portal, even if Party linked.
  - Future: explicit “Share to portal” toggle if you want.

### 🟡 9D.3 — Portal actions
**LOCKED**
- Profile + addresses update
- Request support / create service ticket
- Online payments: later (heavy)

### 🟡 9D.4 — Returns/refunds visibility
**LOCKED**
- Show return/refund history.

**Commit message:** `Phase 9D: Customer login + portal (history, PDFs, support requests)`

---

# 🟢 PHASE 10 — Backup, Sync & Deploy (NOT STARTED)

## 🟢 10A — Backups (automated)
**LOCKED**
- Target DB: PostgreSQL.
- Frequency: every 6 hours (or daily if low activity).
- Retention: keep last 30 days + monthly snapshots for 12 months.
- Encrypt backups at rest.
- Verification: daily restore-into-temp-db test if feasible.

## 🟢 10B — Restore (admin-only)
**LOCKED**
- Restore replaces whole DB.
- Restore requires maintenance mode.
- If restore fails mid-way: rollback automatically to pre-restore snapshot.

## 🟢 10C — Offline drafts + sync (safety-first)
**LOCKED safety rule**
- Offline = drafts only.
- Issuing/posting stock requires online DB connection + approval.

**LOCKED details**
- Device identity: server-issued Device record.
- Offline draft signature: author user + deviceId + local timestamp.
- Draft scope: all docs can be drafted offline.
- Ownership after sync: shared (approved staff can edit).
- Approval: Admin + Manager; approver can fill missing final details (issue location/payment).
- Conflicts: warn at draft time (stock unknown offline); enforce strictly at issue.
- Attachments: allowed offline and sync later.
- Sync mechanism preference: event-log (append-only actions, traceable).

## 🟢 10D — Deploy plan + environment hardening
**LOCKED**
- Initial deployment: one shop server PC, other devices access via LAN (browser).
- Future cloud: cloud becomes primary DB; shop PCs access it.
- Migrations in production: run only from server admin account + maintenance window.

## 🟢 10E — Monitoring/logging basics
**LOCKED**
- System logs retention: keep forever.
- Only errors that block issuing/posting create AuditLog too.
- Time: store timestamps in UTC; display in Asia/Dhaka.
- Printing can mark doc as “printed” (no stock/ledger effect).
- Exports include: Units/assets + unit history + attachments metadata.

---

# 🟣 PHASE 11 — AI (Optional, Read-only first) (NOT STARTED)

## 11A — AI Product Advisor (customer-facing)
**LOCKED**
- Runs cloud-only first.
- Languages: EN + BN.
- Stock display: default tiered availability (Available / Limited / On request).
- Rental recommendations: only show rental available yes/no and “Contact for price”.
- Fallback: always route to human contact if user asks for exact stock/delivery promises.
- Allowed single write type: `LeadRequest` (name/phone/message).

## 11B — AI Admin Assistant (internal)
**LOCKED**
- Access: Admin only.
- Output format: clickable links + summary.
- Stock explanation: must cite exact doc IDs/movements.
- Sensitive info rule (clarified):
  - AI can access and show to Admin whatever Admin permissions already allow (cost/profit/supplier/pricing/payroll).
  - AI must **not** reveal personal customer data to non-admin roles, and must apply role-based visibility.
  - Implementation must minimize data sent to model provider (redaction + least-privilege retrieval).

## 11C — AI Content Assistant
**LOCKED**
- Draft only; manual approval required.
- Generates: EN description, BN description, SEO title/meta, bullet highlights.
- Versioning: keep last N=10 per product.
- Approvers: Admin + Manager.
- Anti-duplication: always rephrase; avoid copying.

## Cross-cutting AI rules
- Conversation logging: store both customer + admin sessions.
  - Recommended default retention (editable):
    - Customer advisor: 90 days
    - Admin assistant: 180 days
- Downtime: show “AI unavailable” + contact fallback.
- Prompt-injection defense: hard-block revealing hidden instructions/private data/executing actions.
- Provider-agnostic abstraction layer.

---

# ✅ “Keep for later” backlog (tracked, not blocking current phase)

- Edit existing records beyond reverse&repost (requires 2-person approvals if you want)
- Rental unit custody/location tracking (customer site vs shop) once 8D.4 ships
- Better discoverability for Sales bills list page
- Ledger entries: ensure every ref type has a clean clickable destination
- Locations enhancements:
  - Per-document location selection everywhere
  - Stock by location report page
  - Transfer detail page + print
- Asset/unit enhancements:
  - Bulk unit intake tools (scan serials, paste list)
  - Barcode/QR printing for unit tags
  - Unit history page (linked docs timeline)

---

# NOTE: For each phase and subphase, you must give me some tests before I mark that phase as passed and commit it to GitHub

- You should provide an appropriate commit message too.
- You are allowed to add subphases if it’s necessary to cleanly implement a phase or feature.
