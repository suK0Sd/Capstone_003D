import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  Headphones,
  Layers,
  LineChart,
  Lock,
  LockOpen,
  Power,
  Scale,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { activateArea, deactivateArea, fetchAreas } from '@/api';
import { isPaywallError } from '@/lib/planGate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useAssessment } from '@/store/assessmentStore';
import { cn } from '@/lib/utils';

interface AreaEntry {
  name: string;
  icon: string;
  n: number;
}

function getAreaLucideIcon(areaKey: string) {
  switch (areaKey) {
    case 'ventas':
      return Briefcase;
    case 'marketing':
      return LineChart;
    case 'servicio':
      return Headphones;
    case 'finanzas':
      return Wallet;
    case 'rrhh':
      return Users;
    case 'operaciones':
      return Wrench;
    case 'legal':
      return Scale;
    default:
      return Layers;
  }
}

/** Functional areas overview: 7 area kits with activation + progress. */
export default function Areas() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { assessment, status, reload } = useAssessment();
  const [upgradeMsg, setUpgradeMsg] = useState(false);

  useEffect(() => {
    if (status === 'idle') void reload();
  }, [status, reload]);

  const areasQuery = useQuery({
    queryKey: ['areas', assessment?.id],
    queryFn: () => fetchAreas(assessment!.id),
    enabled: !!assessment,
  });

  const activate = useMutation({
    mutationFn: (areaKey: string) => activateArea(assessment!.id, areaKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas', assessment?.id] }),
    onError: (e) => {
      if (isPaywallError(e)) setUpgradeMsg(true);
    },
  });

  const deactivate = useMutation({
    mutationFn: (areaKey: string) => deactivateArea(assessment!.id, areaKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas', assessment?.id] }),
  });

  const areaList = t('areaList', { returnObjects: true }) as Record<string, AreaEntry>;

  if (status === 'idle' || status === 'loading' || areasQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <div className="mx-auto max-w-6xl">
        <SpotlightCard className="rounded-2xl border border-primary/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-foreground">{t('common.noAssessment')}</p>
              <p className="text-xs text-muted-foreground mt-1">Completa el asistente inicial para activar tus áreas funcionales.</p>
            </div>
            <Button asChild size="sm" className="brand-gradient text-white rounded-xl text-xs h-9">
              <Link to="/onboarding">{t('common.startDiagnostic')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  const items = areasQuery.data?.items ?? [];
  const activeCount = items.filter((a) => a.active).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header con Resumen de Áreas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Layers className="h-3 w-3" />
              Módulos 2 y 3
            </span>
            <Badge variant="secondary" className="text-[10px] px-2 h-5">
              {activeCount} de 7 áreas activas
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('areas.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('areas.sub')}
          </p>
        </div>
      </div>

      {upgradeMsg && (
        <Alert className="border-primary bg-card/90 rounded-2xl shadow-md">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs sm:text-sm">
              <strong className="text-foreground">{t('areas.lockedUpgrade')}</strong>
            </span>
            <Button asChild size="sm" className="brand-gradient border-0 text-white rounded-lg text-xs h-8">
              <Link to="/estimator">{t('dashboard.upgradeCta')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Grilla de las 7 Áreas Funcionales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((area) => {
          const entry = areaList[area.area_key];
          const Icon = getAreaLucideIcon(area.area_key);
          const stateText = area.locked
            ? t('areas.stateLocked')
            : area.active
              ? t('areas.stateActive')
              : t('areas.stateInactive');

          return (
            <SpotlightCard
              key={area.area_key}
              className={cn(
                'flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all',
                area.active
                  ? 'border-border/80 bg-card/90 hover:border-primary/50 hover:shadow-md'
                  : 'border-border/50 bg-card/50 opacity-80',
              )}
            >
              <div className="space-y-3">
                {/* Top: Ícono, Nombre y Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl shadow-sm text-lg',
                      area.active ? 'brand-gradient text-white shadow-md' : 'bg-muted text-muted-foreground',
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {entry?.name ?? area.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {t('areas.questions', { n: entry?.n ?? 16 })}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={area.active ? 'default' : 'secondary'}
                    className={cn(
                      'text-[10px] px-2 h-5 shrink-0',
                      area.active && 'brand-gradient text-white border-0',
                      area.locked && 'gap-1',
                    )}
                  >
                    {area.locked && <Lock className="h-3 w-3" />}
                    {stateText}
                  </Badge>
                </div>

                {/* Barra de Progreso */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">{t('areas.progressLabel')}</span>
                    <span className="text-[11px] font-bold text-foreground">{area.progress}%</span>
                  </div>
                  <Progress value={area.progress} className="h-1.5 bg-muted/60" />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="mt-5 pt-3 border-t border-border/50 flex items-center gap-2">
                {area.active ? (
                  <>
                    <Button
                      size="sm"
                      className="brand-gradient flex-1 border-0 text-white font-semibold text-xs h-9 rounded-xl shadow-xs cursor-pointer"
                      onClick={() => navigate(`/areas/${area.area_key}`)}
                    >
                      {t('moduleCards.areas.cta')} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deactivate.mutate(area.area_key)}
                      disabled={deactivate.isPending}
                      className="text-xs h-9 rounded-xl text-muted-foreground hover:text-destructive cursor-pointer"
                      title={t('areas.deactivate')}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : area.locked ? (
                  <Button asChild size="sm" variant="outline" className="flex-1 text-xs h-9 rounded-xl cursor-pointer">
                    <Link to="/estimator">
                      <Lock className="h-3.5 w-3.5 mr-1" /> {t('common.upgrade')}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-9 rounded-xl cursor-pointer hover:border-primary hover:text-primary"
                    onClick={() => activate.mutate(area.area_key)}
                    disabled={activate.isPending}
                  >
                    <LockOpen className="h-3.5 w-3.5 mr-1 text-primary" /> {t('areas.activate')}
                  </Button>
                )}
              </div>
            </SpotlightCard>
          );
        })}
      </div>
    </div>
  );
}
