import { prisma } from "@/lib/db";

const DEMO_SHOP_ID = "demo-shop";

function formatDateTimeUtc(d: Date) {
  return new Date(d).toISOString().replace("T", " ").replace(".000Z", "Z");
}

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Bookings for {start.toISOString().slice(0, 7)} (UTC)
            </p>
          </div>
          <a
            href="/widget"
            className="text-sm font-medium text-foreground underline underline-offset-4"
          >
            Customer widget
          </a>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-black/8 dark:border-white/[.145]">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/2 dark:bg-white/6">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-600 dark:text-zinc-400" colSpan={4}>
                    No bookings yet.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-black/8 dark:border-white/[.145]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatDateTimeUtc(b.startAt)}</div>
                      <div className="text-zinc-600 dark:text-zinc-400">→ {formatDateTimeUtc(b.endAt)}</div>
                    </td>
                    <td className="px-4 py-3">{b.customer.name}</td>
                    <td className="px-4 py-3">
                      {b.items.map((it, idx) => (
                        <div key={idx} className="text-zinc-600 dark:text-zinc-400">
                          {it.quantity}× {it.item.name}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-black/8 px-2 py-1 text-xs dark:border-white/[.145]">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
