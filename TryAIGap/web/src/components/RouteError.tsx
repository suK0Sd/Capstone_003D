import { useTranslation } from 'react-i18next';
import { Link, useRouteError } from 'react-router';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';

/** Router-level error fallback (errorElement). */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError() as { statusText?: string; message?: string } | null;
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <SpotlightCard className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-5">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{t('common.errorGeneric')}</h2>
        <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/40 p-2.5 rounded-xl border border-border/50 break-words">
          {error?.statusText ?? error?.message ?? 'Ha ocurrido un error inesperado al procesar la ruta.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button onClick={() => window.location.reload()} className="brand-gradient text-white border-0 text-xs h-10 px-5 font-semibold shadow-md">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {t('common.retry')}
          </Button>
          <Button asChild variant="outline" className="text-xs h-10 px-5 font-semibold">
            <Link to="/">
              <Home className="h-4 w-4 mr-1.5" />
              {t('notFound.cta')}
            </Link>
          </Button>
        </div>
      </SpotlightCard>
    </div>
  );
}
