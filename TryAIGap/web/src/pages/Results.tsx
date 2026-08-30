import { lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  Grid,
  Lock,
  PieChart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ApiError } from '@/api/client';
import { fetchOrganization, fetchResults } from '@/api';
import type { ResultOut } from '@/api/types';
import { MaturityRadar } from '@/components/questionnaire/MaturityRadar';
import type { ReportLabels } from '@/pdf/ReportDocument';

const ReportPdfActions = lazy(() => import('@/pdf/ReportPdf'));
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAssessment } from '@/store/assessmentStore';
import { cn } from '@/lib/utils';

/** Heat cell color by 1-5 intensity. */
function heatClass(v: number): string {
  if (v >= 4) return 'bg-primary/90 text-primary-foreground font-bold';
  if (v === 3) return 'bg-primary/50 text-foreground font-semibold';
  if (v === 2) return 'bg-primary/20 text-foreground font-medium';
  return 'bg-muted text-muted-foreground';
}

function ResultsBody({ results }: { results: ResultOut }) {
  const { t, i18n } = useTranslation();
  const { assessment } = useAssessment();
  const recoLabels = t('resultsUI.reco', { returnObjects: true }) as Record<string, string>;

  const orgQuery = useQuery({
    queryKey: ['organization', assessment?.organization_id],
    queryFn: () => fetchOrganization(assessment!.organization_id),
    enabled: !!assessment?.organization_id,
  });

  const dateStr = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date());

  const labels: ReportLabels = useMemo(
    () => ({
      coverTitle: t('resultsPdf.coverTitle'),
      coverSub: t('resultsPdf.coverSub'),
      generatedOn: t('resultsPdf.generatedOn', { date: dateStr }),
      overallScore: t('resultsPdf.overallScore', {
        avg: results.maturity.average.toFixed(1),
        level: results.maturity.level,
      }),
      methodology: t('resultsPdf.methodology'),
      methodologyBody: t('resultsPdf.methodologyBody'),
      dimTitle: t('resultsPdf.dimTitle'),
      dimName: t('resultsPdf.dimName'),
      dimScore: t('resultsPdf.dimScore'),
      heatTitle: t('resultsPdf.heatTitle'),
      prioTitle: t('resultsPdf.prioTitle'),
      recoTitle: t('resultsPdf.recoTitle'),
      nextSteps: t('resultsPdf.nextSteps', { returnObjects: true }) as string[],
      footer: t('resultsPdf.footer'),
      prioritiesHeaders: {
        initiative: t('resultsUI.thInitiative'),
        area: t('resultsUI.thArea'),
        vector: t('resultsUI.thVector'),
        recommendation: t('resultsUI.thReco'),
      },
      recoLabels,
    }),
    [t, dateStr, results, recoLabels],
  );

  const reportData = {
    orgName: orgQuery.data?.name ?? '—',
    date: dateStr,
    results,
  };

  return (
    <div className="space-y-8">
      {/* Header Ejecutivo de Resultados */}
      <SpotlightCard className="rounded-2xl border border-primary/40 bg-card/95 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Módulo 6: Resultados Consolidados
              </span>
              <Badge className="brand-gradient text-white border-0 text-xs px-2.5 py-0.5">
                {t('results.levelLabel')}: {results.maturity.level}
              </Badge>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {results.maturity.average.toFixed(1)}
                <span className="text-lg sm:text-xl font-medium text-muted-foreground"> / 5.0</span>
              </h2>
              <span className="text-sm font-semibold text-muted-foreground">Puntuación Global de Madurez</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              Diagnóstico estratégico basado en las 5 dimensiones y las áreas funcionales auditadas con cumplimiento metodológico.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Suspense fallback={<Skeleton className="h-10 w-44 rounded-xl" />}>
              <ReportPdfActions
                data={reportData}
                labels={labels}
                fileName={`TryAIGap-Report-${new Date().toISOString().slice(0, 10)}.pdf`}
                texts={{
                  preview: t('results.pdfPreview'),
                  download: t('results.downloadPdf'),
                  loading: t('common.loading'),
                }}
              />
            </Suspense>
            <Button asChild variant="outline" className="text-xs font-semibold h-10 px-4 rounded-xl cursor-pointer">
              <Link to="/review">
                <CalendarCheck2 className="h-4 w-4 mr-1.5 text-primary" /> {t('results.bookReview')}
              </Link>
            </Button>
          </div>
        </div>
      </SpotlightCard>

      {/* Grid: Radar Pentagonal + Barras por Dimensión */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Pentagonal */}
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">{t('results.maturityRadar')}</h3>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
              5 Dimensiones
            </Badge>
          </div>
          <div className="py-2">
            <MaturityRadar
              data={results.maturity.dimensions.map((d) => ({ dim: d.label, score: d.score }))}
            />
          </div>
        </SpotlightCard>

        {/* Barras de Dimensiones */}
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">{t('results.dimScores')}</h3>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
              Escala 1–5
            </Badge>
          </div>

          <div className="space-y-4 pt-1">
            {results.maturity.dimensions.map((d) => (
              <div key={d.key} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-foreground">{d.label}</span>
                  <span className="font-extrabold text-foreground">{d.score.toFixed(1)} / 5.0</span>
                </div>
                <Progress value={(d.score / 5) * 100} className="h-2 bg-muted/60" />
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>

      {/* Mapa de Calor / Heatmap */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">{t('results.heatmap')}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t('resultsUI.heatTitle')}</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold">{t('resultsUI.thArea')}</TableHead>
                {results.heatmap.vectors.map((v) => (
                  <TableHead key={v} className="text-center font-bold">
                    {v}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.heatmap.areas.map((area) => (
                <TableRow key={area.name} className="hover:bg-muted/30 text-xs">
                  <TableCell className="font-bold text-foreground">{area.name}</TableCell>
                  {area.row.map((v, i) => (
                    <TableCell key={i} className="p-2 text-center">
                      <span
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all shadow-xs',
                          heatClass(v),
                        )}
                      >
                        {v}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Leyenda Accesible de Intensidad (WCAG Data Visualization) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
          <span className="font-medium">Escala de Intensidad por Vector de Valor:</span>
          <div className="flex flex-wrap items-center gap-3 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-muted border border-border" /> 1 - Bajo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary/20 border border-primary/30" /> 2 - Oportunista
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary/50 border border-primary/40" /> 3 - Definido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary/90 border border-primary" /> 4-5 - Alto / Crítico
            </span>
          </div>
        </div>
      </SpotlightCard>

      {/* Prioridades Estratégicas y Recomendaciones */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">{t('results.priorities')}</h3>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold">
            {results.priorities.length} Iniciativas Clave
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold">{t('resultsUI.thInitiative')}</TableHead>
                <TableHead className="font-bold">{t('resultsUI.thArea')}</TableHead>
                <TableHead className="font-bold">{t('resultsUI.thVector')}</TableHead>
                <TableHead className="font-bold">{t('resultsUI.thReco')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.priorities.map((p) => (
                <TableRow key={p.initiative} className="hover:bg-muted/30 text-xs">
                  <TableCell className="font-bold text-foreground">{p.initiative}</TableCell>
                  <TableCell className="text-muted-foreground">{p.area}</TableCell>
                  <TableCell className="text-muted-foreground">{p.vector}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                      {recoLabels[p.recommendation] ?? p.recommendation}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SpotlightCard>
    </div>
  );
}

/** Results: overall score, radar, heatmap, priorities + client-side PDF report. */
export default function Results() {
  const { t } = useTranslation();
  const { assessment, status: assessmentStatus, reload } = useAssessment();

  if (assessmentStatus === 'idle') void reload();

  const resultsQuery = useQuery({
    queryKey: ['results', assessment?.id],
    queryFn: () => fetchResults(assessment!.id),
    enabled: !!assessment,
    retry: 0,
  });

  const error = resultsQuery.error;
  const isPaywall = error instanceof ApiError && error.status === 402;
  const isNotReady = error instanceof ApiError && error.code === 'RESULTS_NOT_READY';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {!assessment && (
        <SpotlightCard className="rounded-2xl border border-primary/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-foreground">{t('common.noAssessment')}</p>
              <p className="text-xs text-muted-foreground mt-1">Completa el diagnóstico para generar tu informe ejecutivo.</p>
            </div>
            <Button asChild size="sm" className="brand-gradient text-white rounded-xl text-xs h-9">
              <Link to="/onboarding">{t('common.startDiagnostic')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {resultsQuery.isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      )}

      {isPaywall && (
        <SpotlightCard className="rounded-2xl border border-primary/40 bg-card/90 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{t('paywall.title')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">{t('paywall.sub')}</p>
              </div>
            </div>
            <Button asChild className="brand-gradient border-0 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer">
              <Link to="/estimator">{t('paywall.cta')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {isNotReady && (
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-white shadow-lg">
              <Activity className="h-7 w-7" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">{t('results.notReadyTitle')}</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{t('results.notReadyDesc')}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild className="brand-gradient text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer">
              <Link to="/maturity">{t('results.goMaturity')}</Link>
            </Button>
            <Button asChild variant="outline" className="text-xs font-semibold h-10 px-5 rounded-xl cursor-pointer">
              <Link to="/areas">{t('results.goAreas')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {resultsQuery.isError && !isPaywall && !isNotReady && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle className="text-sm font-bold">{t('common.errorGeneric')}</AlertTitle>
          <AlertDescription className="pt-2">
            <Button variant="outline" size="sm" onClick={() => void resultsQuery.refetch()} className="text-xs rounded-xl">
              {t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {resultsQuery.data && <ResultsBody results={resultsQuery.data} />}
    </div>
  );
}
