import { Link, redirect } from '@/i18n/routing';
import { getSession } from "@/lib/session";
import { getTranslations, getLocale } from 'next-intl/server';

export default async function Home() {
  const t = await getTranslations('Landing');
  const locale = await getLocale();

  const session = await getSession();
  if (session) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-emerald-500/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
             <img src="/logo.svg" alt="TallyRent" className="h-8 w-auto" />
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#product" className="hover:text-foreground transition-colors">{t('nav.product')}</Link>
            <Link href="#resources" className="hover:text-foreground transition-colors">{t('nav.resources')}</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">{t('nav.pricing')}</Link>
            <Link href="#docs" className="hover:text-foreground transition-colors">{t('nav.docs')}</Link>
          </nav>

          <div className="flex items-center gap-6">
             <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
               {t('nav.login')}
             </Link>
             <Link href="/signup" className="h-9 px-5 rounded-full bg-foreground text-sm font-medium text-background hover:bg-foreground/90 flex items-center justify-center transition-colors">
               {t('nav.signup')}
             </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-40 md:pb-48">
           {/* Background Glow */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-125 opacity-10 pointer-events-none">
             <div className="absolute inset-0 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 blur-[120px] rounded-full" />
           </div>

           <div className="container mx-auto px-6 relative z-10">
             <div className="mx-auto max-w-5xl text-center">
               <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 mb-8 backdrop-blur-sm">
                 <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                 {t('subtitle')}
               </div>
               
               <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-linear-to-b from-white to-white/60 bg-clip-text text-transparent">
                 {t('title')}
               </h1>
               
               <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-12 leading-relaxed">
                 {t('description')}
               </p>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link href="/dashboard" className="h-12 px-8 rounded-full bg-foreground text-background text-base font-medium hover:bg-foreground/90 flex items-center justify-center transition-all shadow-lg hover:shadow-emerald-500/20">
                   {t('getStarted')}
                 </Link>
                 <Link href="/login" className="h-12 px-8 rounded-full border border-border bg-white/5 text-foreground text-base font-medium hover:bg-white/10 flex items-center justify-center transition-colors">
                   {t('signIn')}
                 </Link>
               </div>
             </div>
           </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 border-t border-border/40">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { title: t('features.assetTracking'), desc: t('features.assetTrackingDesc') },
                 { title: t('features.conflictDetection'), desc: t('features.conflictDetectionDesc') },
                 { title: t('features.financialReporting'), desc: t('features.financialReportingDesc') }
               ].map((f, i) => (
                 <div key={i} className="group p-8 rounded-3xl border border-border/40 bg-card hover:bg-white/4 transition-colors relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-emerald-400 transition-colors relative z-10">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed relative z-10">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          {t('footer')}
        </div>
      </footer>
    </div>
  );
}
