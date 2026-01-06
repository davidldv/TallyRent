'use client'

import { useActionState, useEffect } from 'react'
import { signup } from '@/app/actions/auth'
import Link from 'next/link';
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/simple-toast'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { AuthVisual } from '@/components/auth-visual'
import { useTranslations } from 'next-intl'
import { GoogleLoginButton } from '@/components/google-login-button'

export default function SignupPage() {
  const t = useTranslations('Auth')
  const [state, action, isPending] = useActionState(signup, undefined)
  const { error } = useToast()

  useEffect(() => {
    if (state?.errors) {
       Object.values(state.errors).flat().forEach((msg) => {
         error(msg)
       })
    }
  }, [state, error])

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Visual Side */}
      <div className="relative hidden flex-col justify-between bg-zinc-900 p-10 text-white md:flex">
         <div className="absolute inset-0 bg-linear-to-t from-emerald-900/20 to-zinc-900/90" />
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
         
         <div className="relative z-10 flex items-center gap-2 font-medium text-lg">
            <img src="/logo.svg" className="h-8 w-auto" alt="TallyRent" />
         </div>

         <AuthVisual />

         <div className="relative z-10">
            <blockquote className="space-y-2">
               <p className="text-lg font-medium leading-relaxed">
                  &ldquo;{t('quoteSignup')}&rdquo;
               </p>
            </blockquote>
         </div>
      </div>

       {/* Form Side */}
      <div className="flex items-center justify-center p-6 md:p-10 relative bg-background">
        <Link href="/" className="absolute top-6 right-6 md:top-6 md:right-8 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
           <ArrowLeft className="w-4 h-4" />
           {t('backToHome')}
        </Link>
        <div className="w-full max-w-87.5 space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t('signup.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('signup.subtitle')}
            </p>
          </div>

          <div className="grid gap-6">
            <GoogleLoginButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
          </div>

          <form action={action} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('fields.name')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder={t('fields.placeholders.name')}
              required
              defaultValue={state?.inputs?.name}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                state?.errors?.name && "border-red-500 focus-visible:ring-red-500 bg-red-500/5 placeholder:text-red-500/50"
              )}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('fields.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t('fields.placeholders.email')}
              required
              defaultValue={state?.inputs?.email}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                state?.errors?.email && "border-red-500 focus-visible:ring-red-500 bg-red-500/5 placeholder:text-red-500/50"
              )}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('fields.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                state?.errors?.password && "border-red-500 focus-visible:ring-red-500 bg-red-500/5"
              )}
            />
          </div>
          
            <Button type="submit" className="w-full font-medium" disabled={isPending}>
              {isPending ? t('signup.submitting') : t('signup.submit')}
            </Button>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            {t('signup.hasAccount')}{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              {t('signup.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
