import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, type Variants } from 'motion/react';
import { 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Binary,
  BookOpen, 
  Bot,
  CheckCircle2, 
  Compass, 
  Cpu,
  Crown, 
  FileSpreadsheet, 
  GitFork, 
  Layers, 
  Map, 
  RefreshCw, 
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  Zap
} from 'lucide-react';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const DEPARTMENT_PILLS = [
  'Ventas & Comercial',
  'Marketing & Crecimiento',
  'Servicio al Cliente',
  'Finanzas & Control',
  'Personas & RRHH',
  'Operaciones & TI',
  'Legal & Cumplimiento',
];

const MODULE_KEYS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'] as const;

export function LandingModuleDeliverables() {
  const { t } = useTranslation();
  const [hoveredDept, setHoveredDept] = useState(0);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Escuchar el scroll horizontal en móvil para actualizar la píldora activa
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).offsetWidth + 14 : 320;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < MODULE_KEYS.length && newIndex !== mobileActiveIndex) {
      setMobileActiveIndex(newIndex);
    }
  };

  const scrollToModule = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const targetChild = container.children[index] as HTMLElement | undefined;
    if (targetChild) {
      targetChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setMobileActiveIndex(index);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-2xl mx-auto mb-8 md:mb-12"
      >
        <Badge variant="outline" className="mb-3 rounded-full border-primary/30 bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-widest px-3.5 py-1">
          {t('landing.eyebrow')}
        </Badge>
        <h2 className="text-2xl font-extrabold md:text-4xl tracking-tight text-foreground">
          {t('landing.deliverables.title')}
        </h2>
        <p className="mt-2.5 text-sm md:text-base text-muted-foreground leading-relaxed">
          {t('landing.deliverables.subtitle')}
        </p>
      </motion.div>

      {/* ========================================================= */}
      {/* VISTA MÓVIL: Carrusel Snap Horizontal Táctil (< 768px)    */}
      {/* ========================================================= */}
      <div className="block md:hidden">
        {/* Selector de Píldoras de Módulos */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 px-1">
          {MODULE_KEYS.map((modKey, idx) => (
            <button
              key={modKey}
              onClick={() => scrollToModule(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                mobileActiveIndex === idx
                  ? 'brand-gradient text-white shadow-xs'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {modKey.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Contenedor Deslizable Snap */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-4 pt-1 px-1 no-scrollbar touch-pan-x"
        >
          {/* Card M01 (Móvil) */}
          <div className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white">
                    <Compass className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
                    {t('landing.deliverables.items.m1.tag')}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-primary">M01</span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t('landing.deliverables.items.m1.name')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.deliverables.items.m1.desc')}
              </p>

              {/* 5D Live Bars */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                {[
                  { name: 'Datos', val: 75 },
                  { name: 'Tecnología', val: 60 },
                  { name: 'Talento', val: 50 },
                  { name: 'Procesos', val: 65 },
                ].map((dim) => (
                  <div key={dim.name} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-foreground">
                      <span>{dim.name}</span>
                      <span className="text-primary">{dim.val}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full brand-gradient" style={{ width: `${dim.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <ul className="space-y-1 pt-1">
                {[1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t(`landing.deliverables.items.m1.d${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs font-semibold text-primary flex items-center justify-between">
              <span className="truncate">{t('landing.deliverables.items.m1.format')}</span>
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
            </div>
          </div>

          {/* Card M02 (Móvil) */}
          <div className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Map className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
                    {t('landing.deliverables.items.m2.tag')}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">M02</span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t('landing.deliverables.items.m2.name')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.deliverables.items.m2.desc')}
              </p>

              {/* 2x2 Matrix Widget */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-center">
                  <div className="p-1.5 rounded-lg bg-primary/15 text-primary flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Quick Wins</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted text-muted-foreground flex items-center justify-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>Apuestas</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted text-muted-foreground flex items-center justify-center gap-1">
                    <Wrench className="h-3 w-3" />
                    <span>Tácticos</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Descartar</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-1 pt-1">
                {[1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t(`landing.deliverables.items.m2.d${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs font-semibold text-primary flex items-center justify-between">
              <span className="truncate">{t('landing.deliverables.items.m2.format')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </div>
          </div>

          {/* Card M03 (Móvil) */}
          <div className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
                    {t('landing.deliverables.items.m3.tag')}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">M03</span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t('landing.deliverables.items.m3.name')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.deliverables.items.m3.desc')}
              </p>

              {/* Horizons Timeline */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                  <span>Horizonte 1 (0-6m)</span>
                  <Badge variant="outline" className="text-[9px] py-0">Táctico</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                  <span>Horizonte 2 (6-18m)</span>
                  <Badge variant="outline" className="text-[9px] py-0 border-primary/40 text-primary">Estratégico</Badge>
                </div>
              </div>

              <ul className="space-y-1 pt-1">
                {[1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t(`landing.deliverables.items.m3.d${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs font-semibold text-primary flex items-center justify-between">
              <span className="truncate">{t('landing.deliverables.items.m3.format')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </div>
          </div>

          {/* Card M04 (Móvil) */}
          <div className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <GitFork className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
                    {t('landing.deliverables.items.m4.tag')}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">M04</span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t('landing.deliverables.items.m4.name')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.deliverables.items.m4.desc')}
              </p>

              {/* Decision Tree Steps */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-[10px] font-bold text-foreground">
                <div className="p-1 px-1.5 rounded bg-card border border-border/80 flex items-center gap-1">
                  <Binary className="h-2.5 w-2.5 text-muted-foreground" />
                  <span>Reglas</span>
                </div>
                <span>→</span>
                <div className="p-1 px-1.5 rounded bg-card border border-border/80 flex items-center gap-1">
                  <Cpu className="h-2.5 w-2.5 text-primary" />
                  <span>ML</span>
                </div>
                <span>→</span>
                <div className="p-1 px-1.5 rounded brand-gradient text-white flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>LLMs</span>
                </div>
              </div>

              <ul className="space-y-1 pt-1">
                {[1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t(`landing.deliverables.items.m4.d${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs font-semibold text-primary flex items-center justify-between">
              <span className="truncate">{t('landing.deliverables.items.m4.format')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </div>
          </div>

          {/* Card M05 (Móvil) */}
          <div className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary" className="bg-accent/15 text-accent border-accent/30 text-[10px] font-bold uppercase">
                    {t('landing.deliverables.items.m5.tag')}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-accent">M05</span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t('landing.deliverables.items.m5.name')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.deliverables.items.m5.desc')}
              </p>

              {/* Department Chips */}
              <div className="flex flex-wrap gap-1">
                {DEPARTMENT_PILLS.slice(0, 5).map((dept) => (
                  <span key={dept} className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] text-muted-foreground font-semibold">
                    {dept}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-[10px] text-primary font-bold">
                  +2 kits
                </span>
              </div>

              <ul className="space-y-1 pt-1">
                {[1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t(`landing.deliverables.items.m5.d${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs font-semibold text-accent flex items-center justify-between">
              <span className="truncate">{t('landing.deliverables.items.m5.format')}</span>
              <Bot className="h-3.5 w-3.5 shrink-0" />
            </div>
          </div>

          {/* Card M06 (Móvil) */}
          <div className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <RefreshCw className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
                    {t('landing.deliverables.items.m6.tag')}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">M06</span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t('landing.deliverables.items.m6.name')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.deliverables.items.m6.desc')}
              </p>

              {/* Quality Gates */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-primary" />
                    5 Quality Gates
                  </span>
                  <span className="text-primary font-bold">Human-in-the-Loop</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((g) => (
                    <div key={g} className="h-1.5 rounded-full bg-primary/80" />
                  ))}
                </div>
              </div>

              <ul className="space-y-1 pt-1">
                {[1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t(`landing.deliverables.items.m6.d${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs font-semibold text-primary flex items-center justify-between">
              <span className="truncate">{t('landing.deliverables.items.m6.format')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </div>
          </div>

          {/* Card M07 (Móvil) */}
          <div className="w-[86vw] max-w-[340px] shrink-0 snap-center rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white">
                    <Crown className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">
                    {t('landing.deliverables.items.m7.tag')}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-bold text-primary">M07</span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t('landing.deliverables.items.m7.name')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('landing.deliverables.items.m7.desc')}
              </p>

              {/* CoE Charter */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    Estatuto de Gobierno
                  </span>
                  <span className="text-primary">Escalamiento</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                  <span>Mejora continua y ROI cuantificable</span>
                </div>
              </div>

              <ul className="space-y-1 pt-1">
                {[1, 2].map((idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{t(`landing.deliverables.items.m7.d${idx}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs font-semibold text-primary flex items-center justify-between">
              <span className="truncate">{t('landing.deliverables.items.m7.format')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </div>
          </div>
        </div>

        {/* Indicadores de Paginación & Botones de Flecha */}
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-1">
            {MODULE_KEYS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToModule(idx)}
                aria-label={`Ir al módulo ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  mobileActiveIndex === idx ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-border/80"
              disabled={mobileActiveIndex === 0}
              onClick={() => scrollToModule(Math.max(0, mobileActiveIndex - 1))}
              aria-label="Módulo anterior"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-border/80"
              disabled={mobileActiveIndex === MODULE_KEYS.length - 1}
              onClick={() => scrollToModule(Math.min(MODULE_KEYS.length - 1, mobileActiveIndex + 1))}
              aria-label="Módulo siguiente"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA DESKTOP / TABLET: Bento Grid Simétrico (>= 768px)   */}
      {/* ========================================================= */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        className="hidden md:block"
      >
        <BentoGrid>
          {/* ROW 1: Card 1 (M1 - 2 Col Span) */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <BentoCard colSpan={2} className="relative overflow-hidden bg-gradient-to-br from-card/90 via-card/70 to-primary/5 h-full">
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl brand-gradient text-white shadow-sm">
                        <Compass className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold uppercase tracking-wider">
                        {t('landing.deliverables.items.m1.tag')}
                      </Badge>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary/80 uppercase">Módulo 01</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                    {t('landing.deliverables.items.m1.name')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {t('landing.deliverables.items.m1.desc')}
                  </p>
                </div>

                {/* Micro-Visual: 5D Live Bars Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-2xl bg-muted/40 border border-border/50">
                  {[
                    { name: 'Datos', val: 75 },
                    { name: 'Tecnología', val: 60 },
                    { name: 'Talento', val: 50 },
                    { name: 'Procesos', val: 65 },
                    { name: 'Cultura', val: 70 },
                  ].map((dim) => (
                    <div key={dim.name} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-foreground">
                        <span>{dim.name}</span>
                        <span className="text-primary">{dim.val}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full brand-gradient" style={{ width: `${dim.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deliverables Checklist & Format */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
                  <ul className="space-y-1.5">
                    {[1, 2].map((idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{t(`landing.deliverables.items.m1.d${idx}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shrink-0 border border-primary/20">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>{t('landing.deliverables.items.m1.format')}</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* ROW 1: Card 2 (M2 - 1 Col Span) */}
          <motion.div variants={itemVariants}>
            <BentoCard className="h-full">
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Map className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">M02</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    {t('landing.deliverables.items.m2.tag')}
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">
                    {t('landing.deliverables.items.m2.name')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t('landing.deliverables.items.m2.desc')}
                  </p>
                </div>

                {/* Micro-Visual: 2x2 Matrix Graphic (SVG Lucide Icons — No Emojis) */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-center">
                    <div className="p-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center gap-1">
                      <Zap className="h-3 w-3 shrink-0" />
                      <span>Quick Wins</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground flex items-center justify-center gap-1">
                      <Target className="h-3 w-3 shrink-0" />
                      <span>Apuestas</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground flex items-center justify-center gap-1">
                      <Wrench className="h-3 w-3 shrink-0" />
                      <span>Tácticos</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>Descartar</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-primary flex items-center justify-between">
                  <span>{t('landing.deliverables.items.m2.format')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* ROW 2: Card 3 (M3 - 1 Col Span) */}
          <motion.div variants={itemVariants}>
            <BentoCard className="h-full">
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Layers className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">M03</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    {t('landing.deliverables.items.m3.tag')}
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">
                    {t('landing.deliverables.items.m3.name')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t('landing.deliverables.items.m3.desc')}
                  </p>
                </div>

                {/* Micro-Visual: 2 Horizons Timeline */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Horizonte 1 (0-6m)
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">Táctico</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Horizonte 2 (6-18m)
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/40 text-primary">Estratégico</Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-primary flex items-center justify-between">
                  <span>{t('landing.deliverables.items.m3.format')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* ROW 2: Card 4 (M4 - 1 Col Span) */}
          <motion.div variants={itemVariants}>
            <BentoCard className="h-full">
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <GitFork className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">M04</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    {t('landing.deliverables.items.m4.tag')}
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">
                    {t('landing.deliverables.items.m4.name')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t('landing.deliverables.items.m4.desc')}
                  </p>
                </div>

                {/* Micro-Visual: Decision Tree Steps with Clean SVG Icons */}
                <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between text-[10px] font-bold text-foreground">
                  <div className="p-1 px-2 rounded-lg bg-card border border-border/80 flex items-center gap-1">
                    <Binary className="h-3 w-3 text-muted-foreground" />
                    <span>Reglas</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="p-1 px-2 rounded-lg bg-card border border-border/80 flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-primary" />
                    <span>ML</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="p-1 px-2 rounded-lg brand-gradient text-white flex items-center gap-1 shadow-2xs">
                    <Sparkles className="h-3 w-3" />
                    <span>LLMs</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-primary flex items-center justify-between">
                  <span>{t('landing.deliverables.items.m4.format')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* ROW 2: Card 6 (M6 - 1 Col Span) */}
          <motion.div variants={itemVariants}>
            <BentoCard className="h-full">
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RefreshCw className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">M06</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    {t('landing.deliverables.items.m6.tag')}
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">
                    {t('landing.deliverables.items.m6.name')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t('landing.deliverables.items.m6.desc')}
                  </p>
                </div>

                {/* Micro-Visual: 5 Quality Gates Sequence */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3 text-primary" />
                      5 Quality Gates
                    </span>
                    <span className="text-primary font-bold">Human-in-the-Loop</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((g) => (
                      <div key={g} className="h-1.5 rounded-full bg-primary/80" />
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-primary flex items-center justify-between">
                  <span>{t('landing.deliverables.items.m6.format')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* ROW 3: Card 5 (M5 - 2 Col Span Hero Card) */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <BentoCard colSpan={2} className="relative overflow-hidden bg-gradient-to-br from-card/90 via-card/70 to-accent/5 h-full">
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl brand-gradient text-white shadow-sm">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="bg-accent/15 text-accent border-accent/30 text-[11px] font-bold uppercase tracking-wider">
                        {t('landing.deliverables.items.m5.tag')}
                      </Badge>
                    </div>
                    <span className="text-xs font-mono font-bold text-accent uppercase">Módulo 05</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                    {t('landing.deliverables.items.m5.name')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {t('landing.deliverables.items.m5.desc')}
                  </p>
                </div>

                {/* Interactive 7 Department Pills */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Kits departamentales listos para implementar:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEPARTMENT_PILLS.map((dept, idx) => (
                      <button
                        key={dept}
                        onMouseEnter={() => setHoveredDept(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          hoveredDept === idx
                            ? 'brand-gradient text-white shadow-sm scale-102'
                            : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deliverables Checklist & Format */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
                  <ul className="space-y-1.5">
                    {[1, 2].map((idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{t(`landing.deliverables.items.m5.d${idx}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent shrink-0 border border-accent/25">
                    <Bot className="h-3.5 w-3.5" />
                    <span>{t('landing.deliverables.items.m5.format')}</span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </motion.div>

          {/* ROW 3: Card 7 (M7 - 1 Col Span) */}
          <motion.div variants={itemVariants}>
            <BentoCard className="relative overflow-hidden bg-gradient-to-br from-card/90 via-card/70 to-primary/10 h-full">
              <div className="flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-sm">
                      <Crown className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-primary uppercase">M07</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    {t('landing.deliverables.items.m7.tag')}
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">
                    {t('landing.deliverables.items.m7.name')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t('landing.deliverables.items.m7.desc')}
                  </p>
                </div>

                {/* Micro-Visual: CoE Charter Badge */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-primary" />
                      Estatuto de Gobierno
                    </span>
                    <span className="text-primary">Escalamiento</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                    <span>Mejora continua y ROI cuantificable</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 text-[11px] font-semibold text-primary flex items-center justify-between">
                  <span>{t('landing.deliverables.items.m7.format')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </BentoCard>
          </motion.div>
        </BentoGrid>
      </motion.div>
    </section>
  );
}