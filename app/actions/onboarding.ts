'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { redirect } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'

const businessSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  currency: z.string().min(3),
})

export async function createBusiness(prevState: any, formData: FormData) {
  const session = await verifySession()
  
  const result = businessSchema.safeParse(Object.fromEntries(formData))

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }

  const { name, country, currency } = result.data

  try {
    await prisma.business.create({
      data: {
        userId: session.userId,
        name,
        country,
        currency,
      },
    })
  } catch (error) {
    return {
      message: 'Failed to create business. You might already have one.',
    }
  }

  const locale = await getLocale();
  redirect({ href: '/dashboard', locale })
}
