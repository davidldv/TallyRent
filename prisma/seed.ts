import { prisma } from "../lib/db";

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: "demo-shop" },
    update: {},
    create: {
      id: "demo-shop",
      name: "Demo Rental Shop",
      timezone: "UTC",
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: "demo-customer" },
    update: {},
    create: {
      id: "demo-customer",
      shopId: shop.id,
      name: "Walk-in Customer",
    },
  });

  await prisma.item.upsert({
    where: { id: "demo-item-camera" },
    update: {},
    create: {
      id: "demo-item-camera",
      shopId: shop.id,
      name: "Sony A7SIII",
      sku: "SONY-A7SIII",
      quantity: 2,
      dailyRateCents: 15000,
      depositCents: 50000,
    },
  });

  await prisma.item.upsert({
    where: { id: "demo-item-tripod" },
    update: {},
    create: {
      id: "demo-item-tripod",
      shopId: shop.id,
      name: "Heavy-Duty Tripod",
      sku: "TRIPOD-HD",
      quantity: 5,
      dailyRateCents: 2500,
      depositCents: 5000,
    },
  });

  // Keep lint happy about unused variable in case you change seed behavior later.
  void customer;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
