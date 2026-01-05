import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAvailableOrThrow, isValidRange } from "@/lib/availability";
import { prisma } from "@/lib/db";

const DEMO_SHOP_ID = "demo-shop";

type TxClient = Parameters<typeof prisma.$transaction>[0] extends (tx: infer T) => unknown ? T : never;

const CreateBookingSchema = z.object({
  itemId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  quantity: z.number().int().positive().default(1),
  customerName: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    const body = await req.json();
    parsed = CreateBookingSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const startAt = new Date(parsed.startAt);
  const endAt = new Date(parsed.endAt);

  if (!isValidRange(startAt, endAt)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {
    const booking = await prisma.$transaction(async (tx: TxClient) => {
      const item = await tx.item.findFirst({
        where: { id: parsed.itemId, shopId: DEMO_SHOP_ID, active: true },
        select: { id: true, dailyRateCents: true, depositCents: true },
      });

      if (!item) {
        throw new Error("Item not found");
      }

      await assertAvailableOrThrow(
        {
          shopId: DEMO_SHOP_ID,
          itemId: parsed.itemId,
          startAt,
          endAt,
          quantity: parsed.quantity,
        },
        tx,
      );

      const customer = parsed.customerName
        ? await tx.customer.create({
            data: {
              shopId: DEMO_SHOP_ID,
              name: parsed.customerName,
            },
            select: { id: true, name: true },
          })
        : await tx.customer.findFirst({
            where: { id: "demo-customer", shopId: DEMO_SHOP_ID },
            select: { id: true, name: true },
          });

      if (!customer) {
        throw new Error("Customer missing");
      }

      return tx.booking.create({
        data: {
          shopId: DEMO_SHOP_ID,
          customerId: customer.id,
          startAt,
          endAt,
          status: "PENDING",
          items: {
            create: {
              itemId: item.id,
              quantity: parsed.quantity,
              dailyRateCentsSnapshot: item.dailyRateCents,
              depositCentsSnapshot: item.depositCents,
            },
          },
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          customer: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              item: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    return NextResponse.json({ booking });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message === "Not available" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
