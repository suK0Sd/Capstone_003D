import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Copy,
  Mail,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  Waypoints,
} from 'lucide-react';
import { ApiError } from '@/api/client';
import { createInvitation, deleteInvitation, fetchAreas, fetchTeam, resendInvitation } from '@/api';
import type { InvitationOut } from '@/api/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAssessment } from '@/store/assessmentStore';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const variant =
    status === 'active' || status === 'accepted'
      ? 'default'
      : status === 'expired' || status === 'disabled'
        ? 'destructive'
        : 'secondary';
  const memberKeys = ['active', 'invited', 'pending', 'disabled'];
  const label = memberKeys.includes(status)
    ? t(`team.memberStatus.${status}`)
    : t(`team.invStatus.${status}`, { defaultValue: status });
  return (
    <Badge
      variant={variant}
      className={cn(
        'text-[10px] px-2 py-0.5 font-bold',
        (status === 'active' || status === 'accepted') && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      )}
    >
      {label}
    </Badge>
  );
}

/** Team & collaboration: members, invitations (invite/resend/revoke), delegation info. */
export default function Team() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { assessment } = useAssessment();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [toRevoke, setToRevoke] = useState<InvitationOut | null>(null);
  const [notice, setNotice] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  // Invite form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [areaKey, setAreaKey] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyInviteLink(inv: InvitationOut) {
    const url = `${window.location.origin}/invite/${inv.invitation_id}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(inv.invitation_id);
      setNotice({ kind: 'info', text: t('team.linkCopied', { email: inv.email }) });
      setTimeout(() => setCopiedId(null), 2500);
    });
  }

  const teamQuery = useQuery({ queryKey: ['team'], queryFn: fetchTeam });
  const areasQuery = useQuery({
    queryKey: ['areas', assessment?.id],
    queryFn: () => fetchAreas(assessment!.id),
    enabled: !!assessment,
  });
  const areas = areasQuery.data?.items ?? [];
  const areaName = (key?: string | null) =>
    key ? (areas.find((a) => a.area_key === key)?.name ?? key) : t('team.areaGeneral');

  const inviteMutation = useMutation({
    mutationFn: () =>
      createInvitation({
        email: email.trim(),
        full_name: fullName.trim() || email.trim(),
        whatsapp: whatsapp.trim() || undefined,
        phone: phone.trim() || undefined,
        area_key: areaKey && areaKey !== 'general' ? areaKey : null,
      }),
    onSuccess: () => {
      setNotice({ kind: 'info', text: t('team.inviteSuccess', { email }) });
      setInviteOpen(false);
      setFullName('');
      setEmail('');
      setWhatsapp('');
      setPhone('');
      setAreaKey('');
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (err) => {
      let text = t('team.inviteGenericError');
      if (err instanceof ApiError && err.status === 409) {
        text = t('team.inviteConflict');
      }
      setNotice({ kind: 'error', text });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (invId: string) => resendInvitation(invId),
    onSuccess: () => {
      setNotice({ kind: 'info', text: t('team.resendSuccess') });
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: () => setNotice({ kind: 'error', text: t('team.resendError') }),
  });

  const revokeMutation = useMutation({
    mutationFn: (invId: string) => deleteInvitation(invId),
    onSuccess: () => {
      setToRevoke(null);
      setNotice({ kind: 'info', text: t('team.revokeSuccess') });
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: () => setNotice({ kind: 'error', text: t('team.revokeError') }),
  });

  const team = teamQuery.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Waypoints className="h-3 w-3" />
              Módulo 5: Equipo y Colaboración
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('team.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('team.sub')}
          </p>
        </div>

        <Button
          onClick={() => setInviteOpen(true)}
          className="brand-gradient text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          {t('team.inviteCta')}
        </Button>
      </div>

      {notice && (
        <Alert
          variant={notice.kind === 'error' ? 'destructive' : 'default'}
          className="rounded-2xl"
        >
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}

      {/* Miembros Activos */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">{t('team.membersTitle')}</h2>
            <Badge variant="secondary" className="text-xs font-semibold">
              {team?.items.length ?? 0}
            </Badge>
          </div>
        </div>

        {teamQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : !team?.items.length ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-bold">No hay miembros registrados</EmptyTitle>
              <EmptyDescription className="text-xs">
                Invita a los líderes de tus 7 áreas funcionales para delegar secciones del assessment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">{t('team.thMember')}</TableHead>
                  <TableHead className="font-bold">{t('team.thRole')}</TableHead>
                  <TableHead className="font-bold">{t('team.thArea')}</TableHead>
                  <TableHead className="font-bold">{t('team.thStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.items.map((m) => {
                  const displayName = m.name || m.email || 'Miembro';
                  const initials = displayName
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <TableRow key={m.member_id} className="hover:bg-muted/30 text-xs">
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl brand-gradient text-white text-xs font-bold shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{m.name || '—'}</p>
                            <p className="text-[11px] text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {t(`team.roles.${m.role}`, { defaultValue: m.role })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {areaName(m.area_key)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SpotlightCard>

      {/* Invitaciones Pendientes */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">{t('team.invitationsTitle')}</h2>
            <Badge variant="secondary" className="text-xs font-semibold">
              {team?.invitations.length ?? 0}
            </Badge>
          </div>
        </div>

        {teamQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : !team?.invitations.length ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No tienes invitaciones pendientes de aceptación.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">{t('team.thEmail')}</TableHead>
                  <TableHead className="font-bold">{t('team.thArea')}</TableHead>
                  <TableHead className="font-bold">{t('team.thStatus')}</TableHead>
                  <TableHead className="text-right font-bold">{t('team.thActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.invitations.map((inv) => (
                  <TableRow key={inv.invitation_id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-semibold text-foreground">
                      <p>{inv.email}</p>
                      {inv.full_name && (
                        <p className="text-[11px] text-muted-foreground">{inv.full_name}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{areaName(inv.area_key)}</TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyInviteLink(inv)}
                        className="h-7 px-2 text-xs rounded-lg text-primary hover:bg-primary/10 cursor-pointer"
                        title="Copiar enlace"
                      >
                        {copiedId === inv.invitation_id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resendMutation.mutate(inv.invitation_id)}
                        disabled={resendMutation.isPending}
                        className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Reenviar correo"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToRevoke(inv)}
                        className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Revocar invitación"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SpotlightCard>

      {/* Modal de Invitación */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{t('team.modalTitle')}</DialogTitle>
            <DialogDescription className="text-xs">
              {t('team.modalSub')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="inv-name" className="text-xs font-semibold">{t('team.formName')}</Label>
              <Input
                id="inv-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Constanza Silva"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="inv-email" className="text-xs font-semibold">{t('team.formEmail')} *</Label>
              <Input
                id="inv-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="constanza@empresa.com"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="inv-wa" className="text-xs font-semibold">{t('team.formWhatsapp')}</Label>
                <Input
                  id="inv-wa"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inv-phone" className="text-xs font-semibold">{t('team.formPhone')}</Label>
                <Input
                  id="inv-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 2 2345 6789"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="inv-area" className="text-xs font-semibold">{t('team.formArea')}</Label>
              <Select value={areaKey} onValueChange={setAreaKey}>
                <SelectTrigger id="inv-area" className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder={t('team.areaGeneral')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('team.areaGeneral')}</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.area_key} value={a.area_key}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)} className="text-xs rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              className="brand-gradient text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer"
              disabled={!email.trim() || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {inviteMutation.isPending ? t('common.loading') : t('team.modalSend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para revocar invitación */}
      <AlertDialog open={!!toRevoke} onOpenChange={(open) => !open && setToRevoke(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">{t('team.revokeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {t('team.revokeConfirmDesc', { email: toRevoke?.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs rounded-xl"
              onClick={() => toRevoke && revokeMutation.mutate(toRevoke.invitation_id)}
            >
              {t('team.revokeConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
