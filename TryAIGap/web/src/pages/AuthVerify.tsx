import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CircleX, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useAuthStore } from '@/store/authStore';

type VerifyState = 'verifying' | 'error';

/** /auth/verify?token=RAW — exchanges the magic-link token for a session. */
export default function AuthVerify() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const verify = useAuthStore((s) => s.verify);
  const [token] = useState(() => params.get('token'));
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'error');
  const [errorMsg, setErrorMsg] = useState<string | null>(
    token ? null : t('auth.missingToken'),
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-effect guard
    ran.current = true;
    if (!token) return;
    verify(token)
      .then((user) => {
        navigate(user.organization_id ? '/dashboard' : '/onboarding', { replace: true });
      })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : null);
        setState('error');
      });
  }, [verify, navigate, token]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Background Dot Grid */}
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

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 md:px-8 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <BrandLogo compact />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 text-center shadow-xl backdrop-blur-xl">
            {state === 'verifying' ? (
              <div className="space-y-4 py-4">
                <div className="brand-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground" role="status">
                    {t('auth.verifying')}
                  </h1>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Validando tu token de acceso criptográfico...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-sm">
                  <CircleX className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {t('auth.verifyError')}
                  </h1>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {errorMsg || 'El enlace mágico de acceso ya fue utilizado o ha caducado por seguridad.'}
                  </p>
                </div>

                <Button asChild className="brand-gradient w-full text-white font-semibold shadow-md h-10 text-xs rounded-xl">
                  <Link to="/login">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    {t('auth.backToLogin')}
                  </Link>
                </Button>
              </div>
            )}
          </SpotlightCard>
        </motion.div>
      </main>
    </div>
  );
}
