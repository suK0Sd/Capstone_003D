import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Cpu, FileText, ArrowRight } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const STEPS = [
  {
    num: '01',
    icon: ClipboardCheck,
    titleKey: 'landing.howItWorks.step1Title',
    descKey: 'landing.howItWorks.step1Desc',
    tagKey: 'landing.howItWorks.step1Tag',
  },
  {
    num: '02',
    icon: Cpu,
    titleKey: 'landing.howItWorks.step2Title',
    descKey: 'landing.howItWorks.step2Desc',
    tagKey: 'landing.howItWorks.step2Tag',
  },
  {
    num: '03',
    icon: FileText,
    titleKey: 'landing.howItWorks.step3Title',
    descKey: 'landing.howItWorks.step3Desc',
    tagKey: 'landing.howItWorks.step3Tag',
  },
];

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function LandingHowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      {/* Encabezado con entrada suave */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          {t('landing.howItWorks.badge')}
        </span>
        <h2 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground">
          {t('landing.howItWorks.title')}
        </h2>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          {t('landing.howItWorks.subtitle')}
        </p>
      </motion.div>

      <motion.div
        variants={gridVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid gap-6 md:grid-cols-3 relative"
      >
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div key={step.num} variants={cardVariants} className="h-full relative">
              <SpotlightCard className="h-full rounded-2xl border-border/80 bg-card p-6 flex flex-col justify-between shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-brand-gradient tracking-tight">
                      {step.num}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                      {t(step.tagKey)}
                    </span>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient text-white shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-base font-bold text-foreground tracking-tight">
                    {t(step.titleKey)}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-muted-foreground shadow-xs">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </SpotlightCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}