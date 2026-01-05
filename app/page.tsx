export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Rental Shop OS</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Demo app: items, availability checks, and bookings.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            href="/dashboard"
          >
            Open dashboard
          </a>
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/8 px-4 text-sm font-medium dark:border-white/[.145]"
            href="/widget"
          >
            Open customer widget
          </a>
        </div>
      </main>
    </div>
  );
}
