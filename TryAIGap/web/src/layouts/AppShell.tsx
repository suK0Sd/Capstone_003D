import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Briefcase,
  Calculator,
  FileText,
  Gauge,
  Home,
  LayoutGrid,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { canAccessConsultant } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';
import { useAssessmentStore } from '@/store/assessmentStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    labelKey: 'nav.group_main',
    items: [
      { to: '/dashboard', labelKey: 'nav.home', icon: Home, end: true },
      { to: '/maturity', labelKey: 'nav.maturity', icon: Gauge },
      { to: '/areas', labelKey: 'nav.areas', icon: LayoutGrid },
      { to: '/estimator', labelKey: 'nav.estimator', icon: Calculator },
    ],
  },
  {
    labelKey: 'nav.group_collab',
    items: [
      { to: '/documents', labelKey: 'nav.documents', icon: FileText },
      { to: '/team', labelKey: 'nav.team', icon: Users },
    ],
  },
  {
    labelKey: 'nav.group_outputs',
    items: [
      { to: '/results', labelKey: 'nav.results', icon: BarChart3 },
      { to: '/review', labelKey: 'nav.review', icon: ShieldCheck },
    ],
  },
];

function NavSection({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const assessment = useAssessmentStore((s) => s.assessment);
  const groups = [...NAV];

  if (canAccessConsultant(user?.role)) {
    groups.push({
      labelKey: 'nav.group_consultant',
      items: [{ to: '/consultant', labelKey: 'nav.consultant', icon: Briefcase }],
    });
  }

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label={t('common.appTagline')}>
      {groups.map((group, gi) => (
        <div key={`${group.labelKey}-${gi}`}>
          <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {t(group.labelKey)}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm font-bold'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full brand-gradient"
                          aria-hidden="true"
                        />
                      )}
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Pie del Menú con Organización y Configuración */}
      <div className="mt-auto pt-4 space-y-2">
        {assessment && (
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-foreground truncate">
                {assessment.plan === 'pro' ? 'Plan Pro Enterprise' : 'Plan Freemium'}
              </span>
              <Badge
                variant={assessment.plan === 'pro' ? 'default' : 'secondary'}
                className="text-[9px] px-1.5 py-0 h-4 capitalize"
              >
                {assessment.plan}
              </Badge>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground truncate">
              {assessment.progress.maturity}% madurez completada
            </p>
          </div>
        )}

        <Separator className="my-2 bg-border/40" />

        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer',
              isActive
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{t('nav.settings')}</span>
        </NavLink>
      </div>
    </nav>
  );
}

/** Protected application shell: sidebar nav + header (theme, language, user). */
export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mapeo simple de títulos de sección según ruta
  const sectionTitleKey = (() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'nav.home';
    if (path.startsWith('/maturity')) return 'nav.maturity';
    if (path.startsWith('/areas')) return 'nav.areas';
    if (path.startsWith('/estimator')) return 'nav.estimator';
    if (path.startsWith('/documents')) return 'nav.documents';
    if (path.startsWith('/team')) return 'nav.team';
    if (path.startsWith('/results')) return 'nav.results';
    if (path.startsWith('/review')) return 'nav.review';
    if (path.startsWith('/consultant')) return 'nav.consultant';
    if (path.startsWith('/settings')) return 'nav.settings';
    return 'common.appTagline';
  })();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/50 bg-card/40 backdrop-blur-xl lg:flex z-30">
        <div className="flex h-16 items-center px-5 border-b border-border/40">
          <BrandLogo compact />
        </div>
        <NavSection />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card shadow-2xl border-r border-border/60">
            <div className="flex h-16 items-center justify-between px-5 border-b border-border/40">
              <BrandLogo compact />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label={t('common.toggleMenu')}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavSection onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-lg"
              onClick={() => setMobileOpen(true)}
              aria-label={t('common.toggleMenu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden">
              <BrandLogo compact />
            </div>
            <div className="hidden lg:block">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t(sectionTitleKey)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
          {/* Subtle background dot grid on main content */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.25] dark:opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
