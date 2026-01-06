import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { Link, redirect } from '@/i18n/routing';
import { connectStripe } from "@/app/actions/stripe";
import { getTranslations, getLocale } from "next-intl/server";

function formatDateTimeUtc(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { 
    month: "short", day: "numeric", hour: "numeric", minute: "numeric", timeZone: "UTC" 
  });
}

export default async function DashboardPage() {
  const session = await verifySession();
  const t = await getTranslations('Dashboard');
  const locale = await getLocale();
  
  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

  const business = await prisma.business.findUnique({
    where: { userId: session.userId },
  });

  if (!business) {
    redirect({ href: "/onboarding", locale });
    return null; // TS satisfaction
  }

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
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
          product: { select: { name: true } },
        },
      },
    },
  });

  return (
    <>
        {/* Stripe Connect Notice */}
        {!business.stripeOnboardingComplete && (
           <div className="mb-8 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                   </div>
                   <div>
                     <h3 className="text-sm font-semibold text-foreground">{t('stripe.title')}</h3>
                     <p className="text-sm text-muted-foreground">{t('stripe.desc')}</p>
                   </div>
                </div>
                <form action={connectStripe}>
                  <button type="submit" className="h-9 rounded-md bg-yellow-500 px-4 text-sm font-medium text-black hover:bg-yellow-400 cursor-pointer">
                    {t('stripe.button')}
                  </button>
                </form>
             </div>
           </div>
        )}

        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('header.bookingsFor')} <span className="text-foreground font-medium">{start.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button className="h-9 rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
                {t('header.filter')}
            </button>
            <Link 
              href="/dashboard/new"
              className="inline-flex items-center justify-center h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
                {t('header.newBooking')}
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">{t('table.date')}</th>
                <th className="px-6 py-4 font-medium">{t('table.customer')}</th>
                <th className="px-6 py-4 font-medium">{t('table.equipment')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-muted-foreground" colSpan={4}>
                    {t('table.empty')}
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                     <td className="px-6 py-4 align-top whitespace-nowrap">
                      <div className="font-medium">{formatDateTimeUtc(b.startAt)}</div>
                      <div className="text-xs text-muted-foreground">{t('table.to')} {formatDateTimeUtc(b.endAt)}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                        <div className="font-medium">{b.customer.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {b.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {b.items.map((i, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-muted-foreground">1x</span>
                          <span>{i.product.name}</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${b.status === 'CONFIRMED' ? 'bg-green-500/15 text-green-500' : 
                          b.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-500' :
                          b.status === 'CANCELLED' ? 'bg-red-500/15 text-red-500' :
                          'bg-zinc-500/15 text-zinc-500'}
                      `}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    </>
  );
}
