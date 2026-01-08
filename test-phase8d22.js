// test-phase8d22.js - PurchaseBill issue intake validation

const { prepareTrackedUnits } = require("./src/lib/purchase-issue.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testRowCounts() {
  const trackedLines = [
    {
      product: {
        id: "p1",
        title: "Tracked Machine",
        type: "MACHINE_SALE",
        isAssetTracked: true,
        serialRequired: false,
        brand: "Juki",
        model: "DNU-1541",
      },
      quantity: 2,
    },
  ];

  const mockDb = { shopTagCounter: { upsert: async () => ({ nextValue: 2 }) } };

  const result = await prepareTrackedUnits({ trackedLines, rawUnits: [{ productId: "p1" }], db: mockDb });
  assert("error" in result, "Should reject when unit rows do not match quantity");
}

async function testAutoTagAndDupes() {
  let counter = 1;
  const mockDb = {
    shopTagCounter: {
      upsert: async () => ({ nextValue: ++counter }),
    },
  };

  const trackedLines = [
    {
      product: {
        id: "p1",
        title: "Tracked Part",
        type: "PART",
        isAssetTracked: true,
        serialRequired: false,
        brand: "Brand",
        model: "Model",
      },
      quantity: 2,
    },
  ];

  const result = await prepareTrackedUnits({
    trackedLines,
    rawUnits: [
      { productId: "p1", manufacturerSerial: "SER-1" },
      { productId: "p1", brand: "B", model: "M" }, // should auto tag
    ],
    db: mockDb,
  });

  assert(!("error" in result), "Valid rows should pass");
  const keys = result.units.map((u) => u.uniqueSerialKey);
  assert(keys.includes("BRAND-MODEL-SER-1"), "Serial-based key missing");
  assert(keys.some((k) => k.startsWith("SS-P-")), "Auto tag should be generated for missing serial");

  const duplicate = await prepareTrackedUnits({
    trackedLines,
    rawUnits: [
      { productId: "p1", manufacturerSerial: "DUP" },
      { productId: "p1", manufacturerSerial: "DUP" },
    ],
    db: mockDb,
  });
  assert("error" in duplicate, "Duplicate serials should be blocked");
}

async function testSerialRequired() {
  const trackedLines = [
    {
      product: {
        id: "p1",
        title: "Serial Required",
        type: "MACHINE_SALE",
        isAssetTracked: true,
        serialRequired: true,
        brand: "Brand",
        model: "Model",
      },
      quantity: 1,
    },
  ];

  const mockDb = { shopTagCounter: { upsert: async () => ({ nextValue: 2 }) } };
  const result = await prepareTrackedUnits({ trackedLines, rawUnits: [{ productId: "p1" }], db: mockDb });
  assert("error" in result, "Serial-required product should not accept missing serial");
}

async function run() {
  try {
    console.log("Running Phase 8D.2.2 tests...\n");
    await testRowCounts();
    console.log("✔️ Row count validation ok");
    await testAutoTagAndDupes();
    console.log("✔️ Auto tag + duplicate detection ok");
    await testSerialRequired();
    console.log("✔️ Serial-required validation ok");
    console.log("\n✅ Phase 8D.2.2 validation tests passed");
  } catch (e) {
    console.error("\n❌ Test failed:", e.message);
    process.exit(1);
  }
}

run();
