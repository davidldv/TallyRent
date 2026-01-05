import { prisma } from "./db";

export type AvailabilityRequest = {
  shopId: string;
  itemId: string;
  startAt: Date;
  endAt: Date;
  quantity: number;
};

type TxClient = Parameters<typeof prisma.$transaction>[0] extends (tx: infer T) => unknown ? T : never;
type DbClient = TxClient | typeof prisma;

export function isValidRange(startAt: Date, endAt: Date) {
  return startAt instanceof Date && endAt instanceof Date && !Number.isNaN(startAt.valueOf()) && !Number.isNaN(endAt.valueOf()) && startAt < endAt;
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  // Half-open interval overlap: [start, end)
  return aStart < bEnd && bStart < aEnd;
}

export async function getRemainingQuantityForItem(input: AvailabilityRequest, db: DbClient = prisma) {
  const item = await db.item.findFirst({
    where: { id: input.itemId, shopId: input.shopId, active: true },
    select: { quantity: true },
  });

  if (!item) return { exists: false as const, remaining: 0, total: 0 };

  const overlapping = await db.bookingItem.aggregate({
    where: {
      itemId: input.itemId,
      booking: {
        shopId: input.shopId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: input.endAt },
        endAt: { gt: input.startAt },
      },
    },
    _sum: { quantity: true },
  });

  const reserved = overlapping._sum.quantity ?? 0;
  const remaining = Math.max(0, item.quantity - reserved);

  return { exists: true as const, remaining, total: item.quantity };
}

export async function assertAvailableOrThrow(input: AvailabilityRequest, db: DbClient = prisma) {
  if (!isValidRange(input.startAt, input.endAt)) {
    throw new Error("Invalid date range");
  }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Invalid quantity");
  }

  const { exists, remaining } = await getRemainingQuantityForItem(input, db);

  if (!exists) {
    throw new Error("Item not found");
  }

  if (remaining < input.quantity) {
    throw new Error("Not available");
  }
}
