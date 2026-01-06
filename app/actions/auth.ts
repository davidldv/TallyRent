'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function signup(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData)
  const result = signupSchema.safeParse(data)
  // Mask password in inputs returned
  const inputs = { ...data, password: '' } as Record<string, any>

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      inputs,
    }
  }

  const { email, password, name } = result.data

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return {
      errors: {
        email: ['User with this email already exists'],
      },
      inputs,
    }
  }

  const hashedPassword = await hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  })

  await createSession(user.id)
  
  const locale = await getLocale();
  // Redirect to onboarding to create business profile
  redirect({ href: '/onboarding', locale })
}

export async function login(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData)
  const result = loginSchema.safeParse(data)
  // Mask password in inputs returned
  const inputs = { ...data, password: '' } as Record<string, any>

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      inputs,
    }
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.password) {
    return {
      message: 'Invalid email or password',
      inputs,
    }
  }

  const passwordMatch = await compare(password, user.password)

  if (!passwordMatch) {
    return {
      message: 'Invalid email or password',
      inputs,
    }
  }

  await createSession(user.id)
  
  // Check if user has a business
  const business = await prisma.business.findUnique({
    where: { userId: user.id },
  })
  
  const locale = await getLocale();

  if (!business) {
    redirect({ href: '/onboarding', locale })
  }

  redirect({ href: '/dashboard', locale })
}

export async function logout() {
  await deleteSession()
  const locale = await getLocale();
  redirect({ href: '/login', locale })
}
