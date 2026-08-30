import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  ChevronRight,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { fetchConsultantClients, fetchConsultantKpis } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const STATUS_LABEL_KEYS: Record<string, string> = {
  lead: 'lead',
  in_progress: 'inprog',
  completed: 'done',
  draft: 'inprog',
};

function ClientStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const key = STATUS_LABEL_KEYS[status] ?? 'stalled';
  return (
    <Badge
      variant="secondary"
      className="text-[10px] font-bold"
    >
      {t(`consultant.statuses.${key}`)}
    </Badge>
  );
}

/** Consultant console: KPIs + client portfolio (role=consultant only). */
export default function Consultant() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const kpisQuery = useQuery({ queryKey: ['consultant', 'kpis'], queryFn: fetchConsultantKpis });
  const clientsQuery = useQuery({
    queryKey: ['consultant', 'clients', plan, status, page],
    queryFn: () =>
      fetchConsultantClients({
        plan: plan !== 'all' ? plan : undefined,
        status: status !== 'all' ? status : undefined,
        page,
      }),
  });

  const items = useMemo(() => {
    const all = clientsQuery.data?.items ?? [];
    const q = search.trim().toLowerCase();
    return q ? all.filter((c) => c.name.toLowerCase().includes(q)) : all;
  }, [clientsQuery.data, search]);
  const meta = clientsQuery.data?.meta;
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }),
    [i18n.language],
  );

  const kpis = kpisQuery.data;
  const KPI_CARDS = [
    { label: t('consultant.kpis.leads'), value: kpis?.leads, icon: Users },
    { label: t('consultant.kpis.active'), value: kpis?.active_engagements, icon: Briefcase },
    { label: t('consultant.kpis.avg'), value: kpis?.avg_maturity != null ? `${kpis.avg_maturity.toFixed(1)} / 5.0` : undefined, icon: TrendingUp },
    { label: t('consultant.kpis.conv'), value: kpis ? `${kpis.free_to_paid_conversion_pct}%` : undefined, icon: Zap },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            Consola Multi-Tenant de Consultoría
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {t('consultant.title')}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {t('consultant.sub')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((k) => {
          const Icon = k.icon;
          return (
            <SpotlightCard key={k.label} className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold">{k.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              {kpisQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-extrabold tracking-tight text-foreground">{k.value ?? '—'}</p>
              )}
            </SpotlightCard>
          );
        })}
      </div>

      {/* Toolbar & Filters */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Portafolio de Clientes</h2>
            <Badge variant="secondary" className="text-xs font-semibold">
              {items.length}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-44 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('consultant.searchPh')}
                className="pl-8 h-8 text-xs rounded-lg"
                aria-label={t('consultant.searchPh')}
              />
            </div>
            <Select
              value={plan}
              onValueChange={(v) => {
                setPlan(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-32 rounded-lg" aria-label={t('consultant.allPlans')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('consultant.allPlans')}</SelectItem>
                <SelectItem value="free">{t('consultant.plans.free')}</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-36 rounded-lg" aria-label={t('consultant.allStatuses')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('consultant.allStatuses')}</SelectItem>
                <SelectItem value="lead">{t('consultant.statuses.lead')}</SelectItem>
                <SelectItem value="in_progress">{t('consultant.statuses.inprog')}</SelectItem>
                <SelectItem value="completed">{t('consultant.statuses.done')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clients Table */}
        {clientsQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Briefcase className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-bold">{t('consultant.noClients')}</EmptyTitle>
              <EmptyDescription className="text-xs">{t('consultant.empty')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">{t('consultant.th.client')}</TableHead>
                  <TableHead className="font-bold">{t('consultant.th.plan')}</TableHead>
                  <TableHead className="font-bold">{t('consultant.th.progress')}</TableHead>
                  <TableHead className="font-bold">{t('consultant.th.score')}</TableHead>
                  <TableHead className="font-bold">{t('consultant.th.status')}</TableHead>
                  <TableHead className="font-bold">{t('consultant.th.last')}</TableHead>
                  <TableHead className="text-right font-bold" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.client_id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-semibold text-foreground">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.sector ?? '—'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.plan === 'pro' ? 'default' : 'outline'}
                        className={c.plan === 'pro' ? 'brand-gradient text-white border-0 text-[10px]' : 'text-[10px]'}
                      >
                        {c.plan === 'pro' ? 'Pro' : t('consultant.plans.free')}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={c.progress} className="h-1.5 w-20" />
                        <span className="text-[11px] font-semibold text-muted-foreground">{c.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{c.maturity != null ? c.maturity.toFixed(1) : '—'}</TableCell>
                    <TableCell>
                      <ClientStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {c.last_activity ? dateFmt.format(new Date(c.last_activity)) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs rounded-lg text-primary hover:bg-primary/10 cursor-pointer">
                        <Link to={`/consultant/clients/${c.client_id}`}>
                          {t('consultant.viewDetail')} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">
              {t('common.pageInfo', { page: meta.page, pages: meta.total_pages })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-xs rounded-lg h-7">
                {t('common.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs rounded-lg h-7"
              >
                {t('common.nextPage')}
              </Button>
            </div>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
