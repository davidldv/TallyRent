import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const DEMO_SHOP_ID = "demo-shop";

export async function GET() {
  const items = await prisma.item.findMany({
    where: { shopId: DEMO_SHOP_ID, active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      dailyRateCents: true,
      depositCents: true,
    },
  });

  return NextResponse.json({ shopId: DEMO_SHOP_ID, items });
}
