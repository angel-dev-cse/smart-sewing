PHASE 8D — Units, Parts, Attachments, and Selling Accessories

8D.X Serial collision policy
Q1. How to store manufacturer serial collisions?
 ☐ A) Keep ManufacturerSerial + separate UniqueSerialKey (recommended)

Q2. Who enters brand/model to form serial key?
 ☐ A) Mandatory brand/model fields for machines (recommended)

8D.X Attachment history
Q3. Can a part (e.g. motor/board) move between multiple machines over time? (yes/no)
☐ Yes

Q4. Attachment enforcement: one part per machine at a time?
 ☐ A) Only allow attachment to one machine at a time (recommended)

Q5. Require reason note for attach/detach? (yes/no)
☐ Yes

8D.X Selling separated accessories/parts
Q6. If a part is removed and sold separately, should inventory reflect +1 on that part?
 ☐ A) Yes—use Unbundle/Disassembly doc (stock records change)

Q7. If A above, disassembly should:
 ☐ B) Create stock-IN for component (recommended)

8D.X Mandatory serial for parts "sometimes"
Q8. How should "sometimes" tracked parts handle serials?
 ☐ A) Product.serialRequired=true/false (setting per product; recommended)

PHASE 8D.5 + 8F — RENTED_IN and Rental Billing

Q9. Source for auto-generated supplier bill from usage?
 ☐ B) Accurate: use actual units allocated & days - but remember the we can also partially return machines to our supplier

Q10. Supplier billing "Draft → Final": should staff be able to edit rates, excluded days, unit list, then lock it?
 ☐ Yes

Q11. Non-billable days: Should workflow be "generate bill → choose excluded dates → preview → finalize"? (yes/no)
☐ Yes

IDLE_AT_CUSTOMER

Q12. Who can mark a unit as IDLE_AT_CUSTOMER (billing stops)?
 ☐ B) Approved staff

Q13. When IDLE is applied, require confirmation note? (yes/no)
☐ Yes

PHASE 8E — ServiceInvoice details

Q14. Should ServiceInvoice support:
a) Partial payments (like sales invoices)? (yes/no): Yes
b) Ledger entries per payment method (cash/bkash/bank)? (yes/no): Yes

Q15. Should warranty info store:
- warrantyDays?
- warrantyType (none/labor/labor+parts)?
- warrantyStartDate?
(yes/no): Yes

Q16. For manual override under warranty, should UI force a reason note? (yes/no)
 ☐ Yes

PHASE 8G — VAT mode, pricing

Q17. Sell with VAT included vs added on top in same day: possible? (yes/no)
 ☐ Yes

Q18. VAT% entry practice:
 ☐ A) Shop default, editable per invoice
 
PHASE 10C — Offline Multi-PC Sync

Q19. Are you OK with this safety rule: Offline = create drafts only, but issuing stock requires database connection? (yes/no)
 ☐ Yes

Q20. If issuing offline, OK with: On sync, stock conflicts block and must be manually resolved (no auto-merge)? (yes/no)
 ☐ Yes but as I said, no offline issuing for safety

Q21. Sync type preferred:
 ☐ A) "Event log" sync (action-based, traceable)

PHASE 9A — Controlled Edits, Audit, Approvals

Q22. "Approved staff" should be:
 ☐ B) a per-user flag (e.g. isApprovedEditor)

Q23. When editing an issued document, require reason note + audit log?
 ☐ A) Yes, mandatory reason + audit log (recommended)

Q24. Make certain docs non-editable always (correction docs only)? If yes, which? (yes/no; specify): ☐ No

Q25. Restrict edits to time window (e.g., same day) unless Admin override?
 ☐ No




PHASE 8I — Consignment (future but must be defined now to avoid rework)

Q26. How should consignment stock be represented in the system?
☐ B) Separate “consignment stock” totals (recommended)

Q27. Upon sale of a consignment item, when should supplier payout occur?
☐ B) Payable balance settled later (more standard)

Q28. Should consignment returns to supplier (unsold) be handled via a document workflow? 
☐ Yes

PHASE 8H — Used machines (trade-in/refurb)

Q29. For trade-in cash, is payment always immediate, sometimes later, or both? (immediate / later / both)
☐ Both

Q30. How should used machine grading be handled?
☐ B) Customizable labels (e.g., Excellent/Good/Fair) but codes are acceptable for these as well E,G,F,B etc.

Q31. Should refurb cost tracking result in:
☐ A) Ledger expenses

PHASE 8D.5 + 8F.5 — Supplier billing vs customer billing settlement

Q32. When generating supplier bills from allocations, how should they be grouped?
☐ A) One supplier bill per supplier per month

Q33. For settlement entries, what linking mechanism should be used?
☐ B) Ledger journal entry with references to both bills

PHASE 10C — Offline Draft Queue

Q34. Should an offline draft be editable across devices after sync, or owned by the creator device unless reassigned?
☐ Shared

Q35. Should there be an approval step where admin reviews offline-created drafts before allowing issue? (yes/no)
☐ Yes but approved stuff can do the same (Manager)

PHASE 9A — Protected docs list

Q36. Confirm these are protected by default (admin override only applies):
☐ Ledger entries/payments
☐ Reconciled bank matches
☐ Finalized supplier bills



PHASE 9A — Controlled edits + restore

Q37. When restoring a document to its original version, how should this be handled?
☐ A) Create a new revision that reverts content (recommended; keeps audit)

Q38. After editing/restoring an issued document, how should inventory/ledger impacts be applied?
☐ A) Reverse old movements/ledger entries and repost new ones (most standard)

Q39. For edits on high-risk documents, require 2-person approval?
☐ B) Yes, later (just planning)

PHASE 8D.9 — Disassembly / Unbundle doc (selling separated parts)

Q40. After disassembling a machine and extracting a part (e.g., pedal/motor), should the machine status indicate missing parts?
☐ A) “Incomplete kit” flag (recommended)

Q41. When extracting a component tracked as a unit-asset (with serial), should disassembly:
☐ A) Create a new part-unit asset and increase part stock

PHASE 8F — Rental billing calendar + supplier billing

Q42. For excluded days (e.g., global Friday closures), how should exclusions be recorded?
☐ A) Per contract, per billing period, stored on generated bill (recommended)

Q43. Billing period: Should bills be generated
☐ B) Any date range (e.g., 10th–10th)

Q44. For supplier non-billable days, use:
☐ A) Global Friday + per-supplier overrides

PHASE 10C — Offline drafts + approval gate

Q45. Who can approve offline drafts for issuing?
☐ B) Admin + Manager (approved staff)

Q46. If two devices create drafts that may over-sell stock (since issuing requires online), should the system warn at the draft step (“stock unknown offline”) and enforce stock strictly at issue time?
☐ Yes




# PHASE 8E — Service & Issue Tracking

Q48. Service ticket contents:
☐ One unit per ticket (recommended)

Q49. Who can a service ticket be created for:
☐ CUSTOMER_OWNED + OWNED shop units, include rented-in units too (recommended)

Q50. Service workflow options:
☐ Both (recommended)

Q51. Parts used in service - stock source:
☐ Select location (SHOP/WAREHOUSE) at invoice time (recommended)

Q52. Serial-tracked parts installed—handling:
☐ Both: select if available, else free-text with reason

Q53. Part replaced—old part outcomes:
☐ A+B+C

Q54. Service invoice pricing model:
☐ Labor as a single line + parts lines (MVP)

Q55. Warranty start date:
☐ From ServiceInvoice issue date (recommended)

Q56. Warranty scope:
☐ A + B

---

# PHASE 8F — Financial Ops Enhancements

Q57. Opening balance entry method:
☐ “Opening Balance” wizard per party/account (recommended)

Q58. Opening balances supported for:
☐ A + B + C (Keep as an option)

Q59. Cash drawer tracking:
☐ Both if multiple registers are there

Q60. Daily cash close requirements:
☐ Count cash + auto-calc expected from ledger + record discrepancy (recommended)

Q61. Require reason note for cash discrepancy?
☐ Yes

Q62. Rental billing excluded days workflow:
☐ Pick excluded dates on bill generation + store in bill + Can be a template per month where holidays, weekends are the same and stuff can add any dates on which a specific company was closed.

Q63. Billing inclusive dates confirmation:
☐ Confirm total days = end date – start date + 1 (You asked me this two times now. I don't want a bunch of unnecessary questions.)

Q64. Damage/missing fee treatment:
☐ Both (support both as you said) - Again repetitive questions. Please avoid.

Q65. Damage fee ledger category default:
☐ Other/penalty income (recommended)

Q66. Supplier bill rate:
☐ Both (recommended)

Q67. Supplier bill settlement:
☐ Support both

Q68. Bank reconciliation scope:
☐ Bank + Bkash + Nagad (recommended) - Repetitive questions

---

# PHASE 8G — VAT, Numbering, Print

Q69. VAT% default + override:
☐ Shop default, editable per invoice (as previously chosen) - STOP ASKING SAME QUESTIONS

Q70. VAT inclusive/exclusive on same date:
☐ Keep both options. For selling we might show the vat included and for bills it's mandatory to mention the VAT % separately

Q71. Rounding rule for totals:
☐ Both: cash = 1 BDT, digital = 2 decimals (recommended)

Q72. Print format sizes needed:
☐ A4 invoice for now

Q73. Bilingual printing:
☐ Per-toggle EN/BN/Bilingual - STOP ASKING SAME QUESTIONS

---

# PHASE 8H — Used Machines (trade-in/refurb/resale)

Q74. Used machine representation:
☐ Normal Product SKU + unit asset (recommended)

Q75. Trade-in “cash + exchange”:
☐ Not now

Q76. Refurb costs:
☐ Capture parts consumed (stock OUT) + labor note (recommended)

---

# PHASE 8I — Consignment (define for future)

Q77. Consignment stock separation:
☐ Extend LocationStock with ownershipBucket (OWNED/CONSIGNMENT; often cleaner)

Q78. Consignment units tracking:
☐ Track as units/assets with ownershipType = CONSIGNED (later)

Q79. Supplier payout for consignment sales:
☐ Payable settled later


PHASE 9A — Security & Multi-User
Authentication model

Q80. Staff accounts: do most employees have email addresses?

☐ B) No, email is unreliable → prefer username/phone login (common in BD shops)

Q81. Preferred login identifier (MVP):

☐ D) Username/phone + password (allow both)

Q82. Password reset (MVP):

☐ B) Admin resets staff passwords (shop reality)

Roles and permission model

Q83. Roles you want as first-class roles (not just flags):

☐ Admin

☐ CEO

☐ Manager

☐ Staff

☐ Accountant

☐ Engineer

☐ Helper

☐ Other roles created later

Q84. “Approved staff” implementation:

☐ A) A flag (isApprovedEditor) regardless of role (recommended)

Controlled edits policy (issued docs)

Q85. Which issued docs are allowed to be edited by approved editors (not admin), if we implement “reverse & repost” correctly?
Pick all you want editable:

☐ SalesInvoice

☐ POS bill

☐ PurchaseBill

☐ RentalBill

☐ ServiceInvoice

☐ Returns docs (SalesReturn / PurchaseReturn)

☐ Transfers

☐ Write-offs/Scrap

☐ Supplier (RENTED_IN) bills

(If we have a copy to revert the changes, it doesn't really matter for now. In our shop, mostly managers will do this anyway)


Q86. When an issued doc is edited, should the system require choosing an “Edit Reason Category”?

☐ A) Yes: pricing mistake / qty mistake / wrong party / wrong payment method / other (Added by the editor)


Audit log detail level

Q87. Audit log retention:

☐ A) Keep forever (recommended for traceability)

Q88. Audit should record “before & after” diffs for:

☐ C) Hybrid: snapshots for issued docs + payments; diffs for others (recommended) + Keep copy of every other documents for a month, so an admin can decide what to keep and what to discard later. This has to be recorded in log as well.

PHASE 9B — Employee Directory + Attribution

Q89. Should every Employee have a User login?

☐ B) No — some employees exist without login (recommended for real shops)

Q90. Attribution fields on documents should store:

☐ C) Both (recommended: Employee for HR reporting; User for auth)

Q91. Do you want “Shift/attendance” now or later?

☐ A) Later (recommended; keep Phase 9 focused)

PHASE 9C — Payroll (ledger-linked)

Q92. Salary cycle:

☐ A) Monthly only + An option to early pay if the employee needs it or he quits the job mid-month

Q93. Payroll components needed in MVP:
Pick all that apply:

☐ Base salary

☐ Deductions

☐ Advances

☐ Allowances (transport/food)

Q94. Payroll payment methods should support:

☐ D) All


PHASE 10A — Backup / Export

Q95. Primary database type you will run in production (target plan):

☐ A) PostgreSQL (recommended for multi-PC + hosted)

Q96. Backup frequency (automated):

☐ B) Every 6 hours (If changes occurs, otherwise daily is fine)

Q97. Backup storage locations (pick all):

☐ A) Same PC (local disk) - For now but open to other secure/affordable options later

Q98. Export formats (besides DB backup):

☐ A) CSV for master data + JSON for documents (recommended) - Should have portability and reusability

PHASE 10B — Restore / Import

Q99. Restore permission:

☐ A) Admin only

Q100. Restore safety: should restore require “maintenance mode” (block new issuing while restore runs)?

☐ Yes (recommended)

PHASE 10C — Offline drafts + Sync (your safety rule already locked)

We already locked: offline = drafts only, issue requires online + approval. Now we need sync details.

Q101. Draft sync scope: offline device can create drafts for:

☐ A) All docs (sales/purchase/transfer/service/etc)

Q102. Offline draft approval queue: after sync, drafts must be approved before issuing by:

☐ B) Admin + Manager (you said this earlier; confirm without re-asking later)

Q103. Draft ownership after sync:

☐ A) Shared (any approved staff can continue/edit)

Q104. Conflict policy: if two offline drafts compete for same stock, we will:

☐ A) Warn at draft time (“stock unknown offline”) + enforce at issue time (recommended, matches your rule)

Q105. Sync mechanism preference (implementation planning):

☐ A) Event-log (append-only actions, traceable) (recommended)

PHASE 10D — Deploy plan + environment hardening

Q106. Initial deployment style:

☐ A) One shop server PC + other devices access via LAN (your earlier “yes” option) + I will buy cloud hosting after the developement is finished for this website

Q107. Remote access (home/mobile) priority:

☐ A) Web access via cloud host

PHASE 10E — Monitoring/logging basics

Q108. Error visibility:

☐ A) Simple admin “System Logs” page (recommended)

Q109. Audit vs system logs: should system errors also create an AuditLog entry when they block issuing?

☐ Yes

--------------------------------------

PHASE 11A — AI Product Advisor (customer-facing, read-only)

Q110. Where will the AI run first (MVP)?

☐ A) Cloud-only (recommended)

Q111. Languages:

☐ C) Both (recommended)

Q112. What can it show to customers (read-only constraints):
Pick all allowed:

☐ Talk to cusomter about their needs and recommened buying + renting plan with exact machines from our shop - with direct clickable links (streamlined)

☐ Product name + description

☐ Price

☐ Stock availability (in stock/out of stock)

☐ Exact quantity (risky)

☐ Rental availability (yes/no)

☐ Store address/contact

Q113. “Fallback behavior” when uncertain:

☐ C) Show recommendation and suggest human contact if unsure

PHASE 11B — AI Admin Assistant (internal)

Q114. Admin assistant access:

☐ A) Admin only

Q115. Allowed capabilities (still read-only):
Pick all:

☐ Build links to reports/filters (“unpaid invoices this month”)

☐ Summarize today’s sales + payments

☐ Search entities (party, invoice, asset/unit, movement)

☐ Draft messages/notes (no save)

☐ Explain why stock changed (trace movements)

☐ Find trends in orders, companies, time of the year and so on

☐ Anything related as well

Q116. Sensitive info restrictions:
Should AI be blocked from showing:

☐ No. Only restrict sensitive informations of people.

PHASE 11C — AI Content Assistant (EN/BN descriptions)

Q117. Output storage:

☐ A) Draft only, manual approval required (recommended)

Q118. Versioning:

☐ B) Keep last N versions (choose N)

Q119. Bulk generation:

☐ B) Yes (batch select products)

-------------------------------

11C version history: what is N? (Keep last N versions per product)

Pick one: 10

AI Product Advisor stock display default:

☐ Default = tiers (“In stock / Limited / Out”) - Maybe omit the stock for now. Suggest we can arrange for whatever the customer is looking for when the order is delivered.

Role defaults (so setup isn’t painful): when we seed roles (Admin/CEO/Manager/Staff/Accountant/Engineer/Helper), do you want:

☐ A) Predefined permission templates per role (recommended) + Manual adjustments later


-------------------------

8D.2 — Unit identity rules (serial/tag) 

Q6. Machines must capture Brand + Model on Unit creation?
☐ Yes required

Q7. UniqueSerialKey rule (collision-safe): pick one
☐ A) BRAND|MODEL|MANUFACTURER_SERIAL (when manufacturer serial exists)

Q8. If a machine has NO manufacturer serial, do we require shop tag always?
☐ Yes

Q9. Shop tag generation: server-generated and unique?
☐ Yes

If yes, confirm format:
☐ A) SS-M-0000001, SS-P-0000001 etc (separate counters per prefix)

8D.2.1 — Lock down OWNED unit creation

Q10. After a unit is created by a Purchase, who can edit identity fields (brand/model/serial/tag)?
☐ B) Admin + Approved editor

8D.3 — Unit selection required for documents (sales/transfer/returns/writeoffs)

Q11. Sales/POS: unit selection happens at ISSUE time only (not on draft)?
☐ Yes

Q12. Sales return of a tracked item must select units from the original sale (i.e., we store soldUnits on the sale doc)?
☐ Yes

Q13. Transfers: unit selection must only allow units currently at FROM location?
☐ Yes

Q14. Write-off/scrap: must select specific units; unit becomes terminal (SCRAPPED) and cannot be reused?
☐ Yes

Q15. Purchase return: must select the units being returned; unit becomes terminal (RETURNED_TO_SUPPLIER)?
☐ Yes

Q16. Do we allow any “override” where staff can sell/transfer tracked qty without selecting units?
☐ No override

8D.9 — Disassembly/Unbundle

Q17. If you remove a component and keep it as spare/sell it, should the system require a Disassembly doc that increases part stock (LocationStock +1) and optionally creates a part-unit asset if serial-tracked?
☐ Yes

Q18. When disassembly removes critical parts, should the machine unit be flagged “INCOMPLETE_KIT”?
☐ Yes

8D.5 — RENTED_IN units

Q19. Confirm: RENTED_IN units never touch Product.stock/LocationStock (no stock pollution), but they still have location + status history?
☐ Yes

Q20. Can a RENTED_IN unit ever be sold to a customer?
☐ No (must block; if you buy it, you convert via a Purchase flow to OWNED)

8E — Service

Q21. When a service replaces an old part and you KEEP it as spare, should that go through:
☐ A) Disassembly/Salvage doc (stock IN + optional unit asset)

-------------------------------

 8E: Lock answers (Q22–Q30)

 Q22. ServiceTicket required for every ServiceInvoice?
 ☐ A) Yes — must create ticket first; invoice is only issued from ticket (recommended for traceability)

 Q23. Parts inventory posting in ServiceInvoice:
 ☐ B) Per-line part location (can mix sources per job) (flexible)

 Q24. Serial-tracked part not found in system:
 You already picked: "select if available, else free-text + reason."
 Lock policy when free-text serial used:
 ☐ B) Store free-text serial + reason AND create placeholder unit (CUSTOMER_OWNED style) for later reference

 Q25. Handling old part as spare/scrap (outcome A/B/C):
 ☐ A) System auto-generates Salvage/Disassembly doc from ServiceInvoice (avoids “missing stock”) (recommended)

 Q26. When is unit state reverted from IN_SERVICE → AVAILABLE?
 ☐ A) When ServiceTicket is set to “Resolved/Closed” (recommended)

 Q27. Warranty repeat tickets — UI enforcement:
 ☐ A) Warn only; staff can still bill (must give reason)

 Q28. ServiceInvoice numbering scheme:
 ☐ A) Own annual sequence: SRV-YYYY-0001 (recommended)

 Q29. Should warranty terms (type/days/end-date) show on printed ServiceInvoice?
 ☐ Yes

 Q30. Who can “close” a service ticket?
 ☐ B) Admin + Manager (recommended)

 ----------------------------------

8F Questions (Q31–Q45) — Answer Sheet

Opening balances (wizard)

Q31. Opening balance posting account
☐ A) A dedicated ledger account: “Opening Balance Equity” (recommended)

Q32. Opening balances timing
☐ A) One-time “go-live date” opening balances only (recommended)

Cash drawer (daily cash control)

Q33. Cash drawers: structure
☐ B) Multiple drawers/registers with IDs (you said “both if multiple registers”; this locks whether we implement multi now or later)

Q34. Non-document cash movements
☐ A) Yes — add CashAdjustment doc (recommended; prevents mystery cash)

Q35. Cash close enforcement
☐ A) No — closing is recommended but not blocking (recommended for shop reality)

Bank / Bkash / Nagad reconciliation (8F + 8F.R)

Q36. Statement input method (MVP)
☐ C) Both (best)

Q37. Fees / charges handling
☐ A) Ledger entries for fees (separate expense category) when reconciling (recommended)

Q38. Reconciliation locking
☐ A) It becomes protected (admin override only) (recommended)

Rental billing rules (customer + rented-in suppliers)

Q39. Billing calendar template scope
☐ A) Global per month (Fri + holidays) + per-contract additions at bill generation (recommended)

Q40. IDLE_AT_CUSTOMER timeline
☐ A) Yes (recommended)

Q41. “IDLE stops billing” effective timing
☐ A) Billing stops starting that date (inclusive)

Damage / missing fees closeout

Q42. When damage/missing is assessed
☐ A) At rental closeout only (recommended)

Q43. Penalty invoice numbering
☐ A) Use SalesInvoice with a “Penalty” category (recommended)

Supplier rented-in bills + settlement

Q44. Supplier bill generation timing
☐ A) Generate supplier bills from allocations/usage at month-end (recommended)

Q45. Settlement posting
☐ A) Create a journal entry referencing both bills (recommended; you already agreed)
Confirm: Yes

-------------------------------

8G Answers (Q46–Q52)

Q46. VAT% policy (final confirmation)
☐ A) Shop default VAT%, editable per invoice

Q47. VAT breakdown printing
☐ B) Only show when VAT mode is “added on top”

Q48. Rounding storage rule
☐ A) Applied only at payment/print time, store exact totals in DB

Q49. Number sequences per doc type
PurchaseBill: PUR-YYYY-0001
RentalBill: RNT-YYYY-0001
Transfer: TRN-YYYY-0001
☐ Yes — yearly reset per doc type

Q50. VAT fields needed on print (Bangladesh basics)
SalesInvoice (A4) must print:
- business name + address
- VAT/BIN number
- customer name/address (if provided)
- invoice date + invoice number
- VAT% + VAT amount
☐ A) All

Q51. Bilingual print
☐ A) Labels/headings only

Q52. POS vs Invoice VAT behavior
☐ A) Use shop default VAT mode (included/added) but editable

------------------------------------

8H Answers (Q53–Q62)

Q53. How should “used machine intake” be represented as a document?
☐ B) Create a dedicated document type: UsedIntake (recommended; avoids confusing supplier vs customer)

Q54. When a customer trades in a unit as part of buying another machine, do you want:
☐ A) Two separate docs: UsedIntake + SalesInvoice, linked by references (recommended)

Q55. Used units must always be Unit-tracked and OWNED once accepted?
☐ Yes (Recommended)

Q56. Where should the “grade” live?
☐ A) On the Unit (recommended; each unit can differ)

Q57. Refurb should be:
☐ B) A simple “RefurbRecord” attached to Unit with ledger + parts consumption (recommended MVP)

Q58. When refurb consumes parts, do you want it recorded through:
☐ B) A new doc: RefurbPartsUse (simpler, dedicated)

Q59. Used machine resale is treated like normal sales: VAT rules apply?
☐ Yes (Recommended)

Q60. If trade-in payment is “later”, do you want:
☐ A) A payable balance to the customer (Party balance) until paid (recommended)

Q61. Do you want an optional “used sale warranty days” field on SalesInvoice line/unit?
☐ Yes (Recommended: Yes optional; many shops offer 3–7 days.)

Q62. Do you want used machines to share the same Product SKU as new ones, or separate SKU?
☐ A) Separate “Used SKU” per model (recommended for pricing clarity)

8I Answers (Q63–Q72)

Q63. Consignment intake should be represented as:
☐ A) Dedicated doc: ConsignmentIntake (recommended)

Q64. Selling consignment items uses:
☐ A) Normal SalesInvoice/POS but marks items as CONSIGNMENT and posts payable to supplier (recommended)

Q65. If the consigned item is a machine, do you want it to be Unit-tracked immediately (even before “later”)?
☐ A) Yes, for machines only (recommended to avoid “mystery machine”)

Q66. Supplier payout calculation basis:
☐ A) Sale price minus agreed commission % (recommended)

Q67. Who sets the selling price for consignment unit?
☐ C) Both (supplier suggested, shop final) (recommended)

Q68. Returning to supplier must:
☐ A) Move stock out of CONSIGNMENT bucket + unit status to RETURNED

Q69. Do you want POS/Sales UI to clearly show ownership bucket and block mixing incorrectly?
☐ Yes (Recommended)

Q70. Reports should show consignment separately (profit vs payable)?
☐ Yes

Q71. Consignment stock is still stored by location (SHOP/WAREHOUSE), just bucketed?
☐ Yes (Recommended)

Q72. Should consigned units be blocked from Rentals by default?
☐ Yes (Recommended)

---------------------------------

Phase 9 Answer Sheet (Q73–Q90)

9A — Auth + roles + permissions + audit

Q73. Login identifiers storage
☐ C) both optional but at least one required (recommended)

Q74. Phone format enforcement
☐ B) Normalize to E.164 (recommended)

Q75. Sessions
☐ A) Cookie session (server-side session table) (recommended)

Q76. Device/session control
☐ B) Limit to N active sessions per user (recommended N=2)

Q77. Permission templates
☐ B) RolePermission table (configurable, recommended)

Q78. “Approved editor” scope
☐ B) Approved editor per-module (Sales editor vs Accounts editor)

Q79. Editable issued docs list
☐ A) All document types are editable via reverse&repost (recommended with strong audit)

Q80. Reverse & repost mechanics
☐ A) Automatically create reversal movements/ledger entries + repost new

Q81. Revision storage policy (the “restore original” requirement)
☐ A) Store full JSON snapshot for every issued doc revision forever (recommended)

Q82. Non-issued docs snapshot retention
☐ B) Keep forever

Q83. Two-person approval planning
☐ A) Plan only (no implementation in 9A MVP)

Q84. Audit coverage
☐ A) Issue/cancel/pay/edit/return/transfer/writeoff + reconciliation + cash close + unit status changes (recommended)

9B — Employees + attribution

Q85. Employee ↔ User mapping
☐ A) Employee can optionally link to User (recommended)

Q86. “Performed by” fields
☐ C) both (recommended; you already wanted both—locking now)

Q87. Attribution default
☐ B) performedBy = user + mapped employee automatically if exists (recommended)

9C — Payroll

Q88. Payroll components MVP
You selected Base + Deductions + Advances + Allowances. Confirm: All four are in MVP.
☐ Yes

Q89. Early pay / mid-month quit
☐ A) PayrollRun supports partial period + final settlement doc (recommended)

Q90. Payroll locking
Once a PayrollRun is marked Paid:
☐ A) Protected (admin override only) (recommended)

-------------------------

Identity + signup

Q91. Customer signup method (MVP)
☐ C) Both (recommended)

Q92. Customer login identifier
☐ A) Phone + password (recommended for BD)

Q93. Guest checkout
☐ A) Allow guest checkout forever (recommended)

Linking to Parties (Phase 7C)

Q94. Should a CustomerUser be linked 1:1 to a Party record?
☐ A) Yes (recommended)

Q95. If yes: should multiple customer users map to one Party?
Example: a company has multiple employees ordering.
☐ A) Yes (Party = company, multiple users)

What the customer can see (portal scope)

Q96. Customer portal includes (Pick all for MVP)
Add all please:
☐ Order history (public shop orders)
☐ Payment history (what they paid + receipts)
☐ Sales invoices history (if they have invoices)
☐ Rental history (if they are rental customers)
☐ Download/print invoice PDFs

Q97. Customer portal can perform (Pick MVP)
All of this: (We already have placeholder for COD, Bkash, Nagad, and Bank payment)
☐ Update profile + addresses
☐ Request support / service ticket creation
☐ Online payments (likely later; heavy)

Security + privacy

Q98. Staff-created invoices visibility
If you issue a SalesInvoice to a Party, should that appear in the customer portal automatically if the Party is linked?
☐ No

Q99. Return/refund visibility
Show refund/return history to customer?
☐ Yes

Notifications (optional MVP)

Q100. Do you want basic SMS/WhatsApp notifications later (not now) for:
order updates / invoice issued / payment received
☐ Yes (planning only)

Permissions boundary

Q101. Customer portal is read-only by default, except profile updates
Confirm:
☐ Yes

--------------------------------

10A — Backups

Q102. Backup retention policy
☐ A) Keep last 30 days + monthly snapshots for 12 months (recommended)

Q103. Backup encryption
☐ A) Encrypt backup files at rest (recommended)

Q104. Backup verification
Do you want automated verification:
☐ A) Daily “restore-into-temp-db” test (recommended if feasible)

10B — Restore / Import

Q105. Restore destination rule
☐ A) Restore replaces the whole DB (standard)

Q106. Restore rollback safety
If restore fails mid-way:
☐ A) Must rollback to pre-restore DB snapshot automatically (recommended)

10C — Offline drafts + sync

Q107. Device identity
Each offline device needs an ID. Pick:
☐ A) Server-issued Device record (recommended)

Q108. Offline draft signatures
Should offline-created drafts store:
☐ A) author user + device id + local timestamp (recommended)

Q109. Draft edit after sync
After syncing, before approval, can non-creator approved staff edit the draft?
☐ A) Yes (shared ownership)

Q110. Approval workflow
When approving an offline draft, should the approver:
☐ B) Approve and choose final “issue location/payment/etc” if missing (recommended)

Q111. Attachments offline
For things like payment proof images (customer portal) or service photos:
☐ A) Allow attachments offline and sync later (recommended)

10D — Deploy plan

Q112. Shop server OS
☐ C) Doesn’t matter yet (Windows preferred)

Q113. LAN access mode
☐ A) Browser access to a single server instance (recommended)

Q114. Cloud hosting future
When moving to cloud, do you want:
☐ A) Cloud becomes primary DB, shop PCs access it

10E — Monitoring / system logs

Q115. System logs retention
☐ B) Keep forever (Texts right? Should be low in size)

Q116. What triggers “System log + AuditLog”
You already want blocking errors to create AuditLog too. Confirm:
☐ A) Only errors that block issuing/posting

Q117. Time & timezone standard
☐ A) Store timestamps in UTC; display in Asia/Dhaka (recommended)

Q118. Printer behavior
☐ B) Printing can mark a doc as “printed” (allowed, but must not affect ledger/stock)

Q119. Database migration policy in production
☐ A) Migrations only run from server admin account + maintenance window (recommended)

Q120. Data export scope
You already chose CSV master + JSON documents. Confirm if exports include:
☐ A) Units/assets + unit history + attachments metadata (recommended)

------------------------------

// Answer Sheet — 11A–C AI Options

11A — Customer Product Advisor (read-only)

Q121. “Read-only” boundary
Do we allow the AI to create a lead/contact request (name/phone/message) in your DB?
☐ B) Allow a single write type: LeadRequest (recommended if you want “convert customers”)

Q122. Stock messaging mode (since you want to omit stock)
Pick the default:
☐ A) “Availability: Available / Limited / On request” (tiered)

Q123. Rental recommendations
When recommending rentals, should the AI show:
☐ A) Only “rental available yes/no” and say "Contact for price"

Q124. Safety + policy guardrails
If user asks for something you don’t have (e.g., delivery promise, exact stock), should AI:
☐ A) Always route to human contact

—

11B — Admin Assistant (read-only)

Q125. Sensitive business info
You said “only restrict sensitive info of people.” Confirm AI can show to Admin:
- cost price / profit / margin
- supplier pricing
- payroll totals
☐ Yes (Sorry, please redo this. AI can access all information of the customer and show it to the Admin but not pass it to any 3rd parties. That's what I meant when I said I don't want it to access sensitive information)

Q126. Actions output format
When the AI answers admin queries, should it:
☐ A) Only return clickable links + summary (recommended)

Q127. Audit-aware explanations
When AI explains “why stock changed,” should it be required to:
☐ A) Cite exact doc IDs/movements it used (recommended)

—

11C — Content Assistant

Q128. Content fields generated
Pick what 11C generates:
- product description EN
- product description BN
- SEO title/meta
- short bullet highlights
☐ A) all

Q129. Approval workflow
Who can approve/publish AI drafts?
☐ B) Admin + Manager (recommended)

Q130. Plagiarism / duplication
Do you want a rule:
☐ A) AI must avoid copying existing descriptions; always rephrase (recommended)

—

Cross-cutting (avoids later regret)

Q131. AI conversation logging
Do you want to store chat logs in your DB for:
- customer advisor sessions
- admin assistant sessions
Pick:
☐ C) Store both (with retention policy)

Q132. AI downtime behavior
If AI is down:
☐ B) Show “AI unavailable” + contact fallback (recommended)

Q133. Prompt injection defense
Should the system hard-block the model from:
- showing hidden instructions
- revealing private customer data
- executing actions
☐ Yes (recommended)

Q134. Model/provider choice
Do you want Phase 11 to stay provider-agnostic (recommended) or tie to one provider now?
☐ A) Provider-agnostic abstraction