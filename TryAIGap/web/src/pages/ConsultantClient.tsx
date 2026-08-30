import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Send, Sparkles, StickyNote } from 'lucide-react';
import { createConsultantNote, fetchConsultantClient } from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Textarea } from '@/components/ui/textarea';

interface PostedNote {
  note_id: string;
  body: string;
  created_at: string;
}

/** Consultant client detail: org snapshot, maturity dimensions, notes. */
export default function ConsultantClient() {
  const { t, i18n } = useTranslation();
  const { clientId } = useParams<{ clientId: string }>();
  const [noteBody, setNoteBody] = useState('');
  const [postedNotes, setPostedNotes] = useState<PostedNote[]>([]);

  const clientQuery = useQuery({
    queryKey: ['consultant', 'client', clientId],
    queryFn: () => fetchConsultantClient(clientId!),
    enabled: !!clientId,
  });

  const noteMutation = useMutation({
    mutationFn: () => createConsultantNote(clientId!, noteBody.trim()),
    onSuccess: (res) => {
      setPostedNotes((prev) => [
        { note_id: res.note_id, body: noteBody.trim(), created_at: res.created_at },
        ...prev,
      ]);
      setNoteBody('');
    },
  });

  const client = clientQuery.data;
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.language],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-xs rounded-xl cursor-pointer">
        <Link to="/consultant">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {t('consultant.back')}
        </Link>
      </Button>

      {clientQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      )}

      {client && (
        <>
          {/* Client Snapshot Card */}
          <SpotlightCard className="rounded-2xl border border-primary/40 bg-card/95 p-6 shadow-md backdrop-blur-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient text-white shadow-md text-lg font-bold">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{client.name}</h1>
                  <p className="text-xs text-muted-foreground">{t('consultant.detail')}</p>
                </div>
              </div>
              <Badge
                variant={client.plan === 'pro' ? 'default' : 'outline'}
                className={client.plan === 'pro' ? 'brand-gradient text-white border-0 text-xs px-2.5 py-0.5' : 'text-xs px-2.5 py-0.5'}
              >
                {client.plan === 'pro' ? 'Plan Pro' : t('consultant.plans.free')}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('consultant.progressLabel')}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Progress value={client.progress} className="h-2 flex-1" />
                  <span className="text-xs font-bold text-foreground">{client.progress}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('consultant.maturityLabel')}</p>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {client.maturity != null ? `${client.maturity.toFixed(1)} / 5.0` : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('common.status')}</p>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {t(
                    `consultant.statuses.${
                      client.status === 'in_progress'
                        ? 'inprog'
                        : client.status === 'completed'
                          ? 'done'
                          : client.status === 'lead'
                            ? 'lead'
                            : 'stalled'
                    }`,
                  )}
                </p>
              </div>
            </div>
          </SpotlightCard>

          {/* Maturity Dimension Bars */}
          <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">{t('consultant.dims')}</h2>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                5 Dimensiones
              </Badge>
            </div>

            <div className="space-y-4 pt-1">
              {client.dimensions.map((d) => (
                <div key={d.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-foreground">{d.label}</span>
                    <span className="font-extrabold text-foreground">{d.score.toFixed(1)} / 5.0</span>
                  </div>
                  <Progress value={(d.score / 5) * 100} className="h-2 bg-muted/60" />
                </div>
              ))}
            </div>
          </SpotlightCard>

          {/* Consultant Notes Card */}
          <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <StickyNote className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-base font-bold text-foreground">{t('consultant.notesTitle')}</h2>
                <p className="text-xs text-muted-foreground">Notas internas de seguimiento y acuerdos de sesión.</p>
              </div>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (noteBody.trim()) noteMutation.mutate();
              }}
            >
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder={t('consultant.notePh')}
                rows={3}
                className="text-xs rounded-xl"
                aria-label={t('consultant.notePh')}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="brand-gradient text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer"
                  disabled={!noteBody.trim() || noteMutation.isPending}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {noteMutation.isPending ? t('common.loading') : t('consultant.noteSend')}
                </Button>
              </div>
            </form>

            {noteMutation.isSuccess && (
              <Alert className="rounded-xl py-2 px-3 text-xs">
                <AlertDescription>{t('consultant.noteSaved')}</AlertDescription>
              </Alert>
            )}

            {postedNotes.length > 0 && (
              <div className="space-y-2 pt-2">
                {postedNotes.map((n) => (
                  <div key={n.note_id} className="rounded-xl border border-border/70 bg-card/60 p-3 text-xs space-y-1">
                    <p className="text-foreground">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {dateFmt.format(new Date(n.created_at))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>
        </>
      )}
    </div>
  );
}
