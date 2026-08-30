import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ArrowRight, 
  Briefcase,
  Building2, 
  Check, 
  Clock, 
  Headphones,
  Layers, 
  LineChart,
  Loader2, 
  Plus, 
  Scale, 
  ShieldCheck, 
  Trash2, 
  UserPlus, 
  Users,
  Wallet,
  Wrench,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createInvitation, fetchMetadata, fetchOrganization, updateOrganization } from '@/api';
import { ApiError } from '@/api/client';
import type { MetadataResponse } from '@/api';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const DRAFT_KEY = 'tryaigap.onboarding_draft';

const FRAMEWORKS = [
  'UK GDPR',
  'Data Protection Act 2018 (UK)',
  'GDPR (EU)',
  'EU AI Act',
  'ISO/IEC 42001',
  'NIST AI RMF',
  'OECD AI Principles',
];

const CANONICAL_AREAS = ['ventas', 'marketing', 'servicio', 'finanzas', 'rrhh', 'operaciones', 'legal'];

interface Profile {
  name: string;
  sector: string;
  size: string;
  country: string;
  currency: string;
}

interface Draft {
  profile: Profile;
  frameworks: string[];
  areas: string[];
  leaders: { name: string; email: string; area?: string }[];
}

const EMPTY_DRAFT: Draft = {
  profile: { name: '', sector: '', size: '', country: '', currency: 'USD' },
  frameworks: ['UK GDPR', 'EU AI Act', 'ISO/IEC 42001'],
  areas: CANONICAL_AREAS,
  leaders: [],
};

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Draft;
    const sanitizedAreas = Array.from(
      new Set((parsed.areas || []).filter((a) => CANONICAL_AREAS.includes(a))),
    );
    return {
      ...EMPTY_DRAFT,
      ...parsed,
      areas: sanitizedAreas.length > 0 ? sanitizedAreas : CANONICAL_AREAS,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

interface AreaEntry {
  name: string;
  icon: string;
  n: number;
}

const TOTAL_STEPS = 4;

/**
 * Enterprise Onboarding Wizard (4 interactive steps):
 *  1. Company Profile        → PATCH /organizations/{id}
 *  2. Compliance Frameworks  → local draft & governance calibration
 *  3. Functional Areas       → local draft & assessment scoping
 *  4. Team Invitations       → POST /invitations
 */
export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [offlineNote, setOfflineNote] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar metadatos desde el backend con fallbacks seguros
  useEffect(() => {
    fetchMetadata()
      .then(setMetadata)
      .catch(() => setMetadata(null));
  }, [i18n.language]);

  // Pre-llenado de datos de la organización obtenidos del registro/lead
  useEffect(() => {
    if (!user?.organization_id) return;
    fetchOrganization(user.organization_id)
      .then((org) => {
        setDraft((d) => {
          if (d.profile.name) return d;
          return {
            ...d,
            profile: {
              name: org.name || '',
              sector: org.sector || '',
              size: org.size || '',
              country: org.country || '',
              currency: org.currency || 'USD',
            },
          };
        });
      })
      .catch(() => undefined);
  }, [user?.organization_id]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const catalogs = useMemo(() => {
    const fallback = (key: string): string[] => {
      const res = t(`leadgate.${key}`, { returnObjects: true });
      if (Array.isArray(res)) return res as string[];
      const ex = t(`examples.${key}`, { returnObjects: true });
      if (Array.isArray(ex)) return ex as string[];
      return [];
    };
    return {
      sectors: metadata?.industries ?? (fallback('industries').length ? fallback('industries') : ['Tecnología', 'Manufactura', 'Servicios Financieros', 'Salud', 'Retail', 'Educación', 'Otro']),
      sizes: metadata?.sizes ?? (fallback('sizes').length ? fallback('sizes') : ['1–50', '51–250', '251–1.000', '1.001–5.000', '5.000+']),
      countries: metadata?.countries ?? (fallback('countries').length ? fallback('countries') : ['Chile', 'Reino Unido', 'España', 'Estados Unidos', 'México', 'Colombia', 'Argentina', 'Alemania', 'Otro']),
      currencies: metadata?.currencies ?? ['USD', 'GBP', 'EUR', 'CLP'],
      frameworks: metadata?.frameworks ?? FRAMEWORKS,
    };
  }, [metadata, t]);

  const areaList = t('areaList', { returnObjects: true }) as Record<string, AreaEntry>;
  
  const stepTitles = [
    t('onboarding.step1Title'),
    t('onboarding.step2Title'),
    t('onboarding.step3Title'),
    t('onboarding.step4Title'),
  ];
  const stepSubs = [
    t('onboarding.step1Sub'),
    t('onboarding.step2Sub'),
    t('onboarding.step3Sub'),
    t('onboarding.step4Sub'),
  ];

  const stepIcons = [Building2, ShieldCheck, Layers, Users];
  const stepNames = (t('onboarding.stepNames', { returnObjects: true }) as string[]) || [
    '1. Perfil',
    '2. Regulación',
    '3. Áreas',
    '4. Equipo',
  ];

  function patchDraft(partial: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...partial }));
  }

  async function saveProfile(): Promise<void> {
    const orgId = user?.organization_id;
    if (!orgId) return;
    try {
      await updateOrganization(orgId, {
        name: draft.profile.name || undefined,
        sector: draft.profile.sector || undefined,
        size: draft.profile.size || undefined,
        country: draft.profile.country || undefined,
        currency: draft.profile.currency || undefined,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status > 0 && e.status < 500) throw e;
      setOfflineNote(true);
    }
  }

  async function sendInvites(): Promise<void> {
    for (const leader of draft.leaders) {
      if (!leader.name || !leader.email) continue;
      try {
        await createInvitation({ full_name: leader.name, email: leader.email });
      } catch {
        setOfflineNote(true);
      }
    }
  }

  async function handleNext() {
    setSaving(true);
    try {
      if (step === 1) await saveProfile();
      if (step === TOTAL_STEPS) {
        await sendInvites();
        localStorage.removeItem(DRAFT_KEY);
        navigate('/dashboard', { replace: true });
        return;
      }
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    } finally {
      setSaving(false);
    }
  }

  // Cálculo de tiempo estimado total según áreas activadas
  const timeEstimateText = useMemo(() => {
    const baseMin = 20; // Módulo 1 (Fundamentos 5D)
    const perAreaMin = 25; // ~25 min por área funcional
    const activeAreas = draft.areas.filter((a) => CANONICAL_AREAS.includes(a));
    const areaCount = activeAreas.length;
    
    if (areaCount === 0) {
      return 'Tiempo estimado: ~20 min (Módulo 1: Fundamentos 5D)';
    }
    
    const totalMin = baseMin + areaCount * perAreaMin;
    const hours = (totalMin / 60).toFixed(1).replace('.', ',');
    return `Tiempo estimado total: ~${hours} horas distribuidas (Módulo 1 + ${areaCount} áreas)`;
  }, [draft.areas]);

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
        <BrandLogo compact />
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:py-12">
        {/* Título y Subtítulo */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            TryAIGap Enterprise Onboarding
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            {t('onboarding.title')}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            {t('onboarding.sub')}
          </p>
        </div>

        {/* Stepper de 4 Pasos Interactivo */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => {
              const StepIcon = stepIcons[n - 1];
              const isCompleted = n < step;
              const isCurrent = n === step;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    if (n < step || (step === 1 && draft.profile.name)) {
                      setStep(n);
                    }
                  }}
                  disabled={n > step && (!draft.profile.name || step === 1)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 sm:p-3 text-center transition-all cursor-pointer',
                    isCurrent
                      ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                      : isCompleted
                      ? 'border-border/80 bg-card/60 text-foreground hover:bg-card'
                      : 'border-border/40 bg-card/30 text-muted-foreground opacity-60 cursor-not-allowed',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs font-bold transition-all',
                      isCurrent
                        ? 'brand-gradient text-white shadow-sm'
                        : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold truncate w-full">
                    {stepNames[n - 1] ?? `Paso ${n}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Barra de Progreso Lineal */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full brand-gradient transition-all duration-500 ease-out"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Tarjeta Principal de Formulario */}
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-6 border-b border-border/60 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {t('onboarding.stepOf', { current: step, total: TOTAL_STEPS })}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-foreground mt-0.5">
              {stepTitles[step - 1]}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {stepSubs[step - 1]}
            </p>
          </div>

          {offlineNote && (
            <Alert className="mb-6 py-2.5">
              <AlertDescription className="text-xs">{t('onboarding.savedOffline')}</AlertDescription>
            </Alert>
          )}

          {/* Pasos con Animación Suave */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 && (
                <StepProfile draft={draft} onChange={patchDraft} catalogs={catalogs} />
              )}
              {step === 2 && (
                <StepFrameworks draft={draft} onChange={patchDraft} frameworks={catalogs.frameworks} />
              )}
              {step === 3 && (
                <StepAreas draft={draft} onChange={patchDraft} areaList={areaList} />
              )}
              {step === 4 && (
                <StepLeaders draft={draft} onChange={patchDraft} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Barra de Acciones y Navegación */}
          <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => Math.max(s - 1, 1))}
              disabled={step === 1 || saving}
              className={cn('text-xs h-9 cursor-pointer', step === 1 && 'invisible')}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {t('onboarding.back')}
            </Button>

            <div className="flex items-center gap-2">
              {step > 1 && step < TOTAL_STEPS && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={saving}
                  className="text-xs h-9 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {t('onboarding.skip')}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => void handleNext()}
                disabled={saving || (step === 1 && !draft.profile.name.trim())}
                className="brand-gradient text-white text-xs h-9 px-5 shadow-md hover:opacity-95 transition-opacity font-semibold cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Guardando...
                  </>
                ) : (
                  <>
                    {step === TOTAL_STEPS ? t('onboarding.start') : t('onboarding.next')}
                    {step === TOTAL_STEPS ? (
                      <Check className="h-3.5 w-3.5 ml-1.5" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SpotlightCard>

        {/* Indicador de Tiempo Dinámico */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>
            {timeEstimateText}
          </span>
        </div>
      </main>
    </div>
  );
}

interface StepProps {
  draft: Draft;
  onChange: (partial: Partial<Draft>) => void;
}

// ----------------------------------------------------
// Paso 1: Perfil de la Empresa
// ----------------------------------------------------
function StepProfile({
  draft,
  onChange,
  catalogs,
}: StepProps & { catalogs: { sectors: string[]; sizes: string[]; countries: string[]; currencies: string[] } }) {
  const { t } = useTranslation();
  const p = draft.profile;
  const set = (k: keyof Profile) => (v: string) =>
    onChange({ profile: { ...p, [k]: v } });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ob-name" className="text-xs font-semibold text-foreground">
            {t('onboarding.cName')} <span className="text-primary">*</span>
          </Label>
          <Input
            id="ob-name"
            value={p.name}
            onChange={(e) => set('name')(e.target.value)}
            placeholder="Ej. InnovaCorp Ltd."
            required
            className="bg-background/50 h-9 text-xs sm:text-sm"
          />
        </div>

        <CatalogSelect
          id="ob-sector"
          label={t('onboarding.cSector')}
          value={p.sector}
          options={catalogs.sectors}
          onChange={set('sector')}
        />

        <CatalogSelect
          id="ob-size"
          label={t('onboarding.cSize')}
          value={p.size}
          options={catalogs.sizes}
          onChange={set('size')}
        />

        <CatalogSelect
          id="ob-country"
          label={t('onboarding.cCountry')}
          value={p.country}
          options={catalogs.countries}
          onChange={set('country')}
        />

        <CatalogSelect
          id="ob-currency"
          label={t('onboarding.cCurrency')}
          value={p.currency}
          options={catalogs.currencies}
          onChange={set('currency')}
        />
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
        <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Esta información calibra automáticamente los benchmarks sectoriales y las recomendaciones estratégicas para tu tamaño de organización.
        </p>
      </div>
    </div>
  );
}

function CatalogSelect({
  id,
  label,
  value,
  options = [],
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options?: string[];
  onChange: (v: string) => void;
}) {
  const safeOptions = Array.isArray(options) ? options : [];
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="bg-background/50 h-9 text-xs sm:text-sm">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {safeOptions.map((o) => (
            <SelectItem key={o} value={o} className="text-xs sm:text-sm">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ----------------------------------------------------
// Paso 2: Marcos Regulatorios y de Cumplimiento
// ----------------------------------------------------
function StepFrameworks({
  draft,
  onChange,
  frameworks,
}: StepProps & { frameworks: string[] }) {
  const { t } = useTranslation();

  function toggle(fw: string, checked: boolean) {
    onChange({
      frameworks: checked ? [...draft.frameworks, fw] : draft.frameworks.filter((f) => f !== fw),
    });
  }

  function selectAll() {
    onChange({ frameworks: [...frameworks] });
  }

  function clearAll() {
    onChange({ frameworks: [] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t('onboarding.frameworkTip')}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-[11px] h-7 px-2 text-primary hover:text-primary"
          >
            {t('onboarding.selectAll')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-[11px] h-7 px-2 text-muted-foreground"
          >
            {t('onboarding.clearAll')}
          </Button>
        </div>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {frameworks.map((fw) => {
          const checked = draft.frameworks.includes(fw);
          return (
            <li key={fw}>
              <label
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-xs font-medium transition-all',
                  checked
                    ? 'border-primary/80 bg-primary/10 shadow-sm ring-1 ring-primary/30 text-foreground'
                    : 'border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => toggle(fw, c === true)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span>{fw}</span>
                </div>
                <Scale className={cn('h-3.5 w-3.5 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')} />
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ----------------------------------------------------
// Paso 3: Áreas Funcionales a Evaluar
// ----------------------------------------------------
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

function StepAreas({
  draft,
  onChange,
  areaList,
}: StepProps & { areaList: Record<string, AreaEntry> }) {
  const { t } = useTranslation();
  const allKeys = Object.keys(areaList).length > 0 ? Object.keys(areaList) : CANONICAL_AREAS;
  const activeAreas = draft.areas.filter((k) => allKeys.includes(k));

  function toggle(key: string) {
    const exists = draft.areas.includes(key);
    const next = exists ? draft.areas.filter((a) => a !== key) : [...draft.areas, key];
    onChange({ areas: Array.from(new Set(next.filter((k) => allKeys.includes(k)))) });
  }

  function selectAll() {
    onChange({ areas: [...allKeys] });
  }

  function clearAll() {
    onChange({ areas: [] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          {t('onboarding.areasCount', { selected: activeAreas.length, total: allKeys.length })}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-[11px] h-7 px-2 text-primary hover:text-primary"
          >
            {t('onboarding.selectAll')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-[11px] h-7 px-2 text-muted-foreground"
          >
            {t('onboarding.clearAll')}
          </Button>
        </div>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {Object.entries(areaList).map(([key, area]) => {
          const active = draft.areas.includes(key);
          const Icon = getAreaLucideIcon(key);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer',
                  active
                    ? 'border-primary/80 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                    : 'border-border/70 bg-card/60 hover:bg-muted/40 opacity-80',
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm border border-border/40 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-foreground truncate">{area.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{area.n} preguntas</span>
                </div>
                {active ? (
                  <Badge className="brand-gradient text-white border-0 text-[10px] px-2 h-5 shrink-0">
                    <Check className="h-3 w-3 mr-0.5" /> Activa
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground shrink-0">+ Añadir</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ----------------------------------------------------
// Paso 4: Invitación a Líderes de Área
// ----------------------------------------------------
function StepLeaders({ draft, onChange }: StepProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function add() {
    if (!name.trim() || !email.trim()) return;
    onChange({ leaders: [...draft.leaders, { name: name.trim(), email: email.trim() }] });
    setName('');
    setEmail('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
        <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t('onboarding.leadersSub')}
        </p>
      </div>

      {/* Formulario para Añadir Líder */}
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5 text-primary" />
          Añadir Miembro del Equipo
        </h3>
        <div className="grid gap-2.5 sm:grid-cols-12 items-end">
          <div className="space-y-1 sm:col-span-5">
            <Label htmlFor="ld-name" className="text-[11px] font-semibold">
              {t('onboarding.inviteName')}
            </Label>
            <Input
              id="ld-name"
              placeholder="Ej. Carmen Salinas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background/50 h-9 text-xs"
            />
          </div>
          <div className="space-y-1 sm:col-span-5">
            <Label htmlFor="ld-email" className="text-[11px] font-semibold">
              {t('onboarding.inviteEmail')}
            </Label>
            <Input
              id="ld-email"
              type="email"
              placeholder="carmen@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background/50 h-9 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={add}
              disabled={!name.trim() || !email.trim()}
              className="w-full text-xs h-9 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t('onboarding.inviteAdd')}
            </Button>
          </div>
        </div>
      </div>

      {/* Listado de Líderes Añadidos */}
      {draft.leaders.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground">
            Equipo a Invitar ({draft.leaders.length})
          </h4>
          <ul className="space-y-2">
            {draft.leaders.map((l, i) => (
              <li
                key={`${l.email}-${i}`}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-card/80 p-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {l.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{l.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ leaders: draft.leaders.filter((_, j) => j !== i) })}
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">{t('onboarding.remove')}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground py-2">
          {t('onboarding.noLeaders')}
        </p>
      )}
    </div>
  );
}
