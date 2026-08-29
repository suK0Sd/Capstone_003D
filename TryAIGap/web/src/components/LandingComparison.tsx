import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export function LandingComparison() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Zap className="h-3.5 w-3.5" />
          {t('landing.comparison.badge')}
        </span>
        <h2 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground">
          {t('landing.comparison.title')}
        </h2>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          {t('landing.comparison.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* Left Column: Without Method (Status Quo) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55 }}
        >
          <div className="h-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-destructive/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base md:text-lg">
                      {t('landing.comparison.withoutTitle')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('landing.comparison.withoutSub')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-destructive bg-destructive/15 px-2.5 py-1 rounded-md">
                  {t('landing.comparison.withoutTag')}
                </span>
              </div>

              <ul className="space-y-3.5 pt-2">
                {[1, 2, 3, 4].map((idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>{t(`landing.comparison.withoutItems.item${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-destructive/15 flex items-center gap-2 text-xs text-destructive font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t('landing.comparison.withoutFootnote')}</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: With TryAIGap Method */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55 }}
        >
          <SpotlightCard
            spotlightColor="rgba(37, 99, 235, 0.15)"
            borderGlowColor="rgba(6, 182, 212, 0.5)"
            className="h-full rounded-2xl border-primary/40 bg-card p-6 md:p-8 flex flex-col justify-between shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white shadow-sm">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base md:text-lg">
                      {t('landing.comparison.withTitle')}
                    </h3>
                    <p className="text-xs text-primary font-medium">
                      {t('landing.comparison.withSub')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-md">
                  {t('landing.comparison.withTag')}
                </span>
              </div>

              <ul className="space-y-3.5 pt-2">
                {[1, 2, 3, 4].map((idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{t(`landing.comparison.withItems.item${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-primary/15 flex items-center gap-2 text-xs text-primary font-semibold">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>{t('landing.comparison.withFootnote')}</span>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
}