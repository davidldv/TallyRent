'use client'

import { useActionState, useEffect } from 'react'
import { login } from '@/app/actions/auth'
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/simple-toast'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { AuthVisual } from '@/components/auth-visual'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('Auth')
  const [state, action, isPending] = useActionState(login, undefined)
  const { error } = useToast()

  useEffect(() => {
    if (state?.message) {
      error(state.message)
    }
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
         <div className="absolute inset-0 bg-linear-to-b from-zinc-900/20 to-zinc-900/90" />
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
         
         <div className="relative z-10 flex items-center gap-2 font-medium text-lg">
            <img src="/logo.svg" className="h-8 w-auto" alt="TallyRent" />
         </div>

         <AuthVisual />

         <div className="relative z-10">
            <blockquote className="space-y-2">
               <p className="text-lg font-medium leading-relaxed">
                  &ldquo;{t('quote')}&rdquo;
               </p>
               <footer className="text-sm text-zinc-400">
                  {t('quoteAuthor')}
               </footer>
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
            <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('login.subtitle')}
            </p>
          </div>
          
          <form action={action} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('fields.password')}
              </label>
            </div>
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
              {isPending ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              {t('login.signupLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
