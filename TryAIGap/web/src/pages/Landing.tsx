import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight, Award, Globe, Lock, Scale, ShieldCheck } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { LandingInteractiveRadar } from '@/components/LandingInteractiveRadar';
import { LandingComparison } from '@/components/LandingComparison';
import { LandingModuleDeliverables } from '@/components/LandingModuleDeliverables';
import { LandingHowItWorks } from '@/components/LandingHowItWorks';
import { LandingFaq } from '@/components/LandingFaq';

interface LandingStat {
  v: string;
  l: string;
}

interface FooterLinkItem {
  label: string;
  href?: string;
  to?: string;
  external?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemFadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const badgeCascade: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const gridReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.1,
    },
  },
};

const NAV_ITEMS = [
  { id: 'how-it-works', labelKey: 'landing.navLinks.howItWorks' },
  { id: 'simulator', labelKey: 'landing.navLinks.simulator' },
  { id: 'comparison', labelKey: 'landing.navLinks.comparison' },
  { id: 'deliverables', labelKey: 'landing.navLinks.deliverables' },
  { id: 'faq', labelKey: 'landing.navLinks.faq' },
];

/** Public landing: complete enterprise architecture with adaptive navbar, how it works, simulator, comparison, deliverables and FAQ. */
export default function Landing() {
  const { t } = useTranslation();
  const stats = t('landing.stats', { returnObjects: true }) as LandingStat[];
  const [activeSection, setActiveSection] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 25);

      // Section scrollspy tracking
      const sections = NAV_ITEMS.map((item) => document.getElementById(item.id));
      const scrollPosition = scrollY + 220;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(NAV_ITEMS[i].id);
          return;
        }
      }
      if (scrollY < 300) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative">
      {/* Adaptive Morphing Header */}
      <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none transition-all duration-300">
        <motion.header
          layout
          initial={false}
          animate={{
            y: isScrolled ? 12 : 0,
            width: isScrolled ? 'min(94%, 64rem)' : '100%',
            borderRadius: isScrolled ? '9999px' : '0px',
            height: isScrolled ? '3.5rem' : '4rem',
            paddingLeft: isScrolled ? '1rem' : '1.5rem',
            paddingRight: isScrolled ? '1rem' : '1.5rem',
          }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={`pointer-events-auto flex items-center justify-between transition-colors duration-300 ${
            isScrolled
              ? 'border border-border/80 bg-background/85 shadow-lg shadow-black/5 dark:shadow-black/25 backdrop-blur-xl'
              : 'border-b border-border/40 bg-background/75 backdrop-blur-md'
          }`}
        >
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <button
              onClick={scrollToTop}
              className="flex items-center text-left cursor-pointer focus-visible:outline-none transition-transform hover:scale-[1.02]"
              aria-label="TryAIGap Home"
            >
              <BrandLogo compact />
            </button>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {t(item.labelKey)}
                </a>
              );
            })}
          </nav>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex text-xs font-semibold h-8 px-2.5">
              <Link to="/login">{t('landing.navLogin')}</Link>
            </Button>
            <Button asChild size="sm" className="brand-gradient border-0 text-white shadow-xs text-xs font-semibold h-8 px-3.5 rounded-full">
              <Link to="/start">{t('landing.ctaPrimary')}</Link>
            </Button>
          </div>
        </motion.header>
      </div>

      {/* Main Content Landmark with Top Spacer */}
      <main className="flex-1 pt-16">
        {/* 1. Hero with Staggered Entrance */}
        <section className="brand-gradient-soft relative overflow-hidden">
          {/* Malla de puntos decorativa (Dot Grid — estilo Linear/Supabase) */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.55) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
            }}
            aria-hidden="true"
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative mx-auto max-w-5xl px-4 py-16 text-center md:py-24"
          >
            <motion.p
              variants={itemFadeUp}
              className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
            >
              {t('landing.eyebrow')}
            </motion.p>
            <motion.h1
              variants={itemFadeUp}
              className="text-4xl font-extrabold tracking-tight md:text-6xl"
            >
              {t('landing.h1Pre')}{' '}
              <span className="text-brand-gradient">{t('landing.h1Em')}</span>
            </motion.h1>
            <motion.p
              variants={itemFadeUp}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            >
              {t('landing.sub')}
            </motion.p>
            <motion.div
              variants={itemFadeUp}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="brand-gradient border-0 text-white shadow-md hover:opacity-95 rounded-full px-6">
                <Link to="/start">
                  {t('landing.ctaPrimary')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/80 rounded-full px-6">
                <Link to="/login">{t('landing.ctaSecondary')}</Link>
              </Button>
            </motion.div>
            <motion.p variants={itemFadeUp} className="mt-3 text-xs text-muted-foreground">
              {t('landing.ctaNote')}
            </motion.p>

            {/* Compliance & Trust Frameworks */}
            <motion.div variants={itemFadeUp} className="mt-12 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t('landing.trustLabel')}
              </p>
              <motion.div
                variants={gridReveal}
                className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto"
              >
                {[
                  { name: 'EU AI Act', label: 'Regulation-Ready', icon: Scale },
                  { name: 'ISO/IEC 42001', label: 'AI Management', icon: Award },
                  { name: 'NIST AI RMF', label: 'Risk Framework', icon: ShieldCheck },
                  { name: 'UK GDPR', label: 'Data Privacy', icon: Lock },
                  { name: 'OECD AI', label: 'Ethics Principles', icon: Globe },
                ].map((fw) => {
                  const Icon = fw.icon;
                  return (
                    <motion.div
                      key={fw.name}
                      variants={badgeCascade}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-foreground">{fw.name}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">· {fw.label}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. How it Works in 3 Steps */}
        <section id="how-it-works" className="scroll-mt-24">
          <LandingHowItWorks />
        </section>

        {/* 3. Interactive Simulator / Demo */}
        <section id="simulator" className="scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <LandingInteractiveRadar />
          </motion.div>
        </section>

        {/* 4. Impact Comparison ("Sin Método vs Con TryAIGap") */}
        <section id="comparison" className="scroll-mt-24">
          <LandingComparison />
        </section>

        {/* 5. Stats with Staggered Scroll Reveal */}
        <section id="impact" className="scroll-mt-24 bg-muted/20">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-6"
            >
              {t('landing.trustLabel')}
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={gridReveal}
              className="grid w-full gap-4 md:grid-cols-3"
            >
              {Array.isArray(stats) &&
                stats.map((s) => (
                  <motion.div key={s.v} variants={itemFadeUp} className="h-full">
                    <SpotlightCard className="flex h-full flex-col justify-between">
                      <div>
                        <p className="text-3xl font-extrabold text-brand-gradient tracking-tight">{s.v}</p>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.l}</p>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                ))}
            </motion.div>
          </div>
        </section>

        {/* 6. Interactive 7-Module Deliverables Selector */}
        <section id="deliverables" className="scroll-mt-24">
          <LandingModuleDeliverables />
        </section>

        {/* 7. Frequently Asked Questions (FAQ Accordion) */}
        <section id="faq" className="scroll-mt-24">
          <LandingFaq />
        </section>

        {/* 8. Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="brand-gradient"
        >
          <div className="mx-auto max-w-5xl px-4 py-16 text-center text-white">
            <h2 className="text-2xl font-bold md:text-3xl">{t('landing.finalTitle')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-white/85">{t('landing.finalSub')}</p>
            <Button asChild size="lg" variant="secondary" className="mt-6 shadow-lg hover:opacity-95 rounded-full px-6">
              <Link to="/start">
                {t('landing.finalCta')} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.section>
      </main>

      <footer className="border-t bg-background/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-5xl px-4 py-12"
        >
          {/* Grilla de 4 columnas */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-10">
            {/* Columna 1: Metodología */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
                {t('landing.footerCorp.colMethodTitle')}
              </h4>
              <ul className="space-y-2">
                {((t('landing.footerCorp.methodLinks', { returnObjects: true }) as FooterLinkItem[]) || []).map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group py-0.5"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Columna 2: Cumplimiento */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
                {t('landing.footerCorp.colComplianceTitle')}
              </h4>
              <ul className="space-y-2">
                {((t('landing.footerCorp.complianceLinks', { returnObjects: true }) as FooterLinkItem[]) || []).map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group py-0.5"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.label}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Columna 3: Plataforma */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
                {t('landing.footerCorp.colPlatformTitle')}
              </h4>
              <ul className="space-y-2">
                {((t('landing.footerCorp.platformLinks', { returnObjects: true }) as FooterLinkItem[]) || []).map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group py-0.5"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.label}</span>
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group py-0.5"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.label}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Columna 4: Legal & Soporte */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
                {t('landing.footerCorp.colLegalTitle')}
              </h4>
              <ul className="space-y-2">
                {((t('landing.footerCorp.legalLinks', { returnObjects: true }) as FooterLinkItem[]) || []).map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group py-0.5"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.label}</span>
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group py-0.5"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">{item.label}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Línea divisoria + brand bottom */}
          <div className="border-t border-border/50 pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo compact />
            </div>
            <div className="text-center sm:text-right space-y-0.5">
              <p className="text-[11px] text-muted-foreground">{t('landing.footerCorp.tagline')}</p>
              <p className="text-[11px] text-muted-foreground">{t('landing.footerCorp.copy')}</p>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}