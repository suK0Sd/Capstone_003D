import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Home,
  ReceiptText,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { fetchPayment } from '@/api';
import { PAYMENT_SESSION_KEYS, pollPaymentStatus } from '@/lib/paymentFlow';
import { formatMoney } from '@/lib/quote';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useAssessment } from '@/store/assessmentStore';
import { useAuthStore } from '@/store/authStore';

type PageState = 'checking' | 'succeeded' | 'failed' | 'missing';

/** /payment/:status — success / cancel landing after the (mock) checkout. */
export default function PaymentResult() {
  const { t, i18n } = useTranslation();
  const { status } = useParams<{ status: string }>();
  const [params] = useSearchParams();
  const { reload } = useAssessment();
  const hydrate = useAuthStore((s) => s.hydrate);

  const [state, setState] = useState<PageState>(status === 'cancel' ? 'failed' : 'checking');
  const [amount, setAmount] = useState<string | null>(null);

  const canceledByUser = status === 'cancel' && params.get('reason') !== 'failed';
  const paymentId = sessionStorage.getItem(PAYMENT_SESSION_KEYS.paymentId);

  useEffect(() => {
    if (status !== 'success') return;
    if (!paymentId) {
      setState('missing');
      return;
    }
    let cancelled = false;
    void pollPaymentStatus(
      () => fetchPayment(paymentId).then((p) => {
        if (!cancelled) setAmount(formatMoney(p.amount, p.currency, i18n.language));
        return p.status;
      }),
      { maxAttempts: 8, intervalMs: 1200 },
    ).then(async (final) => {
      if (cancelled) return;
      setState(final === 'succeeded' ? 'succeeded' : 'failed');
      if (final === 'succeeded') {
        // Plan upgrade: refresh the session profile + assessment (plan → pro).
        await hydrate().catch(() => undefined);
        await reload().catch(() => null);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentId]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <SpotlightCard className="rounded-2xl border border-primary/40 bg-card/95 p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl text-center">
        {/* ESTADO 1: VERIFICANDO TRANSACCIÓN */}
        {status === 'success' && state === 'checking' && (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <Spinner className="h-12 w-12 text-primary animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('payment.successChecking')}</h2>
              <p className="text-xs text-muted-foreground mt-1">Confirmando recepción y activando funciones Pro en tu organización...</p>
            </div>
          </div>
        )}

        {/* ESTADO 2: PAGO EXITOSO Y PLAN ACTIVADO */}
        {status === 'success' && state === 'succeeded' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient text-white shadow-xl ring-8 ring-primary/10">
                <CheckCircle2 className="h-9 w-9" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                <Crown className="h-3.5 w-3.5" /> Plan Pro Enterprise Activado
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {t('payment.successTitle')}
              </h1>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {t('payment.successSub')}
              </p>
            </div>

            {amount && (
              <div className="rounded-xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs text-muted-foreground">Monto total procesado</p>
                <p className="text-2xl font-extrabold text-foreground mt-0.5">{amount}</p>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <Button asChild size="lg" className="brand-gradient text-white font-bold text-xs h-11 rounded-xl shadow-lg cursor-pointer">
                <Link to="/areas">
                  Comenzar Cuestionarios de Áreas <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs h-10 rounded-xl cursor-pointer">
                <Link to="/dashboard">
                  <Home className="h-3.5 w-3.5 mr-1.5" /> {t('nav.home')}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* ESTADO 3: PAGO FALLIDO */}
        {status === 'success' && state === 'failed' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive shadow-xl ring-8 ring-destructive/10">
                <XCircle className="h-9 w-9" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">{t('payment.failedTitle')}</h2>
              <p className="text-xs text-muted-foreground">{t('payment.failedDesc')}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="brand-gradient text-white font-bold text-xs h-10 rounded-xl cursor-pointer">
                <Link to="/estimator">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reintentar cotización
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* ESTADO 4: PAGO CANCELADO O REVERSIÓN */}
        {status === 'cancel' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm">
                <XCircle className="h-9 w-9" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                {canceledByUser ? t('payment.cancelTitle') : t('payment.failedTitle')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {canceledByUser ? t('payment.cancelDesc') : t('payment.failedDesc')}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="brand-gradient text-white font-bold text-xs h-10 rounded-xl cursor-pointer">
                <Link to="/estimator">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Volver al estimador
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-xs h-9 rounded-xl text-muted-foreground cursor-pointer">
                <Link to="/dashboard">{t('nav.home')}</Link>
              </Button>
            </div>
          </div>
        )}

        {/* ESTADO 5: PAGO NO ENCONTRADO */}
        {status === 'success' && state === 'missing' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <ReceiptText className="h-14 w-14 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">{t('payment.missingPayment')}</h2>
              <p className="text-xs text-muted-foreground">No encontramos una sesión de pago activa en este navegador.</p>
            </div>
            <Button asChild className="brand-gradient text-white font-bold text-xs h-10 rounded-xl cursor-pointer">
              <Link to="/estimator">Ir al estimador</Link>
            </Button>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
