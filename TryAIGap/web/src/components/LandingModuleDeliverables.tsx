import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Map, 
  Layers, 
  GitFork, 
  BookOpen, 
  RefreshCw, 
  Crown, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';

interface ModuleItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const MODULES: ModuleItem[] = [
  { id: 'm1', icon: Compass, tag: 'Gobernanza & Diagnóstico' },
  { id: 'm2', icon: Map, tag: 'Priorización Cuantificada' },
  { id: 'm3', icon: Layers, tag: 'Gestión de Portafolio' },
  { id: 'm4', icon: GitFork, tag: 'Arquitectura & Decisión' },
  { id: 'm5', icon: BookOpen, tag: '7 Playbooks Departamentales' },
  { id: 'm6', icon: RefreshCw, tag: 'Calidad & Cambio Cultural' },
  { id: 'm7', icon: Crown, tag: 'Centro de Excelencia' },
];

export function LandingModuleDeliverables() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('m1');

  const activeModule = MODULES.find((m) => m.id === activeTab) ?? MODULES[0];
  const ActiveIcon = activeModule.icon;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      {/* Encabezado con entrada suave */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <h2 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground">
          {t('landing.deliverables.title')}
        </h2>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          {t('landing.deliverables.subtitle')}
        </p>
      </motion.div>

      {/* Interactive Tabs Header — entrada suave retrasada */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="flex flex-wrap items-center justify-center gap-2 mb-8"
      >
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = mod.id === activeTab;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveTab(mod.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'brand-gradient text-white shadow-md'
                  : 'bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="uppercase tracking-wider">{mod.id}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Active Tab Content Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          <SpotlightCard className="p-6 md:p-8 rounded-2xl border-border/80 bg-card shadow-lg">
            <div className="grid gap-6 lg:grid-cols-12 items-center">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-sm">
                    <ActiveIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[11px] uppercase tracking-wider">
                      {t(`landing.deliverables.items.${activeTab}.tag`)}
                    </Badge>
                    <h3 className="text-lg md:text-xl font-bold text-foreground mt-0.5">
                      {t(`landing.deliverables.items.${activeTab}.name`)}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`landing.deliverables.items.${activeTab}.desc`)}
                </p>

                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t('landing.deliverables.deliverablesLabel')}
                  </p>
                  <ul className="space-y-2">
                    {[1, 2, 3].map((dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{t(`landing.deliverables.items.${activeTab}.d${dIdx}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Deliverable Visual Preview Badge */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl bg-muted/40 border border-border/50 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full brand-gradient text-white shadow-md">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('landing.deliverables.formatLabel')}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {t(`landing.deliverables.items.${activeTab}.format`)}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span>{t('landing.deliverables.readyTag')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}