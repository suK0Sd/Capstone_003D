import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BadgePercent,
  Briefcase,
  Calculator,
  Check,
  CheckCircle2,
  Headphones,
  Layers,
  LineChart,
  Lock,
  Minus,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  createCheckoutSession,
  createQuote,
  fetchAreas,
  fetchPricing,
  validateDistributorCode,
} from '@/api';
import {
  computeQuote,
  formatMoney,
  hasHumanAccompaniment,
  MAX_SESSIONS_PER_AREA,
  type QuoteAreaConfig,
} from '@/lib/quote';
import {
  isMockCheckoutUrl,
  newIdempotencyKey,
  parseMockSessionId,
  PAYMENT_SESSION_KEYS,
  paymentIdFromMockSession,
} from '@/lib/paymentFlow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Switch } from '@/components/ui/switch';
import { useAssessment } from '@/store/assessmentStore';
import { cn } from '@/lib/utils';

const FALLBACK_AREA_KEYS = [
  'ventas',
  'marketing',
  'servicio',
  'finanzas',
  'rrhh',
  'operaciones',
  'legal',
] as const;

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

/** Estimator: interactive quote builder → persisted quote → (mock) checkout. */
export default function Estimator() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { assessment } = useAssessment();

  const [configs, setConfigs] = useState<Record<string, QuoteAreaConfig>>({});
  const [finalReport, setFinalReport] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<{ code: string; pct: number } | null>(null);
  const [codeError, setCodeError] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const idemKey = useRef(newIdempotencyKey());

  const pricingQuery = useQuery({ queryKey: ['pricing'], queryFn: fetchPricing });
  const areasQuery = useQuery({
    queryKey: ['areas', assessment?.id],
    queryFn: () => fetchAreas(assessment!.id),
    enabled: !!assessment,
  });

  interface AreaOption {
    key: string;
    name: string;
    icon?: string;
  }
  const areaOptions: AreaOption[] = useMemo(() => {
    const fromApi = areasQuery.data?.items;
    if (fromApi && fromApi.length > 0) {
      return fromApi.map((a) => ({ key: a.area_key, name: a.name }));
    }
    const names = t('areaList', { returnObjects: true }) as Record<string, { name: string; icon: string }>;
    return FALLBACK_AREA_KEYS.map((key) => ({
      key,
      name: names[key]?.name ?? key,
      icon: names[key]?.icon,
    }));
  }, [areasQuery.data, t]);

  const cfgFor = (key: string): QuoteAreaConfig =>
    configs[key] ?? { area_key: key, active: false, review: false, sessions: 0 };

  function patchArea(key: string, patch: Partial<QuoteAreaConfig>) {
    setConfigs((prev) => ({ ...prev, [key]: { ...cfgFor(key), ...patch } }));
  }

  const pricing = pricingQuery.data;
  const areaList = areaOptions.map((a) => cfgFor(a.key));
  const quote = pricing
    ? computeQuote(pricing, areaList, finalReport, appliedCode?.pct ?? 0)
    : null;
  const guided = hasHumanAccompaniment(areaList, finalReport);
  const money = (n: number) => formatMoney(n, pricing?.currency ?? 'USD', i18n.language);
  const activeCount = areaList.filter((a) => a.active).length;

  const codeMutation = useMutation({
    mutationFn: (code: string) => validateDistributorCode(code),
    onSuccess: (res, code) => {
      setAppliedCode({ code, pct: res.discount_pct });
      setCodeError(false);
    },
    onError: () => {
      setAppliedCode(null);
      setCodeError(true);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const quoteRes = await createQuote({
        areas: areaList.filter((a) => a.active || a.review || a.sessions > 0),
        final_report: finalReport,
        distributor_code: appliedCode?.code ?? null,
      });
      const origin = window.location.origin;
      const session = await createCheckoutSession(
        {
          quote_id: quoteRes.quote_id,
          success_url: `${origin}/payment/success`,
          cancel_url: `${origin}/payment/cancel`,
        },
        idemKey.current,
      );
      return session;
    },
    onSuccess: (session) => {
      idemKey.current = newIdempotencyKey();
      sessionStorage.setItem(PAYMENT_SESSION_KEYS.paymentId, session.payment_id);
      sessionStorage.setItem(PAYMENT_SESSION_KEYS.providerRef, `cs_mock_${session.payment_id}`);
      if (isMockCheckoutUrl(session.checkout_url)) {
        const mockId = parseMockSessionId(session.checkout_url)!;
        const pid = paymentIdFromMockSession(mockId) ?? session.payment_id;
        sessionStorage.setItem(PAYMENT_SESSION_KEYS.providerRef, mockId);
        navigate(`/payment/checkout?session=${encodeURIComponent(mockId)}&payment_id=${encodeURIComponent(pid)}`);
      } else {
        window.location.assign(session.checkout_url);
      }
    },
    onError: () => setCheckoutError(true),
  });

  const loading = pricingQuery.isLoading || (!!assessment && areasQuery.isLoading);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header con Perfil de Modalidad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Calculator className="h-3 w-3" />
              Módulo 3: Estimador Estratégico
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('estimator2.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('estimator2.sub')}
          </p>
        </div>

        <Badge
          variant={guided ? 'default' : 'secondary'}
          className={cn(
            'gap-1.5 px-3 py-1.5 text-xs font-semibold self-start sm:self-auto rounded-xl',
            guided && 'brand-gradient text-white border-0',
          )}
        >
          {guided ? <UserCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          {guided ? t('estimator2.profileGuided') : t('estimator2.profileSelf')}
        </Badge>
      </div>

      {!assessment && (
        <SpotlightCard className="rounded-2xl border border-primary/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-foreground">{t('estimator2.needAssessment')}</p>
              <p className="text-xs text-muted-foreground mt-1">Regístrate para vincular tu cotización a tu empresa.</p>
            </div>
            <Button asChild size="sm" className="brand-gradient text-white rounded-xl text-xs h-9">
              <Link to="/onboarding">{t('common.startDiagnostic')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {checkoutError && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertDescription>{t('estimator2.checkoutError')}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Columna Izquierda: Configuración de Paquetes y Áreas */}
        <div className="space-y-6">
          {/* Paquete Base Incluido */}
          <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">{t('estimator2.baseTitle')}</h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {t('estimator2.baseDesc')}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Módulo 1 Madurez 5D
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Radar Pentagonal
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">
                  {t('estimator2.baseIncluded')}
                </Badge>
                <p className="text-lg font-extrabold text-foreground mt-2">
                  {pricing ? money(pricing.base_price) : '—'}
                </p>
              </div>
            </div>
          </SpotlightCard>

          {/* Configuración de Áreas Funcionales */}
          <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">{t('estimator2.areasTitle')}</h2>
                <p className="text-xs text-muted-foreground">{t('estimator2.areasSub')}</p>
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                {t('estimator2.activeCount', { n: activeCount })}
              </Badge>
            </div>

            <div className="space-y-3 pt-1">
              {loading ? (
                [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
              ) : (
                areaOptions.map((area) => {
                  const cfg = cfgFor(area.key);
                  const Icon = getAreaLucideIcon(area.key);

                  return (
                    <div
                      key={area.key}
                      className={cn(
                        'rounded-xl border p-4 transition-all',
                        cfg.active
                          ? 'border-primary/40 bg-primary/5 shadow-xs'
                          : 'border-border/60 bg-card/40 opacity-80',
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
                            cfg.active ? 'brand-gradient text-white' : 'bg-muted text-muted-foreground',
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-foreground">{area.name}</span>
                            <p className="text-[11px] text-muted-foreground">16 preguntas · Casos de uso</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`active-${area.key}`}
                            className="text-xs font-semibold text-muted-foreground cursor-pointer"
                          >
                            {t('estimator2.activate')}
                          </label>
                          <Switch
                            id={`active-${area.key}`}
                            checked={cfg.active}
                            onCheckedChange={(v) => patchArea(area.key, { active: v })}
                          />
                        </div>
                      </div>

                      {cfg.active && (
                        <div className="mt-3.5 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                          {/* Revisión 1 a 1 */}
                          <div className="flex items-start gap-2 max-w-xs">
                            <Checkbox
                              id={`review-${area.key}`}
                              checked={cfg.review}
                              onCheckedChange={(v) => patchArea(area.key, { review: v === true })}
                              className="mt-0.5"
                            />
                            <div>
                              <label htmlFor={`review-${area.key}`} className="font-semibold text-foreground cursor-pointer">
                                {t('estimator2.areaReview')}
                              </label>
                              <p className="text-[11px] text-muted-foreground">
                                {pricing ? `+${money(pricing.area_review)}` : ''} · {t('estimator2.areaReviewDesc')}
                              </p>
                            </div>
                          </div>

                          {/* Sesiones de Acompañamiento */}
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">{t('estimator2.sessionsLabel')}</span>
                            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-md cursor-pointer"
                                aria-label="−"
                                disabled={cfg.sessions <= 0}
                                onClick={() => patchArea(area.key, { sessions: cfg.sessions - 1 })}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-5 text-center text-xs font-bold text-foreground">
                                {cfg.sessions}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-md cursor-pointer"
                                aria-label="+"
                                disabled={cfg.sessions >= MAX_SESSIONS_PER_AREA}
                                onClick={() => patchArea(area.key, { sessions: cfg.sessions + 1 })}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {pricing ? `+${money(pricing.support_session)}/ses.` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </SpotlightCard>

          {/* Validación del Informe Final Ejecutivo */}
          <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-foreground">
                  {t('estimator2.finalReportTitle')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('estimator2.finalReportDesc')}
                  {pricing ? ` · +${money(pricing.final_report_validation)}` : ''}
                </p>
              </div>
              <Switch
                checked={finalReport}
                onCheckedChange={setFinalReport}
                aria-label={t('estimator2.finalReportTitle')}
              />
            </div>
          </SpotlightCard>
        </div>

        {/* Columna Derecha: Sticky Cart & Summary */}
        <div className="lg:sticky lg:top-20 h-fit space-y-4">
          <SpotlightCard className="rounded-2xl border border-primary/40 bg-card/95 p-6 shadow-xl space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-foreground">{t('estimator2.cartTitle')}</h2>
              <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10">
                Transparencia 100%
              </Badge>
            </div>

            {loading || !quote ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <div className="space-y-3 text-xs">
                {/* Desglose Base */}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('estimator2.cartBase')}</span>
                  <span className="font-semibold text-foreground">{money(pricing!.base_price)}</span>
                </div>

                {/* Reviews */}
                {quote.reviewCount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {quote.reviewCount === 1
                        ? t('estimator2.cartReviews', { n: quote.reviewCount })
                        : t('estimator2.cartReviewsPlural', { n: quote.reviewCount })}
                    </span>
                    <span className="font-semibold text-foreground">
                      {money(quote.reviewCount * pricing!.area_review)}
                    </span>
                  </div>
                )}

                {/* Sesiones */}
                {quote.sessionCount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {quote.sessionCount === 1
                        ? t('estimator2.cartSessions', { n: quote.sessionCount })
                        : t('estimator2.cartSessionsPlural', { n: quote.sessionCount })}
                    </span>
                    <span className="font-semibold text-foreground">
                      {money(quote.sessionCount * pricing!.support_session)}
                    </span>
                  </div>
                )}

                {/* Informe Final */}
                {finalReport && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('estimator2.cartFinal')}</span>
                    <span className="font-semibold text-foreground">
                      {money(pricing!.final_report_validation)}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between font-bold text-foreground text-sm">
                  <span>{t('estimator2.cartSubtotal')}</span>
                  <span>{money(quote.subtotal)}</span>
                </div>

                {/* Código de Descuento / Partner */}
                <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 mt-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <BadgePercent className="h-4 w-4 text-primary" />
                    {t('estimator2.distLabel')}
                  </p>
                  {appliedCode ? (
                    <div className="flex items-center justify-between gap-2 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-primary">
                        <Check className="h-3.5 w-3.5" />
                        {t('estimator2.distApplied', { pct: appliedCode.pct })}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAppliedCode(null);
                          setCodeInput('');
                        }}
                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        {t('estimator2.distRemove')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={codeInput}
                        onChange={(e) => {
                          setCodeInput(e.target.value);
                          setCodeError(false);
                        }}
                        placeholder={t('payment.distributorPh')}
                        aria-label={t('estimator2.distLabel')}
                        className="h-8 text-xs rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!codeInput.trim() || codeMutation.isPending}
                        onClick={() => codeMutation.mutate(codeInput.trim())}
                        className="h-8 text-xs rounded-lg px-3 cursor-pointer shrink-0"
                      >
                        {codeMutation.isPending
                          ? t('estimator2.distChecking')
                          : t('estimator2.distApply')}
                      </Button>
                    </div>
                  )}
                  {codeError && (
                    <p className="text-[11px] text-destructive font-medium">{t('estimator2.distInvalid')}</p>
                  )}
                </div>

                {quote.discount > 0 && (
                  <div className="flex justify-between font-bold text-primary text-xs">
                    <span>{t('estimator2.cartDiscount')}</span>
                    <span>−{money(quote.discount)}</span>
                  </div>
                )}

                <Separator className="my-2" />

                {/* Total Final */}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-bold text-muted-foreground">{t('estimator2.cartTotal')}</span>
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {money(quote.total)}
                  </span>
                </div>

                {/* Botón de Checkout */}
                <Button
                  type="button"
                  className="brand-gradient w-full text-white font-bold text-xs h-11 rounded-xl shadow-lg cursor-pointer mt-3"
                  disabled={checkoutMutation.isPending || !assessment}
                  onClick={() => {
                    setCheckoutError(false);
                    checkoutMutation.mutate();
                  }}
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  {checkoutMutation.isPending
                    ? t('common.loading')
                    : t('estimator2.approveCta')}
                </Button>

                <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-muted-foreground text-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t('estimator2.cartNote')}</span>
                </div>
              </div>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
