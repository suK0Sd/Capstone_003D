import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  FileSpreadsheet,
  Headphones,
  Layers,
  LineChart,
  ListTodo,
  Lock,
  LockOpen,
  Scale,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { activateArea, fetchAreaCases, fetchAreas } from '@/api';
import { isPaywallError } from '@/lib/planGate';
import { QuestionnaireEngine } from '@/components/questionnaire/QuestionnaireEngine';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAssessment } from '@/store/assessmentStore';

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

/** Single area: AI-readiness questionnaire + use-case catalog tabs. */
export default function AreaDetail() {
  const { areaKey } = useParams<{ areaKey: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { assessment, status, reload } = useAssessment();
  const [upgradeMsg, setUpgradeMsg] = useState(false);

  useEffect(() => {
    if (status === 'idle') void reload();
  }, [status, reload]);

  const areaList = t('areaList', { returnObjects: true }) as Record<string, AreaEntry>;
  const entry = areaKey ? areaList[areaKey] : undefined;
  const AreaIcon = areaKey ? getAreaLucideIcon(areaKey) : Layers;

  const areasQuery = useQuery({
    queryKey: ['areas', assessment?.id],
    queryFn: () => fetchAreas(assessment!.id),
    enabled: !!assessment,
  });

  const casesQuery = useQuery({
    queryKey: ['area-cases', areaKey],
    queryFn: () => fetchAreaCases(areaKey!),
    enabled: !!entry,
  });

  const activate = useMutation({
    mutationFn: () => activateArea(assessment!.id, areaKey!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas', assessment?.id] }),
    onError: (e) => {
      if (isPaywallError(e)) setUpgradeMsg(true);
    },
  });

  if (!entry) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{t('common.errorGeneric')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const areaState = areasQuery.data?.items.find((a) => a.area_key === areaKey);
  const loading =
    status === 'idle' || status === 'loading' || (assessment && areasQuery.isLoading);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header del Kit Funcional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/areas" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              {t('nav.areas')}
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground font-medium">{entry.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-md">
              <AreaIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {entry.name}
              </h1>
              <p className="text-xs text-muted-foreground">{t('areas.sub')}</p>
            </div>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="text-xs h-9 rounded-xl cursor-pointer">
          <Link to="/areas">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t('nav.areas')}
          </Link>
        </Button>
      </div>

      {loading && <Skeleton className="h-64 w-full rounded-2xl" />}

      {!loading && upgradeMsg && (
        <Alert className="border-primary bg-card/90 rounded-2xl shadow-md">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs sm:text-sm">{t('areas.lockedUpgrade')}</span>
            <Button asChild size="sm" className="brand-gradient border-0 text-white rounded-lg text-xs h-8">
              <Link to="/estimator">{t('dashboard.upgradeCta')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Estado: Bloqueada en Plan Free */}
      {!loading && areaState?.locked && (
        <SpotlightCard className="rounded-2xl border border-primary/40 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{t('areas.stateLocked')}</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-lg">{t('areas.lockedUpgrade')}</p>
              </div>
            </div>
            <Button asChild className="brand-gradient border-0 text-white text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer">
              <Link to="/estimator">{t('dashboard.upgradeCta')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {/* Estado: Inactiva pero Desbloqueada */}
      {!loading && areaState && !areaState.locked && !areaState.active && (
        <SpotlightCard className="rounded-2xl border border-border/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Área no activada actualmente</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('areas.activateFirst')}</p>
            </div>
            <Button
              onClick={() => activate.mutate()}
              disabled={activate.isPending}
              className="brand-gradient border-0 text-white text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer"
            >
              <LockOpen className="h-4 w-4 mr-1.5" /> {t('areas.activate')}
            </Button>
          </div>
        </SpotlightCard>
      )}

      {/* Estado: Activa (Pestañas de Cuestionario y Casos de Uso) */}
      {!loading && areaState?.active && (
        <Tabs defaultValue="questionnaire" className="space-y-4">
          <TabsList className="bg-card/60 border border-border/60 p-1 rounded-xl">
            <TabsTrigger value="questionnaire" className="rounded-lg text-xs font-semibold data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <ListTodo className="h-3.5 w-3.5 mr-1.5" />
              {t('areas.tabs.questionnaire')}
            </TabsTrigger>
            <TabsTrigger value="cases" className="rounded-lg text-xs font-semibold data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              {t('areas.tabs.cases')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questionnaire" className="mt-4">
            <QuestionnaireEngine module="area" areaKey={areaKey} moduleLabel={entry.name} />
          </TabsContent>

          <TabsContent value="cases" className="mt-4">
            <SpotlightCard className="rounded-2xl border border-border/70 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Catálogo de Casos de Uso & Canvas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('areas.casesNote')}</p>
              </div>

              {casesQuery.isLoading && <Skeleton className="h-48 w-full rounded-xl" />}
              {casesQuery.error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{t('common.errorGeneric')}</AlertDescription>
                </Alert>
              )}
              {casesQuery.data && (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-10 text-center font-bold">#</TableHead>
                        <TableHead className="font-bold">{t('cases.useCase')}</TableHead>
                        <TableHead className="font-bold">{t('cases.family')}</TableHead>
                        <TableHead className="font-bold">KPI Impactado</TableHead>
                        <TableHead className="font-bold">{t('cases.effort')}</TableHead>
                        <TableHead className="font-bold">{t('cases.maturity')}</TableHead>
                        <TableHead className="font-bold">{t('cases.stage')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {casesQuery.data.cases.map((c, i) => (
                        <TableRow key={c.name} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground text-center font-semibold">{i + 1}</TableCell>
                          <TableCell className="font-bold text-xs text-foreground">{c.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] font-semibold">{c.family}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.kpi}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.effort}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.maturity}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.stage}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </SpotlightCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
