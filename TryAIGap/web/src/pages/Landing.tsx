import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight, Award, ChevronRight, Cpu, Globe, Lock, Menu, Scale, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Marquee } from '@/components/ui/marquee';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
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

          {/* Center: Navigation Links (Desktop) */}
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
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button asChild size="sm" variant="ghost" className="text-xs font-semibold h-8 px-2.5">
                <Link to="/login">{t('landing.navLogin')}</Link>
              </Button>
            </div>
            <Button asChild size="sm" className="brand-gradient border-0 text-white shadow-xs text-xs font-semibold h-8 px-3.5 rounded-full">
              <Link to="/start">{t('landing.ctaPrimary')}</Link>
            </Button>
            {/* Hamburger Button for Mobile / Tablet */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden h-8 w-8 rounded-full text-foreground hover:bg-muted/60"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </motion.header>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-20 inset-x-4 max-w-md mx-auto rounded-3xl border border-border/80 bg-background/95 p-5 shadow-2xl backdrop-blur-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                  {t('landing.eyebrow')}
                </p>
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <span>{t(item.labelKey)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                    </a>
                  );
                })}
              </div>

              {/* Preferences & Quick Actions */}
              <div className="pt-2 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-semibold text-muted-foreground">Configuración</span>
                  <div className="flex items-center gap-1.5">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button asChild variant="outline" className="w-full text-xs font-semibold rounded-xl h-9" onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/login">{t('landing.navLogin')}</Link>
                  </Button>
                  <Button asChild className="w-full brand-gradient border-0 text-white text-xs font-semibold rounded-xl h-9 shadow-xs" onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/start">{t('landing.ctaPrimary')}</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

            {/* Compliance & Trust Frameworks (Infinite Marquee) */}
            <motion.div variants={itemFadeUp} className="mt-12 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-center">
                {t('landing.trustLabel')}
              </p>
              <div className="relative flex w-full max-w-4xl mx-auto flex-col items-center justify-center overflow-hidden py-1">
                <Marquee pauseOnHover className="[--duration:28s] py-1">
                  {[
                    { name: 'EU AI Act', label: 'Regulation-Ready', icon: Scale },
                    { name: 'ISO/IEC 42001', label: 'AI Management', icon: Award },
                    { name: 'NIST AI RMF', label: 'Risk Framework', icon: ShieldCheck },
                    { name: 'UK GDPR', label: 'Data Privacy', icon: Lock },
                    { name: 'OECD AI', label: 'Ethics Principles', icon: Globe },
                    { name: 'IEEE 7000', label: 'Ethical Design', icon: Cpu },
                  ].map((fw) => {
                    const Icon = fw.icon;
                    return (
                      <div
                        key={fw.name}
                        className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-1.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-xs transition-all hover:border-primary/50 hover:bg-card hover:shadow-xs cursor-default shrink-0 mx-1"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="font-bold text-foreground">{fw.name}</span>
                        <span className="text-[11px] text-muted-foreground border-l border-border/80 pl-2">
                          {fw.label}
                        </span>
                      </div>
                    );
                  })}
                </Marquee>
                {/* Edge fade masks */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background/90 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background/90 to-transparent" />
              </div>
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
            <p className="mx-auto mt-2 max-w-xl text-white/85 text-sm sm:text-base leading-relaxed px-2">{t('landing.finalSub')}</p>
            <div className="mt-6 flex justify-center px-2">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-auto min-h-12 py-3 px-6 rounded-full shadow-lg hover:opacity-95 max-w-full sm:max-w-md w-full sm:w-auto text-xs sm:text-sm font-semibold text-center whitespace-normal leading-snug"
              >
                <Link to="/start" className="inline-flex items-center justify-center gap-2 w-full text-center">
                  <span>{t('landing.finalCta')}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            </div>
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