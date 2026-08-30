import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Fingerprint, 
  Info, 
  Layers, 
  Loader2, 
  Mail, 
  MailCheck, 
  RefreshCw, 
  ShieldCheck, 
  Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { requestMagicLink } from '@/api';
import { ApiError } from '@/api/client';
import { IS_DEV } from '@/config';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Magic-link login: email → POST /auth/magic-link → "check your inbox" state. */
export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      await requestMagicLink(email.trim(), (i18n.language ?? 'es').slice(0, 2));
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

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
          <Button asChild size="sm" className="hidden sm:inline-flex brand-gradient text-white text-xs h-8 px-3 rounded-lg">
            <Link to="/start">{t('login.startFree')}</Link>
          </Button>
        </div>
      </header>

      {/* Main Container: 2-Column Split Screen */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 md:py-12">
        <div className="grid w-full gap-8 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left Column: Formulario / Estado de Envío */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-xl backdrop-blur-xl">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="sent-state"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="brand-gradient mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg">
                        <MailCheck className="h-7 w-7" />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {t('auth.checkInboxTitle')}
                      </h2>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        {t('auth.checkInboxSub', { email })}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-semibold text-primary">
                        <Mail className="h-3.5 w-3.5" />
                        {email}
                      </div>
                    </div>

                    {/* Pasos a seguir */}
                    <div className="space-y-2.5 rounded-xl border border-border/70 bg-card/60 p-4 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>Abre el correo enviado por TryAIGap en tu bandeja o spam.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>Haz clic en el botón de acceso seguro (enlace mágico de un solo uso).</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>Tu sesión se iniciará de forma automática sin ingresar contraseña.</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSubmit()}
                        disabled={loading}
                        className="w-full text-xs h-10 cursor-pointer"
                      >
                        {loading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {t('auth.resend')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setSent(false);
                          setError(null);
                        }}
                        className="w-full text-xs h-9 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {t('auth.useAnotherEmail')}
                      </Button>
                    </div>

                    {IS_DEV && <DevHint />}
                  </motion.div>
                ) : (
                  <motion.div
                    key="form-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                        <Fingerprint className="h-3.5 w-3.5" />
                        {t('login.badge')}
                      </span>
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        {t('login.title')}
                      </h1>
                      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                        {t('login.sub')}
                      </p>
                    </div>

                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email" className="text-xs font-semibold text-foreground">
                          {t('login.email')} <span className="text-primary">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="login-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoFocus
                            required
                            placeholder="nombre@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={!!error}
                            className="bg-background/50 h-10 text-xs sm:text-sm pl-9"
                          />
                          <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" role="alert" aria-live="polite" className="py-2.5">
                          <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        disabled={loading || !email.trim()}
                        className="brand-gradient w-full text-white font-semibold shadow-lg hover:opacity-95 transition-opacity h-11 text-sm rounded-xl cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t('login.submitting')}
                          </>
                        ) : (
                          <>
                            {t('login.send')}
                            <ArrowRight className="h-4 w-4 ml-1.5" />
                          </>
                        )}
                      </Button>

                      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                        {t('login.legal')}
                      </p>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                          <ArrowLeft className="h-3.5 w-3.5" /> {t('leadgate.back')}
                        </Link>
                        <Link to="/start" className="hover:text-primary transition-colors">
                          {t('login.noAccount')}{' '}
                          <span className="font-semibold text-foreground underline">{t('login.startFree')}</span>
                        </Link>
                      </div>
                    </form>

                    {IS_DEV && <DevHint />}
                  </motion.div>
                )}
              </AnimatePresence>
            </SpotlightCard>
          </motion.div>

          {/* Right Column: Panel de Valor y Seguridad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                TryAIGap Enterprise Platform
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mt-1 tracking-tight">
                {t('login.valueTitle')}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t('login.valueSub')}
              </p>
            </div>

            {/* 3 Bloques de Valor */}
            <div className="space-y-3.5">
              {/* Beneficio 1 */}
              <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg brand-gradient text-white shadow-sm">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    {t('login.benefit1Title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t('login.benefit1Desc')}
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
                    {t('login.benefit2Title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t('login.benefit2Desc')}
                  </p>
                </div>
              </div>

              {/* Beneficio 3 */}
              <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg brand-gradient text-white shadow-sm">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    {t('login.benefit3Title')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t('login.benefit3Desc')}
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

/** Dev-only hint: local backend prints the magic link in the uvicorn console. */
function DevHint() {
  const { t } = useTranslation();
  return (
    <Alert className="border-dashed bg-muted/40 py-2.5">
      <Info className="h-4 w-4 text-primary" />
      <AlertDescription className="text-xs">{t('auth.devHint')}</AlertDescription>
    </Alert>
  );
}
