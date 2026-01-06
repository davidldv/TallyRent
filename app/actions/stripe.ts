'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { verifySession } from '@/lib/session'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'

export async function connectStripe() {
  const session = await verifySession()
  
  const business = await prisma.business.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  })

  if (!business) {
    throw new Error("Business not found")
  }

  let accountId = business.stripeConnectAccountId

  // 1. Create a Stripe Account if it doesn't exist
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      country: business.country,
      email: business.user.email,
      business_profile: {
        name: business.name,
      },
    })
    
    accountId = account.id
    
    await prisma.business.update({
      where: { id: business.id },
      data: { stripeConnectAccountId: accountId },
    })
  }

  // 2. Create an Account Link to send the user to Stripe
  const headersList = await headers() 
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const locale = await getLocale()
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard`,
    return_url: `${origin}/dashboard/stripe/return`,
    type: 'account_onboarding',
  })

  redirect(accountLink.url)
}
