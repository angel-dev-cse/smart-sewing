import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ log: ["error"] });

async function main() {
  console.log("🌱 Starting essential database seeding for testing...");
  console.log("Working directory:", process.cwd());

// === LOCATIONS ===
console.log("📍 Ensuring locations exist...");
await db.location.upsert({
  where: { code: "SHOP" },
  update: {},
  create: { code: "SHOP", name: "Shop", isActive: true }
});

await db.location.upsert({
  where: { code: "WAREHOUSE" },
  update: {},
  create: { code: "WAREHOUSE", name: "Warehouse", isActive: true }
});

await db.location.upsert({
  where: { code: "SERVICE" },
  update: {},
  create: { code: "SERVICE", name: "Service Center", isActive: true }
});

  const shop = await db.location.findUnique({ where: { code: "SHOP" } })!;
  const warehouse = await db.location.findUnique({ where: { code: "WAREHOUSE" } })!;

// === LEDGER ACCOUNTS ===
console.log("💰 Setting up ledger accounts...");
await db.ledgerAccount.upsert({
  where: { name: "Cash" },
  update: {},
  create: { name: "Cash", kind: "CASH", openingBalance: 5000000 }
});

await db.ledgerAccount.upsert({
  where: { name: "bKash" },
  update: {},
  create: { name: "bKash", kind: "BKASH", openingBalance: 2500000 }
});

await db.ledgerAccount.upsert({
  where: { name: "Bank" },
  update: {},
  create: { name: "Bank", kind: "BANK", openingBalance: 10000000 }
});

// === LEDGER CATEGORIES ===
const categories = [
  { name: "Salary", kind: "EXPENSE" },
  { name: "Parts Purchase", kind: "EXPENSE" },
  { name: "Customer Payment", kind: "INCOME" }
];

for (const cat of categories) {
  await db.ledgerCategory.upsert({
    where: { name: cat.name },
    update: {},
    create: cat
  });
}

// === PARTIES ===
console.log("👥 Creating parties...");
let supplier = await db.party.findFirst({ where: { name: "JUKI Bangladesh Ltd" } });
if (!supplier) {
  supplier = await db.party.create({
    data: {
      name: "JUKI Bangladesh Ltd",
      type: "SUPPLIER",
      phone: "+8801712345678",
      email: "sales@juki-bd.com",
      address: "123 Industrial Area, Dhaka"
    }
  });
}

let customer = await db.party.findFirst({ where: { name: "Rahman Garments Ltd" } });
if (!customer) {
  customer = await db.party.create({
    data: {
      name: "Rahman Garments Ltd",
      type: "CUSTOMER",
      phone: "+8801912345678",
      email: "procurement@rahman-garments.com",
      address: "789 Textile District, Gazipur"
    }
  });
}

// === PRODUCTS ===
console.log("📦 Creating products...");
const productData = [
  // Asset-tracked machines
  {
    title: "JUKI DDL-8700",
    slug: "juki-ddl-8700",
    type: "MACHINE_SALE",
    price: 4500000,
    stock: 5,
    description: "High-speed single needle lockstitch machine",
    brand: "JUKI",
    model: "DDL-8700",
    isAssetTracked: true,
    serialRequired: true,
    isActive: true
  },
  {
    title: "JACK JK-810D",
    slug: "jack-jk-810d",
    type: "MACHINE_SALE",
    price: 3500000,
    stock: 3,
    description: "Heavy-duty single needle machine",
    brand: "JACK",
    model: "JK-810D",
    isAssetTracked: true,
    serialRequired: true,
    isActive: true
  },
  // Parts
  {
    title: "Servo Motor 550W",
    slug: "servo-motor-550w",
    type: "PART",
    price: 550000,
    stock: 8,
    description: "High-torque servo motor",
    brand: "Generic",
    model: "550W Servo",
    isAssetTracked: true,
    serialRequired: false,
    isActive: true
  },
  {
    title: "Needle Plate Set",
    slug: "needle-plate-set",
    type: "PART",
    price: 80000,
    stock: 25,
    description: "Standard needle plate set",
    brand: "JUKI",
    model: "NP-DDL",
    isAssetTracked: false,
    serialRequired: false,
    isActive: true
  }
];

for (const product of productData) {
  await db.product.upsert({
    where: { slug: product.slug },
    update: {},
    create: product
  });
}

  // Get created products
  const createdProducts = await db.product.findMany();

// === LOCATION STOCK ===
console.log("📊 Creating location stock...");
for (const product of createdProducts) {
  if (product.stock > 0) {
    await db.locationStock.upsert({
      where: {
        locationId_productId: {
          locationId: shop.id,
          productId: product.id
        }
      },
      update: { quantity: product.stock },
      create: {
        locationId: shop.id,
        productId: product.id,
        quantity: product.stock
      }
    });
  }
}

  // === UNITS ===
  console.log("🏷️ Creating units...");
  const jukiProduct = createdProducts.find(p => p.slug === "juki-ddl-8700")!;
  const jackProduct = createdProducts.find(p => p.slug === "jack-jk-810d")!;
  const servoProduct = createdProducts.find(p => p.slug === "servo-motor-550w")!;

// JUKI machines (need unitization)
for (let i = 0; i < 5; i++) {
  const uniqueKey = `JUKI-DDL-8700-JKDDL8700${String(i + 1).padStart(4, '0')}`;
  const existing = await db.unit.findUnique({ where: { uniqueSerialKey: uniqueKey } });
  if (!existing) {
    await db.unit.create({
      data: {
        ownershipType: "OWNED",
        productId: jukiProduct.id,
        brand: "JUKI",
        model: "DDL-8700",
        manufacturerSerial: `JKDDL8700${String(i + 1).padStart(4, '0')}`,
        uniqueSerialKey: uniqueKey,
        tagCode: `SS-M-${String(i + 1).padStart(5, '0')}`,
        status: "AVAILABLE",
        currentLocationId: shop.id,
        notes: "Initial stock"
      }
    });
  }
}

// JACK machines
for (let i = 0; i < 3; i++) {
  const uniqueKey = `JACK-JK810D-JKJK810D${String(i + 1).padStart(4, '0')}`;
  const existing = await db.unit.findUnique({ where: { uniqueSerialKey: uniqueKey } });
  if (!existing) {
    await db.unit.create({
      data: {
        ownershipType: "OWNED",
        productId: jackProduct.id,
        brand: "JACK",
        model: "JK-810D",
        manufacturerSerial: `JKJK810D${String(i + 1).padStart(4, '0')}`,
        uniqueSerialKey: uniqueKey,
        tagCode: `SS-M-${String(i + 6).padStart(5, '0')}`,
        status: "AVAILABLE",
        currentLocationId: shop.id,
        notes: "Initial stock"
      }
    });
  }
}

// Servo motors (no serials, just tags)
for (let i = 0; i < 8; i++) {
  const uniqueKey = `SS-P-${String(i + 1).padStart(5, '0')}`;
  const existing = await db.unit.findUnique({ where: { uniqueSerialKey: uniqueKey } });
  if (!existing) {
    await db.unit.create({
      data: {
        ownershipType: "OWNED",
        productId: servoProduct.id,
        brand: "Generic",
        model: "550W Servo",
        tagCode: uniqueKey,
        uniqueSerialKey: uniqueKey,
        status: "AVAILABLE",
        currentLocationId: shop.id,
        notes: "Initial stock"
      }
    });
  }
}

  // === PURCHASE BILLS ===
  console.log("📄 Creating purchase bills...");
  await db.purchaseBill.upsert({
    where: { billNo: 1 },
    update: {},
    create: {
      billNo: 1,
      supplierName: supplier.name,
      partyId: supplier.id,
      issuedAt: new Date("2024-01-15"),
      status: "ISSUED",
      subtotal: 22500000,
      total: 22500000,
      notes: "Machine purchase",
      items: {
        create: [
          {
            productId: jukiProduct.id,
            titleSnapshot: "JUKI DDL-8700",
            unitCost: 4500000,
            quantity: 5
          }
        ]
      }
    }
  });

  // === SALES INVOICES ===
  console.log("🧾 Creating sales invoices...");
  await db.salesInvoice.upsert({
    where: { invoiceNo: 1 },
    update: {},
    create: {
      invoiceNo: 1,
      customerName: customer.name,
      partyId: customer.id,
      status: "ISSUED",
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PAID",
      notes: "Machine sale",
      items: {
        create: [
          {
            productId: jukiProduct.id,
            titleSnapshot: "JUKI DDL-8700",
            unitPrice: 4500000,
            quantity: 2
          }
        ]
      }
    }
  });

  // === TRANSFERS ===
  console.log("🚚 Creating transfers...");
  const needlePlate = createdProducts.find(p => p.slug === "needle-plate-set")!;
  await db.stockTransfer.upsert({
    where: { transferNo: 1 },
    update: {},
    create: {
      transferNo: 1,
      fromLocationId: shop.id,
      toLocationId: warehouse.id,
      issuedAt: new Date("2024-03-05"),
      status: "ISSUED",
      notes: "Moving stock to warehouse",
      items: {
        create: [
          {
            productId: needlePlate.id,
            titleSnapshot: "Needle Plate Set",
            quantity: 10
          }
        ]
      }
    }
  });

  // Update location stocks
  await db.locationStock.update({
    where: { locationId_productId: { locationId: shop.id, productId: needlePlate.id } },
    data: { quantity: 15 } // 25 - 10
  });

  await db.locationStock.upsert({
    where: {
      locationId_productId: {
        locationId: warehouse.id,
        productId: needlePlate.id
      }
    },
    update: { quantity: 10 },
    create: {
      locationId: warehouse.id,
      productId: needlePlate.id,
      quantity: 10
    }
  });

  // === RENTALS ===
  console.log("🏠 Rentals not implemented yet (Phase 8E)...");

  // === WRITE-OFFS ===
  console.log("🗑️ Creating write-offs...");
  await db.writeOff.upsert({
    where: { writeOffNo: 1 },
    update: {},
    create: {
      writeOffNo: 1,
      issuedAt: new Date("2024-03-15"),
      status: "ISSUED",
      reason: "Damaged during transport",
      notes: "Machine damaged beyond repair",
      items: {
        create: [
          {
            productId: jukiProduct.id,
            titleSnapshot: "JUKI DDL-8700",
            unitValue: 4500000,
            quantity: 1
          }
        ]
      }
    }
  });

  // === ADJUSTMENTS ===
  console.log("⚖️ Creating adjustments...");
  await db.stockAdjustment.create({
    data: {
      reason: "Monthly stock count - found extra items",
      items: {
        create: [
          {
            productId: needlePlate.id,
            delta: 2,
            beforeStock: 25,
            afterStock: 27
          }
        ]
      }
    }
  });

  // Update stock for adjustment
  await db.locationStock.update({
    where: { locationId_productId: { locationId: shop.id, productId: needlePlate.id } },
    data: { quantity: 17 } // 15 + 2
  });

  console.log("✅ Essential database seeding completed!");
  console.log("📊 Summary:");
  console.log(`   - ${createdProducts.length} products created`);
  console.log(`   - ${await db.party.count()} parties created`);
  console.log(`   - ${await db.unit.count()} units created`);
  console.log(`   - ${await db.purchaseBill.count()} purchase bills`);
  console.log(`   - ${await db.salesInvoice.count()} sales invoices`);
  console.log(`   - ${await db.stockTransfer.count()} transfers`);
  console.log(`   - ${await db.writeOff.count()} write-offs`);
  console.log(`   - ${await db.stockAdjustment.count()} adjustments`);
  console.log("\n🎯 Ready for testing all admin operations!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
