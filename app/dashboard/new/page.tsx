"use client";

import { useEffect, useMemo, useState } from "react";
import Link from 'next/link';
import { DatePicker } from "@/components/ui/date-picker";

type Product = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  pricePerDay: number;
  depositAmount: number;
};

type ProductsResponse = { businessId: string; products: Product[] };

type AvailabilityResponse = {
  exists: boolean;
  remaining: number;
  total: number;
};

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function toIsoUtc(value: Date | undefined) {
  if (!value || Number.isNaN(value.valueOf())) return null;
  return value.toISOString();
}

export default function NewBookingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState<string>("");
  const [startAt, setStartAt] = useState<Date | undefined>(undefined);
  const [endAt, setEndAt] = useState<Date | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState<string | null>(null);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/products")
      .then((r) => r.json())
      .then((data: ProductsResponse) => {
        if (cancelled) return;
        setProducts(data.products);
        setProductId((prev) => prev || data.products[0]?.id || "");
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
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

    if (!productId || !startIso || !endIso) {
      setAvailability(null);
      return;
    }

    setChecking(true);
    try {
      const qs = new URLSearchParams({
        productId,
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

    if (!productId || !startIso || !endIso) {
      setBookingStatus("error");
      setBookingError("Please fill product + start/end");
      return;
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId,
        startAt: startIso,
        endAt: endIso,
        quantity,
        customerName: customerName.trim() || undefined,
      }),
    });

    if (!res.ok) {
        const json = await res.json();
        setBookingStatus("error");
        setBookingError(json.error || "Booking failed");
        return;
    }

    setBookingStatus("success");
    setAvailability(null);
  }

  return (
      <div className="w-full max-w-lg mx-auto">
        <div className="mb-8 flex items-center justify-between">
           <div>
               <h1 className="text-3xl font-bold tracking-tight">New Booking</h1>
               <p className="text-muted-foreground mt-1">Create a new reservation manually.</p>
           </div>
           <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
             &larr; Back
           </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Product</label>
            <div className="relative">
                <select
                className="w-full appearance-none rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={loading}
                >
                {loading ? (
                    <option>Loading...</option>
                ) : (
                    products.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                    ))
                )}
                </select>
            </div>
            {selectedProduct && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                In stock: <span className="text-foreground">{selectedProduct.quantity}</span> • Daily: <span className="text-foreground">{dollars(selectedProduct.pricePerDay)}</span> • Deposit: <span className="text-foreground">{dollars(selectedProduct.depositAmount)}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Start Date</label>
              <DatePicker date={startAt} setDate={setStartAt} label="Start Date" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">End Date</label>
              <DatePicker date={endAt} setDate={setEndAt} label="End Date" />
            </div>
          </div>

          <div>
             <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Quantity</label>
             <input
               type="number"
               min={1}
               className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
               value={quantity}
               onChange={(e) => setQuantity(Number(e.target.value))}
             />
          </div>

          <div>
             <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Customer Name</label>
             <input
               type="text"
               className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
               value={customerName}
               onChange={(e) => setCustomerName(e.target.value)}
               placeholder="John Doe"
             />
          </div>

          <div className="flex gap-3 pt-2">
            <button
               onClick={checkAvailability}
               disabled={checking || loading}
               className="flex-1 rounded-md border border-input bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              {checking ? "Checking..." : "Check"}
            </button>
            <button
               onClick={submitBooking}
               disabled={checking || loading || bookingStatus === "submitting"}
               className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
               {bookingStatus === "submitting" ? "Creating..." : "Create Booking"}
            </button>
          </div>

          {availability && (
            <div className={`mt-4 rounded-md border px-3 py-2.5 text-sm ${
                availability.exists && availability.remaining >= quantity 
                ? "border-green-500/20 bg-green-500/10 text-green-500" 
                : "border-red-500/20 bg-red-500/10 text-red-500"
            }`}>
               {availability.exists ? (
                 <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${availability.remaining >= quantity ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${availability.remaining >= quantity ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                   <span>
                        {availability.remaining >= quantity ? "Available" : "Not enough stock"} 
                        <span className="opacity-70 ml-1">({availability.remaining} left)</span>
                   </span>
                 </div>
               ) : (
                 "Product not found"
               )}
            </div>
          )}

          {bookingStatus === "success" && (
            <div className="mt-4 rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-500">
               Booking created successfully!
            </div>
          )}

          {bookingError && (
            <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
               {bookingError}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
