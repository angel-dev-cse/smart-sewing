import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ log: ["error"] });

async function main() {
  await db.product.upsert({
    where: { slug: "juki-jk-809d" },
    update: {},
    create: {
      title: "JUKI JK-809D",
      slug: "juki-jk-809d",
      type: "MACHINE_SALE",
      price: 25000,
      stock: 3,
      description: "Industrial sewing machine (sample product).",
      isActive: true,
    },
  });

  await db.product.upsert({
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
    },
  });

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
