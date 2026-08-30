import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Printer, 
  Scale, 
  ShieldCheck, 
  BookOpen 
} from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';

interface TermsSection {
  h: string;
  p: string;
}

/** Public Terms & Conditions page with navigable TOC and enterprise styling. */
export default function Terms() {
  const { t } = useTranslation();
  const location = useLocation();
  const sections = (t('terms.sections', { returnObjects: true }) as TermsSection[]) || [];
  const backTo = (location.state as { from?: string } | null)?.from ?? '/start';
  const [activeSection, setActiveSection] = useState<number | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const scrollToClause = (index: number) => {
    setActiveSection(index);
    const el = document.getElementById(`clause-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Background Dot Grid + Glow Decorativo */}
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

      {/* Header Corporativo */}
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 md:px-8 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <BrandLogo compact />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs h-8">
            <Link to={backTo}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t('leadgate.back')}
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
        <div className="grid w-full gap-8 lg:grid-cols-12 items-start">
          {/* Left Sidebar (Sticky Table of Contents) */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4"
          >
            <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-lg backdrop-blur-md space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary mb-2">
                  <Scale className="h-3.5 w-3.5" />
                  {t('terms.badge')}
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  {t('terms.tocTitle')}
                </h3>
              </div>

              <nav className="space-y-1">
                {sections.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToClause(idx)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      activeSection === idx
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{s.h}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-3 border-t border-border/60 space-y-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 justify-start cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {t('terms.print')}
                </Button>
                <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {t('terms.govBadge')}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Right Main Column (Legal Document Content) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="lg:col-span-8"
          >
            <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-10 shadow-xl backdrop-blur-xl">
              {/* Document Header */}
              <div className="border-b border-border/60 pb-6 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <BookOpen className="h-3.5 w-3.5" />
                    TryAIGap Enterprise Legal
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {t('terms.title')}
                </h1>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('terms.lastUpdated')}
                </p>
                <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t('terms.intro')}
                </p>
              </div>

              {/* Numbered Sections */}
              <div className="space-y-8">
                {sections.map((s, idx) => (
                  <section
                    key={s.h}
                    id={`clause-${idx}`}
                    className="scroll-mt-24 rounded-xl p-4 transition-colors hover:bg-muted/30 border border-transparent hover:border-border/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-2 flex-1">
                        <h2 className="text-sm sm:text-base font-bold text-foreground">
                          {s.h}
                        </h2>
                        <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                          {s.p}
                        </p>
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  to={backTo}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> {t('leadgate.back')}
                </Link>

                <Button asChild size="sm" className="brand-gradient text-white text-xs h-9 px-4 rounded-lg">
                  <Link to="/start">
                    {t('terms.backToStart')}
                  </Link>
                </Button>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

