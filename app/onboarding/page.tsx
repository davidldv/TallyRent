'use client'

import { useActionState } from 'react'
import { createBusiness } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'

export default function OnboardingPage() {
  const [state, action, isPending] = useActionState(createBusiness, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Setup your Business</h1>
          <p className="text-sm text-muted-foreground">
            Tell us a bit about your rental business to get started.
          </p>
        </div>

        <form action={action} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none"
            >
              Business Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Acme Rentals"
              required
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {state?.errors?.name && (
              <p className="text-sm text-red-500">{state.errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="country"
                className="text-sm font-medium leading-none"
              >
                Country
              </label>
              <select
                id="country"
                name="country"
                required
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                {/* Add more as needed */}
              </select>
            </div>
            
            <div className="space-y-2">
              <label
                htmlFor="currency"
                className="text-sm font-medium leading-none"
              >
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                required
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          {state?.message && (
             <p className="text-sm text-red-500 text-center">{state.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
             {isPending ? 'Setting up...' : 'Create Business Profile'}
          </Button>
        </form>
      </div>
    </div>
  )
}
