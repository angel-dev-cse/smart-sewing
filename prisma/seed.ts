import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ log: ["error"] });

async function main() {
  const jukiProduct = await db.product.upsert({
    where: { slug: "juki-jk-809d" },
    update: {},
    create: {
      title: "JUKI JK-809D",
      slug: "juki-jk-809d",
      type: "MACHINE_SALE",
      price: 25000,
      stock: 3, // Legacy total stock (for backward compatibility)
      description: "Industrial sewing machine (sample product).",
      isActive: true,
      // Phase 8D.1.5: Asset tracking fields
      isAssetTracked: true,
      serialRequired: true,
      brand: "JUKI",
      model: "JK-809D",
    },
  });

  // Phase 8C.2: Create location stock for SHOP
  const shopLocation = await db.location.findUnique({ where: { code: "SHOP" } });
  if (shopLocation) {
    await db.locationStock.upsert({
      where: {
        locationId_productId: {
          locationId: shopLocation.id,
          productId: jukiProduct.id,
        }
      },
      update: { quantity: 3 },
      create: {
        locationId: shopLocation.id,
        productId: jukiProduct.id,
        quantity: 3,
      }
    });
  }

  const servoProduct = await db.product.upsert({
    where: { slug: "servo-motor-550w" },
    update: {},
    create: {
      title: "Servo Motor 550W",
      slug: "servo-motor-550w",
      type: "PART",
      price: 5500,
      stock: 10,
      description: "Servo motor for industrial machines (sample product).",
      isActive: true,
      // Phase 8D.1.5: Asset tracking fields (parts can be tracked too)
      isAssetTracked: true,
      serialRequired: false, // Parts might not always require serials
      brand: "Generic",
      model: "550W Servo",
    },
  });

  // Phase 8C.2: Create location stock for servo motor in SHOP
  if (shopLocation) {
    await db.locationStock.upsert({
      where: {
        locationId_productId: {
          locationId: shopLocation.id,
          productId: servoProduct.id,
        }
      },
      update: { quantity: 10 },
      create: {
        locationId: shopLocation.id,
        productId: servoProduct.id,
        quantity: 10,
      }
    });
  }

  // --- Ledger accounts ---
  await db.ledgerAccount.upsert({
    where: { name: "Cash" },
    update: {},
    create: { name: "Cash", kind: "CASH", openingBalance: 0 },
  });

  await db.ledgerAccount.upsert({
    where: { name: "bKash" },
    update: {},
    create: { name: "bKash", kind: "BKASH", openingBalance: 0 },
  });

  await db.ledgerAccount.upsert({
    where: { name: "Nagad" },
    update: {},
    create: { name: "Nagad", kind: "NAGAD", openingBalance: 0 },
  });

  await db.ledgerAccount.upsert({
    where: { name: "Bank" },
    update: {},
    create: { name: "Bank", kind: "BANK", openingBalance: 0 },
  });

  // --- Expense categories ---
  const expenseCats = [
    "Salary",
    "Parts Purchase",
    "Machine Service/Repair",
    "Travel/Transport",
    "Shop Rent",
    "Utilities (Electric/Internet)",
    "Misc",
  ];

  for (const name of expenseCats) {
    await db.ledgerCategory.upsert({
      where: { name },
      update: {},
      create: { name, kind: "EXPENSE" },
    });
  }

  // --- Income categories ---
  const incomeCats = ["Customer Payment", "Owner Deposit"];
  for (const name of incomeCats) {
    await db.ledgerCategory.upsert({
      where: { name },
      update: {},
      create: { name, kind: "INCOME" },
    });
  }

  // Phase 8C.2: Ensure all products with stock have location stock in SHOP
  // This handles any products added above that might have stock
  if (shopLocation) {
    const productsWithStock = await db.product.findMany({
      where: { stock: { gt: 0 } },
      select: { id: true, title: true, stock: true }
    });

    for (const product of productsWithStock) {
      const existingLocationStock = await db.locationStock.findUnique({
        where: {
          locationId_productId: {
            locationId: shopLocation.id,
            productId: product.id,
          }
        }
      });

      if (!existingLocationStock) {
        await db.locationStock.create({
          data: {
            locationId: shopLocation.id,
            productId: product.id,
            quantity: product.stock,
          }
        });
        console.log(`Created location stock for ${product.title}: ${product.stock} units in SHOP`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
