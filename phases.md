## 🧭 SMART SEWING SOLUTIONS — MASTER PHASE ROADMAP (v3.2, patched for Assets + later phases)

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

**Known issues at current stop (must finish in 8C.2):**
- POS redirect bug: after creating POS sale, redirects to `/admin/invoices/undefined` (data created but UI route wrong).
- POS payments UX/regression: selecting Cash/Bkash etc isn’t recording payment / invoice remains UNPAID.
- Sales invoice draft page missing Issue/Cancel actions (regression or unfinished wiring).
- Ensure ALL stock-changing routes use the correct `LocationStock` compound unique key and field names (avoid `productId_locationId` vs `locationId_productId` mismatch).

> **Commit rule for 8C.2:** only mark DONE when: transfers work + all documents update LocationStock + POS redirect/payment and invoice actions are restored.

---

## 🟡 PHASE 8D — Asset Tracking (machines/tools as individual units) (ACTIVE / NOT STARTED)

**Purpose:** “Which exact unit is this?” (serial/tag, status, history, location for physical machines/tools)

**Core clarifications (to avoid confusion):**
- **Documents still drive inventory & ledger.**
- Assets do **not** create stock changes or ledger entries by themselves.
- **However:** for asset-tracked products, assets must be created/assigned as part of the document flow that brings the unit into operation.

### ✅ 8D.1 — Asset foundation + product tracking flag
- Product = SKU/catalog
- Asset = physical unit (serial/tag optional, status, notes, current location)
- Add `Product.isAssetTracked` (default false)
  - Only machines/tools should be set true (high-value items)
- Asset CRUD (admin):
  - Assets list (search by serial/tag, filter by status/location)
  - Create asset (product must be `isAssetTracked=true`)
  - Asset detail + edit (status, location, notes)
- Serial/tag uniqueness rule:
  - If serial/tag is present, it must be unique (global or per-product; pick one and enforce consistently)

> **Acceptance rule 8D.1:** you can’t create an asset for a non-tracked product; dropdowns and validations must enforce this.

### ✅ 8D.2 — Mandatory asset intake on acquisition (OWNED stock)
**Goal:** you cannot have an “active machine in the business” without tracking.

- For **Purchase Bills**:
  - If a purchase item’s product is `isAssetTracked=true` and qty = N:
    - Require creating/assigning **N Assets** as part of the receiving flow
  - Purchase still creates:
    - InventoryMovement IN
    - LocationStock(SHOP)+
    - Ledger (as already implemented)
  - Asset creation/assignment does **not** change stock; it only binds identities to units acquired
- UX options (choose one standard):
  1) Inline on Purchase Bill “Receive Assets” step, or
  2) Purchase Bill status “Pending Assets” until assets assigned

> **Acceptance rule 8D.2:** purchase of tracked items cannot be considered “fully received/usable” until assets are assigned for that qty.

### ✅ 8D.3 — Document-driven asset sync (location + lifecycle)
**Goal:** asset current location & status remains trustworthy without manual edits.

- Transfers:
  - If transfer includes asset-tracked products:
    - Allow selecting which Assets are moved (N assets for qty N)
    - Update each selected Asset.currentLocationId to TO location
- Sales / POS:
  - If selling asset-tracked products:
    - Select which Assets are sold for qty N
    - Mark assets as SOLD/DISPOSED (or inactive) and lock them from reuse
- Sales returns:
  - If returning asset-tracked products:
    - Select which Assets are returned
    - Restore asset to AVAILABLE and set location to SHOP
- Purchase returns:
  - Select which Assets are returned-to-supplier
  - Mark assets as RETURNED_TO_SUPPLIER (or inactive)
- Write-offs/scrap:
  - Select which Assets are scrapped
  - Mark SCRAPPED and lock from reuse

> **Acceptance rule 8D.3:** asset location/status must update only via documents for tracked products (manual edits allowed only for admin corrections, but document flow is the primary mechanism).

### 🟡 8D.4 — Rentals can reserve specific asset (LATER, keep as roadmap intended)
- Upgrade rental contracts (already exist from Phase 6) to reserve specific Assets
- Prevent double-booking the same asset across active rentals
- Rental lifecycle updates asset status:
  - Active → RENTED
  - Closed → AVAILABLE

> This stays “later” but is now explicitly placed as a subphase so the sequence is clear and followable.

---

## 🟡 PHASE 8E — Service & Issue Tracking (NOT STARTED)

*(Asset integration matters here; so we add subphases for clarity while keeping your original scope.)*

### ✅ 8E.1 — Issue tickets / work orders foundation
- Issue tickets/work orders
- Status: Open → In progress → Resolved → Closed

### ✅ 8E.2 — Linkage (asset/product + location + ledger expense ref)
- Link to asset/product + location + ledger expense ref
- Attach photos/notes (optional MVP)
- Basic timeline view of actions/notes on ticket

### ✅ 8E.3 — Assignment (deferred until Phase 9)
- Assign to employee/user after Phase 9

---

# 🟡 PHASE 9 — People, Security, Accountability (NOT STARTED)

## 🟡 PHASE 9A — Security & Multi-User
- Proper auth
- Roles (Admin/Staff)
- Permissions per module
- Audit log foundation

### ✅ 9A.1 — Authentication foundation (standard login + session)
- Implement login + logout + session persistence
- Protect admin routes properly (server-side protection, not only client-side)
- Password reset flow (email) if applicable
- Security basics: CSRF/session strategy, secure cookies, rate limit login (basic)

### ✅ 9A.2 — Roles + permissions (module-level)
- Define roles (minimum: Admin, Staff)
- Module-level permissions (POS, Purchases, Inventory, Reports, Transfers, Assets, Service)
- Enforce permissions on both API routes and UI navigation

### ✅ 9A.3 — Audit log foundation (minimum viable)
- Add AuditLog table (who, what, entity, action, timestamp)
- Log critical document actions: issue/cancel/returns/transfers/payments
- Provide simple admin page to search audit logs

> Audit is the foundation for “edit existing docs later” (keep-for-later backlog item).

## 🟡 PHASE 9B — Employee Management (directory + attribution)
- Employee records (active/inactive)
- “Performed by” links on documents (sales/purchase/returns/transfers/etc)
- Basic performance trail

### ✅ 9B.1 — Employee directory foundation
- Employee records (name, phone, role, status active/inactive)
- Link Employee ↔ User (if your auth uses User accounts)
- Admin UI for listing + create/edit employees

### ✅ 9B.2 — Attribution plumbing (“performed by”)
- Add performedByUserId/performedByEmployeeId to documents (where applicable)
- Auto-fill performedBy from current session user on create/issue/pay actions
- Display “performed by” on document detail pages

### ✅ 9B.3 — Simple performance trail
- Employee detail page shows linked docs count (sales, purchases, rentals, service tickets)
- Basic filters by date range (optional MVP)

## 🟡 PHASE 9C — Salaries / Payroll (ledger-linked)
- Payroll runs
- Salary/advance/deductions
- Ledger OUT linked to payroll doc

### ✅ 9C.1 — Payroll configuration
- Employee salary settings (monthly salary, default accounts/categories)
- Define payroll period rules (month boundary, optional pro-rate later)

### ✅ 9C.2 — Payroll run document
- PayrollRun document: period, employees included, gross/net, notes
- Supports marking as paid

### ✅ 9C.3 — Ledger integration
- On payroll run paid:
  - Ledger OUT entries created, linked to PayrollRun
  - Payment method/account recorded

### ✅ 9C.4 — Advances + deductions (optional within 9C)
- Salary advances and deductions linked to employee + ledger
- Payroll run can include deductions/advance settlement

---

# 🟢 PHASE 10 — Backup, Sync & Deploy (NOT STARTED)

- Backup/export/restore
- Production hardening
- Deployment plan
- Monitoring/logging basics

### ✅ 10A — Backup/export (MVP)
- Manual export (DB backup strategy for your chosen DB)
- Export critical data as files (CSV/JSON) for safety:
  - Products, Parties, Ledger, Documents, Movements, LocationStock, Assets
- Admin UI: “Export” page with download buttons

### ✅ 10B — Restore/import (MVP)
- Restore from DB backup (documented step-by-step)
- Optional: import from exported files (CSV/JSON) with validations
- Admin UI: “Restore” page (guarded, admin-only, confirmation required)

### ✅ 10C — Sync strategy (optional, depends on your deployment)
- Define whether the system is:
  - Single local machine
  - Local network server
  - Cloud hosted
- If sync is required later:
  - Introduce a safe sync plan (not full real-time replication unless needed)

### ✅ 10D — Deploy plan + environment hardening
- Environment config strategy (dev/staging/prod)
- Proper secrets handling
- Production build pipeline (CI optional)
- Database migration workflow in production
- Backups scheduled (cron/host-level)

### ✅ 10E — Monitoring/logging basics (MVP)
- Error logging strategy (server logs + optional log viewer)
- Basic health check endpoint
- Track key failures (failed payments, failed doc issues, failed stock validations)

---

# 🟣 PHASE 11 — AI (Optional, Read-only first) (NOT STARTED)

## 11A — AI Product Advisor (customer-facing)
- Chat UI on shop
- Suggest products based on catalog + availability
- Read-only

### ✅ 11A.1 — Safe data layer (read-only)
- Define what the AI can read: product catalog, prices, stock availability (read-only)
- Redact sensitive info (cost price, supplier margins if needed)
- Hard guardrails: no write operations

### ✅ 11A.2 — Advisor UX (MVP)
- Simple chat UI on public shop
- Suggested products with links
- “In stock / out of stock” messaging

### ✅ 11A.3 — Quality + safety checks
- Basic eval prompts
- Refusal behavior (no policy violations)
- “Not sure” fallback behavior

## 11B — AI Admin Assistant (internal)
- Natural language → filters/reports
- Read-only

### ✅ 11B.1 — NL → structured filters (MVP)
- Translate admin questions into existing filters:
  - “show unpaid invoices this month”
  - “sales today by cash”
  - “low stock items”
- Output must be clickable links to existing report pages/filters

### ✅ 11B.2 — Admin search assistant (read-only)
- Search across documents, parties, assets, movements
- Return ranked results + links (no edits)

### ✅ 11B.3 — Permissions/visibility alignment
- AI respects roles/permissions from Phase 9
- Staff users cannot query restricted info

## 11C — AI Content Assistant
- Rewrite descriptions (EN/BN), SEO text

### ✅ 11C.1 — Draft generation (read-only draft)
- Generate description drafts (EN/BN)
- Generate SEO titles/meta descriptions
- Store as drafts, not auto-publish

### ✅ 11C.2 — Approval workflow (minimal)
- Admin approves/rejects drafts
- Version history for generated drafts

### ✅ 11C.3 — Bulk generation tools (optional)
- Select multiple products and generate drafts in batch
- Queue-based processing (later if needed)

---

# ✅ “Keep for later” backlog (tracked, not blocking current phase)

- Edit existing records (requires audit strategy)
- Improve Party auto-fill in rental contracts when selecting Party
- Sales bills list page / better discoverability
- Ledger entries: ensure every ref type has a clean clickable destination
- Locations enhancements:
  - Per-document location selection (purchase into WAREHOUSE, sales from SHOP, etc.)
  - Stock by location report page
  - Transfer detail page + print (optional)
- Asset enhancements (after 8D baseline ships):
  - OwnershipType for assets (OWNED / CUSTOMER_OWNED / RENTED_IN) if needed for service workflows
  - Asset history page (linked docs timeline: purchase, sale, transfer, service, rental)
  - Bulk asset intake tools (scan serials, paste list, etc.)
  - Barcode/QR printing for asset tags

---

# NOTE: For each phase and subphase, you must give me some tests before I mark that phase as passed and commit it to GitHub (You should provide an appropriate message for the commit as well [Example: Phase 8C.1: Locations foundation (Location model + movement fields)]

### IMPORTANT: You are allowed to add subphases if it's necessary to cleanly implement a phase or a feature.
