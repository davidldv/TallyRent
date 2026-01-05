import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const DEMO_SHOP_ID = "demo-shop";

function parseMonth(month: string | null) {
  if (!month) return null;
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month");
  const parsed = parseMonth(monthParam);

  const now = new Date();
  const year = parsed?.year ?? now.getUTCFullYear();
  const monthIndex = parsed?.monthIndex ?? now.getUTCMonth();

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

  const bookings = await prisma.booking.findMany({
    where: {
      shopId: DEMO_SHOP_ID,
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      customer: { select: { name: true } },
      items: {
        select: {
          quantity: true,
          item: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ shopId: DEMO_SHOP_ID, start, end, bookings });
}
