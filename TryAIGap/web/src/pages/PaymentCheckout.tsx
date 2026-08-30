import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { fetchPayment, postMockStripeWebhook } from '@/api';
import { formatMoney } from '@/lib/quote';
import { pollPaymentStatus } from '@/lib/paymentFlow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { SpotlightCard } from '@/components/ui/spotlight-card';

/**
 * Simulated Stripe checkout (dev only): the backend's mock session URL lands
 * here. "Pay" fires the dev webhook to mark the payment succeeded, polls
 * GET /payments/{id}, then routes to /payment/success or /payment/cancel.
 */
export default function PaymentCheckout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('session') ?? '';
  const paymentId = params.get('payment_id') ?? '';

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(false);

  const paymentQuery = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => fetchPayment(paymentId),
    enabled: !!paymentId,
  });

  async function handlePay() {
    setProcessing(true);
    setError(false);
    try {
      await postMockStripeWebhook(paymentId, sessionId);
      const status = await pollPaymentStatus(
        () => fetchPayment(paymentId).then((p) => p.status),
        { maxAttempts: 6, intervalMs: 1000 },
      );
      navigate(status === 'succeeded' ? '/payment/success' : '/payment/cancel?reason=failed', {
        replace: true,
      });
    } catch {
      setError(true);
      setProcessing(false);
    }
  }

  const payment = paymentQuery.data;
  const amount = payment ? formatMoney(payment.amount, payment.currency, i18n.language) : '…';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <SpotlightCard className="rounded-2xl border border-primary/40 bg-card/95 p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Header con Badge de Pasarela */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-md">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">{t('payment.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('payment.simTitle')}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-bold">
            {t('payment.simBadge')}
          </Badge>
        </div>

        {/* Resumen del Monto a Pagar */}
        <div className="rounded-xl border border-border/70 bg-card/50 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t('payment.orderSummary')}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">{t('estimator2.cartTotal')}</span>
            <span className="text-2xl font-extrabold text-foreground tracking-tight">{amount}</span>
          </div>
        </div>

        {/* Simulación de Tarjeta de Crédito (Mock) */}
        <fieldset className="space-y-4" disabled={processing}>
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            {t('payment.cardSection')}
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="cc-name" className="text-xs font-semibold">{t('payment.cardHolder')}</Label>
            <Input id="cc-name" defaultValue="Fabrizio Martínez" autoComplete="cc-name" className="h-9 text-xs rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cc-number" className="text-xs font-semibold">{t('payment.cardNumber')}</Label>
            <div className="relative">
              <Input id="cc-number" defaultValue="4242 •••• •••• 4242" inputMode="numeric" className="h-9 text-xs rounded-xl font-mono" />
              <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-exp" className="text-xs font-semibold">{t('payment.cardExp')}</Label>
              <Input id="cc-exp" defaultValue="12/28" className="h-9 text-xs rounded-xl font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-cvc" className="text-xs font-semibold">{t('payment.cardCvc')}</Label>
              <Input id="cc-cvc" defaultValue="123" inputMode="numeric" className="h-9 text-xs rounded-xl font-mono" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{t('payment.stripeNote')}</span>
          </div>
        </fieldset>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{t('estimator2.checkoutError')}</AlertDescription>
          </Alert>
        )}

        {processing ? (
          <div className="flex flex-col items-center gap-3 py-6 rounded-xl border border-primary/20 bg-primary/5" role="status">
            <Spinner className="h-8 w-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-bold text-xs sm:text-sm text-foreground">{t('payment.processing')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('payment.processingDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              className="brand-gradient w-full text-white font-bold text-xs h-11 rounded-xl shadow-lg cursor-pointer"
              onClick={() => void handlePay()}
              disabled={!paymentId || paymentQuery.isLoading}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              {t('payment.simPayCta', { amount })}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/payment/cancel', { replace: true })}
              className="text-xs h-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" /> {t('payment.simCancel')}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center pt-2 border-t border-border/50">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>{t('payment.securedBy')}</span>
        </div>
      </SpotlightCard>
    </div>
  );
}
