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
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
