import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2,
  FileText, 
  Layers, 
  Radar, 
  ShieldCheck, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { createLead, fetchMetadata } from '@/api';
import { tokenStorage } from '@/api/client';
import type { MetadataResponse } from '@/api';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  isCorporateEmail,
  mapLeadApiError,
  validateLead,
  type LeadField,
  type LeadFormValues,
} from '@/lib/leadForm';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const EMPTY: LeadFormValues = {
  full_name: '',
  job_title: '',
  company_email: '',
  company_name: '',
  company_size: '',
  industry: '',
  country: '',
  terms_accepted: false,
};

/**
 * Freemium lead gate (/start): public capture form. On success the backend
 * returns org + assessment + tokens; we store the session and go to onboarding.
 */
export default function LeadGate() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const hydrate = useAuthStore((s) => s.hydrate);

  const [values, setValues] = useState<LeadFormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LeadField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestLogin, setSuggestLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);

  useEffect(() => {
    fetchMetadata()
      .then(setMetadata)
      .catch(() => setMetadata(null));
  }, [i18n.language]);

  const catalogs = useMemo(() => {
    const fallback = (key: string) =>
      (t(`leadgate.${key}`, { returnObjects: true }) as string[]) ?? [];
    return {
      sizes: metadata?.sizes ?? fallback('sizes'),
      industries: metadata?.industries ?? fallback('industries'),
      countries: metadata?.countries ?? fallback('countries'),
    };
  }, [metadata, t]);

  function set<K extends LeadField>(key: K, value: LeadFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuggestLogin(false);

    const errors = validateLead(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(t('leadgate.requiredErr'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await createLead({
        full_name: values.full_name.trim(),
        job_title: values.job_title.trim() || null,
        company_email: values.company_email.trim(),
        company_name: values.company_name.trim(),
        company_size: values.company_size || null,
        industry: values.industry || null,
        country: values.country || null,
        terms_accepted: values.terms_accepted,
        locale: i18n.language.slice(0, 2),
      });
      tokenStorage.set(res.access_token, res.refresh_token);
      await hydrate();
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const mapped = mapLeadApiError(err);
      if (mapped.field) {
        setFieldErrors({ [mapped.field]: mapped.i18nKey });
      } else {
        setFormError(t(mapped.i18nKey));
      }
      setSuggestLogin(mapped.suggestLogin);
    } finally {
      setSubmitting(false);
    }
  }

  const errText = (key: LeadField) =>
    fieldErrors[key] ? (
      <p className="text-xs text-destructive">{t(fieldErrors[key] as string)}</p>
    ) : null;

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
          <Link
            to="/login"
            className="hidden sm:inline-flex text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('leadgate.loginLink')}
          </Link>
        </div>
      </header>

      {/* Main Container: 2-Column Split Screen */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 md:py-12">
        <div className="grid w-full gap-8 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left Column: Formulario de Registro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-xl backdrop-blur-xl">
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('leadgate.badge')}
                </span>
                <h1 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground">
                  {t('leadgate.title')}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  {t('leadgate.sub')}
                </p>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Nombre Completo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lg-name" className="text-xs font-semibold">
                      {t('leadgate.name')} <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="lg-name"
                      value={values.full_name}
                      onChange={(e) => set('full_name', e.target.value)}
                      placeholder="Ej. Fabrizio Martínez"
                      aria-invalid={!!fieldErrors.full_name}
                      className="bg-background/50 h-9 text-xs sm:text-sm"
                    />
                    {errText('full_name')}
                  </div>

                  {/* Cargo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lg-role" className="text-xs font-semibold">
                      {t('leadgate.role')} <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="lg-role"
                      value={values.job_title}
                      onChange={(e) => set('job_title', e.target.value)}
                      placeholder="Ej. CTO / Director de Operaciones"
                      aria-invalid={!!fieldErrors.job_title}
                      className="bg-background/50 h-9 text-xs sm:text-sm"
                    />
                    {errText('job_title')}
                  </div>

                  {/* Email Corporativo */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="lg-email" className="text-xs font-semibold">
                      {t('leadgate.email')} <span className="text-primary">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="lg-email"
                        type="email"
                        value={values.company_email}
                        onChange={(e) => set('company_email', e.target.value)}
                        placeholder="nombre@empresa.com"
                        aria-invalid={!!fieldErrors.company_email}
                        className={cn(
                          "bg-background/50 h-9 text-xs sm:text-sm",
                          isCorporateEmail(values.company_email) && "border-emerald-500/60 pr-8"
                        )}
                      />
                      {isCorporateEmail(values.company_email) && (
                        <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-500 pointer-events-none" />
                      )}
                    </div>
                    {fieldErrors.company_email ? (
                      <p className="text-xs text-destructive">
                        {t(fieldErrors.company_email)}{' '}
                        {suggestLogin && (
                          <Link to="/login" className="font-medium underline text-primary">
                            {t('leadgate.goLogin')}
                          </Link>
                        )}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">{t('leadgate.emailHint')}</p>
                    )}
                  </div>

                  {/* Nombre de la Empresa */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lg-company" className="text-xs font-semibold">
                      {t('leadgate.company')} <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="lg-company"
                      value={values.company_name}
                      onChange={(e) => set('company_name', e.target.value)}
                      placeholder="Ej. Innova Corp S.A."
                      aria-invalid={!!fieldErrors.company_name}
                      className="bg-background/50 h-9 text-xs sm:text-sm"
                    />
                    {errText('company_name')}
                  </div>

                  {/* Tamaño de Empresa */}
                  <CatalogSelect
                    id="lg-size"
                    label={t('leadgate.size')}
                    value={values.company_size}
                    options={catalogs.sizes}
                    onChange={(v) => set('company_size', v)}
                  />

                  {/* Industria */}
                  <CatalogSelect
                    id="lg-industry"
                    label={t('leadgate.industry')}
                    value={values.industry}
                    options={catalogs.industries}
                    onChange={(v) => set('industry', v)}
                  />

                  {/* País */}
                  <CatalogSelect
                    id="lg-country"
                    label={t('leadgate.country')}
                    value={values.country}
                    options={catalogs.countries}
                    onChange={(v) => set('country', v)}
                  />
                </div>

                {/* Términos y Condiciones */}
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 pt-2 text-xs text-muted-foreground',
                    fieldErrors.terms_accepted && 'text-destructive',
                  )}
                >
                  <Checkbox
                    checked={values.terms_accepted}
                    onCheckedChange={(c) => set('terms_accepted', c === true)}
                    aria-invalid={!!fieldErrors.terms_accepted}
                    className="mt-0.5"
                  />
                  <span>
                    {t('leadgate.terms')}{' '}
                    <Link to="/terms" state={{ from: '/start' }} className="text-primary underline font-medium">
                      {t('terms.title')}
                    </Link>{' '}
                    y la Política de Privacidad.
                  </span>
                </label>
                {errText('terms_accepted')}

                {formError && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertDescription className="text-xs">{formError}</AlertDescription>
                  </Alert>
                )}

                {/* Botón CTA */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="brand-gradient w-full text-white font-semibold shadow-lg hover:opacity-95 transition-opacity h-11 text-sm rounded-xl cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('leadgate.submitting')}
                    </>
                  ) : (
                    <>
                      {t('leadgate.cta')}
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>

                {/* Volver a la Landing */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> {t('leadgate.back')}
                  </Link>
                  <Link to="/login" className="hover:text-primary transition-colors">
                    {t('leadgate.alreadyHaveAccount')} <span className="font-semibold text-foreground underline">{t('leadgate.loginLink')}</span>
                  </Link>
                </div>
              </form>
            </SpotlightCard>
          </motion.div>

          {/* Right Column: Panel de Valor & Confianza */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                TryAIGap Enterprise Assessment
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mt-1 tracking-tight">
                {t('leadgate.valueTitle')}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t('leadgate.valueSub')}
              </p>
            </div>

            {/* 3 Bloques de Entregables */}
            <div className="space-y-3.5">
              {/* Beneficio 1 */}
              <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg brand-gradient text-white shadow-sm">
                  <Radar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    {t('leadgate.benefit1Title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t('leadgate.benefit1Desc')}
                  </p>
                </div>
              </div>

              {/* Beneficio 2 */}
              <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg brand-gradient text-white shadow-sm">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    {t('leadgate.benefit2Title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t('leadgate.benefit2Desc')}
                  </p>
                </div>
              </div>

              {/* Beneficio 3 */}
              <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg brand-gradient text-white shadow-sm">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    {t('leadgate.benefit3Title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t('leadgate.benefit3Desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Badge de Seguridad y Soberanía */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground">
                  {t('leadgate.securityBadge')}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {t('leadgate.securityDesc')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function CatalogSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
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
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs sm:text-sm">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
