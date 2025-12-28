## 🧭 SMART SEWING SOLUTIONS — MASTER PHASE ROADMAP (v3, updated at current stop)

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

## 🟡 PHASE 8C — Locations / Warehouses (IN PROGRESS)

**Purpose:** “Where is it?” and stock by location.

### ✅ PHASE 8C.1 — Location foundation (DONE)
- `Location` table (SHOP/WAREHOUSE/SERVICE)
- `InventoryMovement.fromLocationId / toLocationId` (nullable)
- Seed default locations

### 🟡 PHASE 8C.2 — Location stock + transfers (IN PROGRESS / PARTIALLY APPLIED)
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

## 🟡 PHASE 8D — Asset Tracking (machines/tools as individual units) (NOT STARTED)

- Product = SKU/catalog
- Asset = physical unit (optional serial)
- Track assets only for high-value items (machines/tools)
- Rentals can reserve specific asset (later)

---

## 🟡 PHASE 8E — Service & Issue Tracking (NOT STARTED)

- Issue tickets/work orders
- Status: Open → In progress → Resolved → Closed
- Link to asset/product + location + ledger expense ref
- Assign to employee/user after Phase 9

---

# 🟡 PHASE 9 — People, Security, Accountability (NOT STARTED)

## 🟡 PHASE 9A — Security & Multi-User
- Proper auth
- Roles (Admin/Staff)
- Permissions per module
- Audit log foundation

## 🟡 PHASE 9B — Employee Management (directory + attribution)
- Employee records (active/inactive)
- “Performed by” links on documents (sales/purchase/returns/transfers/etc)
- Basic performance trail

## 🟡 PHASE 9C — Salaries / Payroll (ledger-linked)
- Payroll runs
- Salary/advance/deductions
- Ledger OUT linked to payroll doc

---

# 🟢 PHASE 10 — Backup, Sync & Deploy (NOT STARTED)

- Backup/export/restore
- Production hardening
- Deployment plan
- Monitoring/logging basics

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

- Edit existing records (requires audit strategy)
- Improve Party auto-fill in rental contracts when selecting Party
- Sales bills list page / better discoverability
- Ledger entries: ensure every ref type has a clean clickable destination
- Locations enhancements:
  - Per-document location selection (purchase into WAREHOUSE, sales from SHOP, etc.)
  - Stock by location report page
  - Transfer detail page + print (optional)


# NOTE: For each phase and subphase, you must give me some tests before I mark that phase as passed and commit it to GitHub (You should provide an appropriate message for the commit as well [Example: Phase 8C.1: Locations foundation (Location model + movement fields)]