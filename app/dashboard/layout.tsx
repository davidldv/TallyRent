import { verifySession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";
import { getTranslations } from 'next-intl/server'; // Server-side translation helper
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();
  const t = await getTranslations('Dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
           <div className="flex items-center gap-2">
             <img src="/logo.svg" alt="TallyRent" className="h-8 w-auto" />
             <span className="text-muted-foreground font-normal">{t('nav.dashboard')}</span>
           </div>
           <div className="flex gap-4 text-sm items-center">
             <Link href="/widget" className="text-muted-foreground hover:text-foreground transition-colors">{t('nav.widget')}</Link>
             <LogoutButton />
           </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </div>
    </div>
  );
}
