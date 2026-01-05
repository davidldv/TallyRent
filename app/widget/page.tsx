"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  dailyRateCents: number;
  depositCents: number;
};

type ItemsResponse = { shopId: string; items: Item[] };

type AvailabilityResponse =
  | {
      shopId: string;
      itemId: string;
      startAt: string;
      endAt: string;
      requestedQuantity: number;
      exists: true;
      remaining: number;
      total: number;
      available: boolean;
    }
  | {
      shopId: string;
      itemId: string;
      startAt: string;
      endAt: string;
      requestedQuantity: number;
      exists: false;
      remaining: number;
      total: number;
      available: boolean;
    };

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function toIsoUtc(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) return null;
  return d.toISOString();
}

export default function WidgetPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [itemId, setItemId] = useState<string>("");
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState<string | null>(null);

  const selectedItem = useMemo(() => items.find((i) => i.id === itemId) ?? null, [items, itemId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingItems(true);

    fetch("/api/items")
      .then((r) => r.json())
      .then((data: ItemsResponse) => {
        if (cancelled) return;
        setItems(data.items);
        setItemId((prev) => prev || data.items[0]?.id || "");
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingItems(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function checkAvailability() {
    setBookingStatus("idle");
    setBookingError(null);

    const startIso = toIsoUtc(startAt);
    const endIso = toIsoUtc(endAt);

    if (!itemId || !startIso || !endIso) {
      setAvailability(null);
      return;
    }

    setChecking(true);
    try {
      const qs = new URLSearchParams({
        itemId,
        startAt: startIso,
        endAt: endIso,
        quantity: String(quantity),
      });

      const res = await fetch(`/api/availability?${qs.toString()}`);
      const data = (await res.json()) as AvailabilityResponse | { error: string };
      if (!res.ok) {
        setAvailability(null);
        setBookingError("Availability check failed");
        return;
      }

      setAvailability(data as AvailabilityResponse);
    } finally {
      setChecking(false);
    }
  }

  async function submitBooking() {
    setBookingStatus("submitting");
    setBookingError(null);

    const startIso = toIsoUtc(startAt);
    const endIso = toIsoUtc(endAt);

    if (!itemId || !startIso || !endIso) {
      setBookingStatus("error");
      setBookingError("Please fill item + start/end");
      return;
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId,
        startAt: startIso,
        endAt: endIso,
        quantity,
        customerName: customerName.trim() || undefined,
      }),
    });

    const data = (await res.json()) as { booking?: unknown; error?: string };

    if (!res.ok) {
      setBookingStatus("error");
      setBookingError(data.error ?? "Booking failed");
      return;
    }

    setBookingStatus("success");
    await checkAvailability();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Booking widget</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Demo customer flow (creates a booking)
            </p>
          </div>
          <a
            href="/dashboard"
            className="text-sm font-medium text-foreground underline underline-offset-4"
          >
            Dashboard
          </a>
        </div>

        <div className="mt-8 rounded-lg border border-black/8 p-5 dark:border-white/[.145]">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Item</span>
              <select
                className="h-10 rounded-md border border-black/8 bg-background px-3 dark:border-white/[.145]"
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value);
                  setAvailability(null);
                }}
                disabled={loadingItems}
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              {selectedItem && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  In stock: {selectedItem.quantity} • Daily: {dollars(selectedItem.dailyRateCents)} • Deposit: {dollars(selectedItem.depositCents)}
                </div>
              )}
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Start</span>
                <input
                  className="h-10 rounded-md border border-black/8 bg-background px-3 dark:border-white/[.145]"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => {
                    setStartAt(e.target.value);
                    setAvailability(null);
                  }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">End</span>
                <input
                  className="h-10 rounded-md border border-black/8 bg-background px-3 dark:border-white/[.145]"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => {
                    setEndAt(e.target.value);
                    setAvailability(null);
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Quantity</span>
                <input
                  className="h-10 rounded-md border border-black/8 bg-background px-3 dark:border-white/[.145]"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Math.max(1, Number(e.target.value || 1)));
                    setAvailability(null);
                  }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Customer name (optional)</span>
                <input
                  className="h-10 rounded-md border border-black/8 bg-background px-3 dark:border-white/[.145]"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Demo Customer"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
                onClick={checkAvailability}
                disabled={checking || loadingItems}
              >
                {checking ? "Checking…" : "Check availability"}
              </button>

              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-black/8 px-4 text-sm font-medium dark:border-white/[.145]"
                onClick={submitBooking}
                disabled={bookingStatus === "submitting" || !availability?.available}
                title={availability?.available ? "" : "Check availability first"}
              >
                {bookingStatus === "submitting" ? "Booking…" : "Create booking"}
              </button>
            </div>

            <div className="min-h-6 text-sm">
              {availability && availability.exists && (
                <span className={availability.available ? "text-foreground" : "text-zinc-600 dark:text-zinc-400"}>
                  Remaining: {availability.remaining} / {availability.total}
                </span>
              )}
              {availability && !availability.exists && (
                <span className="text-zinc-600 dark:text-zinc-400">Item not found</span>
              )}
              {bookingStatus === "success" && (
                <span className="ml-3 text-foreground">Booking created.</span>
              )}
              {bookingStatus === "error" && bookingError && (
                <span className="ml-3 text-zinc-600 dark:text-zinc-400">{bookingError}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
