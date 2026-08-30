import { useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Crown,
  FileCheck2,
  FileText,
  Gauge,
  LayoutGrid,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { fetchAreas, fetchDocuments, fetchTeam } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/ui/count-up';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useAssessment } from '@/store/assessmentStore';
import { useAuthStore } from '@/store/authStore';

interface ModuleCard {
  title: string;
  sub: string;
  cta: string;
  meta: string;
}

const MODULE_CONFIG: Record<
  string,
  {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    code: string;
    gradient: string;
  }
> = {
  maturity: {
    to: '/maturity',
    icon: Gauge,
    code: 'M1',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  areas: {
    to: '/areas',
    icon: LayoutGrid,
    code: 'M2',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  estimator: {
    to: '/estimator',
    icon: CalendarClock,
    code: 'M3',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  documents: {
    to: '/documents',
    icon: FileText,
    code: 'M4',
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
  team: {
    to: '/team',
    icon: Users,
    code: 'M5',
    gradient: 'from-purple-500/20 to-indigo-500/20',
  },
  results: {
    to: '/results',
    icon: BarChart3,
    code: 'M6',
    gradient: 'from-pink-500/20 to-purple-500/20',
  },
  review: {
    to: '/review',
    icon: ShieldCheck,
    code: 'M7',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
};

const MODULE_KEYS = ['maturity', 'areas', 'estimator', 'documents', 'team', 'results', 'review'] as const;

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return null;
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

/** Dashboard: assessment status, KPIs, per-module next steps. */
export default function Dashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { assessment, status, reload } = useAssessment();
  const moduleCards = t('moduleCards', { returnObjects: true }) as Record<string, ModuleCard>;

  useEffect(() => {
    if (status === 'idle') void reload();
  }, [status, reload]);

  const areasQuery = useQuery({
    queryKey: ['areas', assessment?.id],
    queryFn: () => fetchAreas(assessment!.id),
    enabled: !!assessment,
  });
  const teamQuery = useQuery({ queryKey: ['team'], queryFn: fetchTeam });
  const docsQuery = useQuery({
    queryKey: ['documents', 'count'],
    queryFn: () => fetchDocuments(1),
    retry: 0,
  });

  const areas = areasQuery.data?.items ?? [];
  const activeAreas = areas.filter((a) => a.active);
  const teamSize = teamQuery.data?.items.length;
  const docCount = docsQuery.data?.meta.total;
  const days = daysSince(assessment?.started_at);
  const maturityPct = assessment?.progress.maturity ?? 0;
  const loading = status === 'idle' || status === 'loading';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header con Bienvenida y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Zap className="h-3 w-3" />
              Diagnóstico Activo
            </span>
            {assessment && (
              <Badge
                variant={assessment.plan === 'pro' ? 'default' : 'secondary'}
                className="text-[10px] px-2 h-5 capitalize"
              >
                {assessment.plan === 'pro' ? 'Plan Pro Enterprise' : 'Plan Freemium'}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('dashboard.welcome')}
            {user?.full_name ? `, ${user.full_name}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('dashboard.pickUp')}
          </p>
        </div>

        {assessment && (
          <div className="flex items-center gap-3">
            <Button
              asChild
              size="lg"
              className="brand-gradient border-0 text-white shadow-md hover:opacity-95 text-xs sm:text-sm font-semibold rounded-xl h-11 px-5 cursor-pointer"
            >
              <Link to="/maturity">
                {t('dashboard.resume')} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Alerta de Assessment Faltante */}
      {status === 'missing' && (
        <SpotlightCard className="border border-primary/40 bg-card/80 p-6 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-base font-bold text-foreground">{t('dashboard.noAssessmentTitle')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('common.noAssessment')}</p>
            </div>
            <Button asChild className="brand-gradient text-white border-0 rounded-xl text-xs h-9">
              <Link to="/onboarding">{t('dashboard.noAssessmentCta')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {/* 4 Tarjetas de KPIs Estratégicos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Cobertura Global */}
        <SpotlightCard className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.kpis.coverage')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    <CountUp to={maturityPct} suffix="%" />
                  </span>
                  <span className="text-[11px] text-muted-foreground">M1 Madurez</span>
                </div>
                <Progress value={maturityPct} className="mt-2.5 h-1.5 bg-muted/60" />
                <p className="mt-2 text-[11px] text-muted-foreground truncate">
                  {activeAreas.length}/7 {t('dashboard.areasProgress').toLowerCase()}
                </p>
              </>
            )}
          </div>
        </SpotlightCard>

        {/* KPI 2: Equipo Asignado */}
        <SpotlightCard className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.kpis.team')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {teamQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  <CountUp to={teamSize ?? 1} />
                </span>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Líderes departamentales asignados
                </p>
              </>
            )}
          </div>
        </SpotlightCard>

        {/* KPI 3: Evidencias Respaldadas */}
        <SpotlightCard className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.kpis.evidence')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {docsQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  <CountUp to={docCount ?? 0} />
                </span>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Documentos y políticas adjuntas
                </p>
              </>
            )}
          </div>
        </SpotlightCard>

        {/* KPI 4: Tiempo Transcurrido */}
        <SpotlightCard className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.kpis.days')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  <CountUp to={days ?? 0} />{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    {t('dashboard.daysUnit')}
                  </span>
                </span>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Desde inicio de evaluación
                </p>
              </>
            )}
          </div>
        </SpotlightCard>
      </div>

      {/* Banner Destacado de Progreso del Módulo 1 (Madurez 5D) */}
      <SpotlightCard className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card/90 to-cyan-500/10 p-6 md:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              <Sparkles className="h-3 w-3" />
              Paso Clave · Módulo 1
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Diagnóstico de Madurez en 5 Dimensiones
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Responde las 20 preguntas estratégicas en <strong>Datos, Tecnología, Talento, Procesos y Cultura</strong>. Este diagnóstico calibra automáticamente el Radar Pentagonal y las recomendaciones por área funcional.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> 20 Preguntas
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> ~20 min duración
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> 100% Freemium
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 shrink-0">
            <Button asChild size="lg" className="brand-gradient text-white text-xs sm:text-sm font-semibold rounded-xl h-11 px-6 shadow-md cursor-pointer">
              <Link to="/maturity">
                Continuar Diagnóstico 5D <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </SpotlightCard>

      {/* Banner de Upgrade a Plan Pro (si aplica) */}
      {assessment?.plan === 'free' && (
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-card via-card/80 to-primary/5 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl brand-gradient text-white shadow-md">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Desbloquea el Potencial Completo con Plan Pro
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  Accede a los 7 kits por área funcional, exportación de Informe Ejecutivo en PDF A4 para directorio y acompañamiento de un consultor sénior.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="brand-gradient border-0 text-white rounded-xl text-xs h-9 px-4 shrink-0 cursor-pointer">
              <Link to="/estimator">{t('dashboard.upgradeCta')}</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Grilla de los 7 Módulos de la Metodología TryAIGap */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {t('dashboard.modules')}
          </h2>
          <p className="text-xs text-muted-foreground">
            Recorre la metodología paso a paso para construir un portafolio de IA cuantificado y gobernable.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_KEYS.map((key) => {
            const mod = moduleCards[key];
            const config = MODULE_CONFIG[key];
            if (!config || !mod?.title) return null;
            const Icon = config.icon;
            let meta = mod.meta;
            if (key === 'maturity' && assessment) meta = `${maturityPct}% completado · ${mod.meta}`;
            if (key === 'areas' && areas.length > 0)
              meta = `${activeAreas.length}/7 ${t('dashboard.areasProgress').toLowerCase()} · ${mod.meta}`;
            if (key === 'documents' && docCount !== undefined)
              meta = `${docCount} archivos · ${mod.meta}`;
            if (key === 'team' && teamSize !== undefined) meta = `${teamSize} miembros · ${mod.meta}`;

            return (
              <SpotlightCard
                key={key}
                className="flex flex-col rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      {config.code}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-foreground">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {mod.sub}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                    {meta}
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer">
                    <Link to={config.to}>
                      {mod.cta} <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* Asistente IA y Revisión Humana Supervisada */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Asistente IA */}
        <SpotlightCard className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessagesSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('dashboard.assistantTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('dashboard.assistantSub')}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" disabled>
              <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
              {t('dashboard.askAI')}
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs h-8 rounded-lg">
              <Link to="/review">{t('dashboard.bookHuman')}</Link>
            </Button>
          </div>
        </SpotlightCard>

        {/* Respaldo de Evidencias */}
        <SpotlightCard className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
              <FileCheck2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('nav.documents')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('dashboard.kpis.evidence')}: <strong className="text-foreground">{docCount ?? 0} archivos subidos</strong>
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground">
              Formatos soportados: PDF, Word, Excel, PNG
            </span>
            <Button asChild size="sm" variant="outline" className="text-xs h-8 rounded-lg">
              <Link to="/documents">
                {t('moduleCards.documents.cta')} <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
