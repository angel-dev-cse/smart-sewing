# Phase 8D2.1:
  1. ✅ FIXED: Getting `Invalid `prisma.purchaseBill.create()` invocation: Unique constraint failed on the fields: (`billNo`)` when creating a new purchase bill.
     - **Root cause**: Counter initialization started at `nextNo: 1` even when existing purchase bills existed, causing conflicts.
     - **Fix**: When counter doesn't exist, query max `billNo` from existing purchase bills and initialize counter to `max+1` (or `1` if no bills exist). This ensures no conflicts with existing bills.