## # 🧭 SMART SEWING SOLUTIONS — MASTER PHASE ROADMAP (v2)

> **Design goal:** fast daily shop operations (sales, purchases, stock, payments)
> **Rule:** documents drive inventory & ledger (no “magic stock changes”)
> **Ops goal:** everything important is linkable + searchable later (who/what/where/why)

---

### ✅ PHASE 1 — Public Shop Foundation *(DONE)*

* Product listing & detail pages
* Cart & checkout flow
* Order creation
* Payment instructions (Bkash / Nagad / Bank)
* Basic customer checkout UX

### ✅ PHASE 2 — Admin Orders & Payments *(DONE)*

* Admin dashboard
* Orders list & detail
* Confirm / cancel orders
* Payment status tracking
* Admin route protection

### ✅ PHASE 3 — Payment Tracking Enhancements *(DONE)*

* Manual payment confirmation
* Transaction reference storage
* Admin filters (status / payment)
* Clean order lifecycle

### ✅ PHASE 4 — Sales Invoices *(DONE)*

* Inventory ledger model (movements tied to docs)
* Sales invoice draft → issue/cancel
* Inventory OUT on issue
* Printable invoice
* Order → Invoice automation + admin UX improvements

### ✅ PHASE 5 — Inventory Ledger & Adjustments *(DONE)*

* Manual stock adjustments with before/after
* Movements UI + adjustment docs UI + references/filtering

### ✅ PHASE 6 — Accounting + Rentals *(DONE)*

* Ledger accounts/categories/entries + admin UI
* Rental contracts lifecycle (Draft → Active → Closed)
* Stock lock via rental
* Rental bills + admin module (list/detail/print)
* Issue/cancel/mark paid + ledger integration

---

## 🚀 NEXT PHASES

### 🟡 PHASE 7A — Counter Sales (Sales Bills / POS) **(NEXT)**

**Purpose:** make the admin usable “like a shop counter” daily.

* Fast create “Sales Bill” (can reuse/extend SalesInvoice)
* Fast product search + quick add qty/discount
* Payment selection (Cash/Bkash/Bank) → Ledger IN
* Inventory OUT + movement refs
* Print-friendly
* Optional customer name/phone (walk-in support)

✅ This is where “sales bills” lands. This is the big missing piece.

---

### 🟡 PHASE 7B — Purchases (Supplier Bills / Stock IN)

**Purpose:** complete the inventory cycle.

* Purchase bill document (supplier, items, costs)
* Stock IN + movement refs
* Pay now / pay later → Ledger OUT (and later “due”)
* Printable purchase bill

---

### 🟡 PHASE 7C — Parties + Contacts (Customers / Suppliers)

**Purpose:** searchable history, clean records, and future “dues”.

* Party master: Customer / Supplier
* Store contact info:
  * name
  * phone(s)
  * address
  * company name (optional)
  * notes/tags (optional)
* Link party to documents:
  * Sales Bills / POS bills
  * Sales Invoices (existing)
  * Purchase Bills
  * Rentals + Rental Bills
* Party detail page:
  * document timeline (all linked records in one place)
  * quick search + filters
* Quick-add party from POS / Purchases (so counter flow stays fast)

> This is the “contact management” layer that makes everything linkable later.

#### Concerns
* Not auto filling all fileds in rental contracts when selecting a party from the dropdown list
---

### 🟡 PHASE 7D — Returns, Corrections, Write-offs (Very important)

Most inventory apps feel “real” only when these exist.

* Sales return / exchange (Inventory IN back + ledger adjustments)
* Purchase return (Inventory OUT back + supplier adjustment)
* Damage/scrap/write-off document (Inventory OUT with reason)
* These become your “clean correction” tools instead of manual hacks

---

## 🟡 PHASE 8 — Operations & Tracking

### 🟡 PHASE 8A — Reports (MVP)

* Today/month sales summary
* Cash/Bkash/Bank summary
* Low stock
* Unpaid bills/invoices
* Rental income summary

### 🟡 PHASE 8B — Inventory UX Upgrade

* Better search & filters
* Categories/brands (optional)
* SKU/barcode (optional)
* Bulk operations (optional)

### 🟡 PHASE 8C — Locations / Warehouses (your “where is it?” problem)

This directly addresses:

* “Know machine current location”
* “Count: in warehouse vs in shop vs rented vs service”

MVP approach (fast + future-proof):

* Locations: `SHOP`, `WAREHOUSE`, `SERVICE`, etc.
* Movements record `fromLocation` / `toLocation` (or at least `locationId`)
* Show stock by location (even if you don’t track per-serial yet)

### 🟡 PHASE 8D — Asset Tracking (machines/tools as individual units)

This addresses:

* Machine in service / scrapped
* Tools broken
* A machine can be rented, then sold later

Key idea:

* **Product** = catalog/SKU
* **Asset** = a specific physical unit (optional serial number)
* Rentals (later) can reserve a **specific asset** (not just “stock count”)

MVP:

* Only track assets for important items (machines/tools), not for every small part.

### 🟡 PHASE 8E — Service & Issue Tracking (company ops)

This addresses your “tracking issues throughout the company”.

* Issue tickets / work orders:

  * machine in service
  * machine scrapped
  * tool broken
  * delivery problem
* Status workflow: Open → In progress → Resolved → Closed
* Link to:

  * asset/product
  * location
  * cost (ledger expense entry ref)
  * responsible employee/user (after Phase 9)

---

## 🟡 PHASE 9 — People, Security, Accountability

### 🟡 PHASE 9A — Security & Multi-User

* Proper auth
* Roles: Admin / Staff (later more)
* Permissions by module
* Audit log foundation (who did what)

### 🟡 PHASE 9B — Employee Management (directory + attribution)

* Employee records (role, contact, active/inactive)
* “Performed by” links on documents:

  * who sold a machine
  * who delivered a bill
  * who created a purchase
* Basic staff performance trail (searchable)

### 🟡 PHASE 9C — Salaries / Payroll (ledger-linked)

* Payroll runs (monthly)
* Salary, advance, deductions (later)
* Ledger OUT entries linked to employee/payroll doc

---

## 🟢 PHASE 10 — Backup, Sync & Deploy

* Backup/export/restore
* Production hardening
* Deployment plan
* Monitoring/logging basics

---

## 🟣 PHASE 11 — AI (Optional, Read-only first)

### 11A — AI Product Advisor (customer-facing)

* Chat UI on shop
* Suggest products based on catalog + stock availability
* Strictly read-only (no orders/stock changes)

### 11B — AI Admin Assistant (internal)

* “Natural language → existing filters / reports”
* Still read-only

### 11C — AI Content Assistant

* Rewrite product descriptions (EN/BN), generate SEO text

---


## Concerns

* Tracking issues throughout the company
  - Machine in service
  - Machine scraped
  - Tools broken
  - ETC

* Employee Management
  - Track Employees
  - Track Salaries
  - Track other things related
  - Linking Employee to Each task carried out throughout the company
    - Someone sold a machine
    - Someone delivered a bill
    - Someone bought an equipment / tool
    - ETC

* Machine / Parts Tracking
  - Know Machine Current Location
  - Get Instant Inventory Count
    - Sold
    - Rented out
    - In warehouses

* Contact Managment

* Advertisement

## Quick Fixes:
* Lack of linking in `Invoice` entries: `http://localhost:3000/admin/ledger/entries`