import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, CheckCircle2, Link2Off, Lock, UserCheck } from 'lucide-react';
import { acceptInvitation, fetchInvitation } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

/**
 * Public invitation acceptance page (/invite/:token).
 * Allows invited leaders and team members to join an organization,
 * confirm their identity, and transition directly into the assessment.
 */
export default function InviteAccept() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [fullName, setFullName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const invitationQuery = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const data = await fetchInvitation(token!);
      if (data.full_name) setFullName(data.full_name);
      return data;
    },
    enabled: !!token,
    retry: 0,
  });

  const info = invitationQuery.data;

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await acceptInvitation(token, {
        full_name: fullName.trim() || info?.full_name,
      });
      await setSession(res.token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { message?: string; code?: string };
      if (apiErr.code === 'INVITE_ALREADY_ACCEPTED') {
        setErrorMsg(t('inviteAccept.alreadyAccepted'));
      } else {
        setErrorMsg(apiErr.message || t('inviteAccept.errorGeneric'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function renderStateCard(icon: React.ReactNode, title: string, description: string, action?: React.ReactNode) {
    return (
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader className="items-center space-y-3">
          {icon}
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        {action && <CardFooter className="justify-center pb-6">{action}</CardFooter>}
      </Card>
    );
  }

  let content: React.ReactNode;

  if (invitationQuery.isLoading) {
    content = (
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  } else if (invitationQuery.isError || !info) {
    content = renderStateCard(
      <Link2Off className="h-12 w-12 text-destructive" />,
      t('inviteAccept.invalidTitle'),
      t('inviteAccept.invalidSub'),
      <Button asChild variant="outline">
        <Link to="/login">{t('inviteAccept.backToLogin')}</Link>
      </Button>,
    );
  } else if (info.status === 'accepted') {
    content = renderStateCard(
      <CheckCircle2 className="h-12 w-12 text-primary" />,
      t('inviteAccept.alreadyAcceptedTitle'),
      t('inviteAccept.alreadyAcceptedSub'),
      <Button asChild className="brand-gradient border-0 text-white">
        <Link to="/login">{t('inviteAccept.goToLogin')}</Link>
      </Button>,
    );
  } else {
    content = (
      <Card className="w-full max-w-lg shadow-xl border-border/80">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1.5 py-1">
              <Building2 className="h-3.5 w-3.5" />
              {info.organization_name || t('inviteAccept.orgDefault')}
            </Badge>
            {info.area_key && (
              <Badge variant="outline" className="text-xs uppercase tracking-wider">
                {info.area_key}
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('inviteAccept.title', { name: info.full_name })}
          </CardTitle>
          <CardDescription>
            {t('inviteAccept.subtitle', { org: info.organization_name || t('inviteAccept.orgDefault') })}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleAccept}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="invitee-email">{t('inviteAccept.labelEmail')}</Label>
              <div className="relative">
                <Input
                  id="invitee-email"
                  type="email"
                  value={info.email}
                  disabled
                  className="bg-muted/50 pl-9 font-mono text-xs"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invitee-name">{t('inviteAccept.labelName')}</Label>
              <Input
                id="invitee-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('inviteAccept.placeholderName')}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={submitting}
              className="brand-gradient w-full border-0 text-white font-medium shadow-md transition-all hover:opacity-95"
              size="lg"
            >
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('inviteAccept.submitting')}
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {t('inviteAccept.submitCta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('inviteAccept.footerNote')}
            </p>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-4 md:px-8 border-b">
        <BrandLogo compact />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        {content}
      </main>

      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        {t('landing.footer')}
      </footer>
    </div>
  );
}
