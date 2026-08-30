import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Compass, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <SpotlightCard className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/90 p-8 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-5xl sm:text-6xl font-extrabold text-brand-gradient tracking-tight">404</p>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-2">{t('notFound.title')}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">{t('notFound.sub')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button asChild className="brand-gradient text-white border-0 font-semibold text-xs h-10 px-5 shadow-md">
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              {t('notFound.cta')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-xs h-10 px-5 font-semibold">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {t('common.back')}
            </Link>
          </Button>
        </div>
      </SpotlightCard>
    </div>
  );
}
