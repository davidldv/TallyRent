'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';

export function LanguageToggle({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'es' : 'en';
    startTransition(() => {
        document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.reload();
    });
  };

  return (
    <Button 
      variant="ghost" 
      onClick={toggleLanguage}
      disabled={isPending}
      className="fixed top-4 right-4 z-50 text-foreground bg-background/50 backdrop-blur-sm border"
    >
      {locale === 'en' ? 'Español' : 'English'}
    </Button>
  );
}
