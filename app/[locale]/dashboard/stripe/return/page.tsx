import { redirect } from '@/i18n/routing'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { verifySession } from '@/lib/session'
import { getLocale } from 'next-intl/server'

export default async function StripeReturnPage() {
  const session = await verifySession()

  const business = await prisma.business.findUnique({
    where: { userId: session.userId },
  })
  
  const locale = await getLocale()

  if (!business || !business.stripeConnectAccountId) {
    redirect({ href: '/dashboard', locale })
    return null;
  }

  // Check if onboarding is actually complete
  const account = await stripe.accounts.retrieve(business.stripeConnectAccountId)

  if (account.details_submitted) {
    await prisma.business.update({
      where: { id: business.id },
      data: { stripeOnboardingComplete: true },
    })
  }

  redirect({ href: '/dashboard', locale })
  return null;
}
