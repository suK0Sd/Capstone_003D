import { useTranslation } from 'react-i18next';
import { Globe2, Moon, Palette, Sliders, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useTheme } from '@/theme/theme-context';
import { cn } from '@/lib/utils';

/**
 * Preferences: language + theme are fully functional.
 */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const current = (i18n.language ?? 'es').slice(0, 2);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <Sliders className="h-3 w-3" />
            Preferencias de Usuario
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {t('settings.sub')}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Idioma */}
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <Globe2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">{t('settings.appLang')}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.appLangDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={t('common.language')}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Button
                key={lang.code}
                variant={current === lang.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => void i18n.changeLanguage(lang.code)}
                aria-pressed={current === lang.code}
                className={cn(
                  'h-10 text-xs font-bold rounded-xl transition-all cursor-pointer',
                  current === lang.code
                    ? 'brand-gradient text-white border-0 shadow-md'
                    : 'hover:bg-muted/40 text-foreground border-border/80',
                )}
              >
                {lang.name}
              </Button>
            ))}
          </div>
        </SpotlightCard>

        {/* Tema */}
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <Palette className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">{t('settings.theme')}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">Alterna entre modo oscuro deep-tech y claro.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={t('common.theme')}>
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              className={cn(
                'h-10 text-xs font-bold rounded-xl transition-all cursor-pointer',
                theme === 'light'
                  ? 'brand-gradient text-white border-0 shadow-md'
                  : 'hover:bg-muted/40 text-foreground border-border/80',
              )}
            >
              <Sun className="h-4 w-4 mr-1.5" /> {t('settings.themeLight')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={cn(
                'h-10 text-xs font-bold rounded-xl transition-all cursor-pointer',
                theme === 'dark'
                  ? 'brand-gradient text-white border-0 shadow-md'
                  : 'hover:bg-muted/40 text-foreground border-border/80',
              )}
            >
              <Moon className="h-4 w-4 mr-1.5" /> {t('settings.themeDark')}
            </Button>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
