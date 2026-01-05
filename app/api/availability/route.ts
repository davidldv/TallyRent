import { NextResponse } from "next/server";
import { z } from "zod";

import { getRemainingQuantityForItem, isValidRange } from "@/lib/availability";

const DEMO_SHOP_ID = "demo-shop";

const QuerySchema = z.object({
  itemId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  quantity: z.coerce.number().int().positive().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);

  let parsed: z.infer<typeof QuerySchema>;
  try {
    parsed = QuerySchema.parse({
      itemId: url.searchParams.get("itemId"),
      startAt: url.searchParams.get("startAt"),
      endAt: url.searchParams.get("endAt"),
      quantity: url.searchParams.get("quantity") ?? undefined,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const startAt = new Date(parsed.startAt);
  const endAt = new Date(parsed.endAt);
  const quantity = parsed.quantity ?? 1;

  if (!isValidRange(startAt, endAt)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const remaining = await getRemainingQuantityForItem({
    shopId: DEMO_SHOP_ID,
    itemId: parsed.itemId,
    startAt,
    endAt,
    quantity,
  });

  return NextResponse.json({
    shopId: DEMO_SHOP_ID,
    itemId: parsed.itemId,
    startAt,
    endAt,
    requestedQuantity: quantity,
    ...remaining,
    available: remaining.exists ? remaining.remaining >= quantity : false,
  });
}
