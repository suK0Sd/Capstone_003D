import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from 'lucide-react';
import { createReview, fetchReview, submitReviewRating } from '@/api';
import type { ReviewOut } from '@/api/types';
import { isRatingComplete } from '@/lib/reviewRating';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Textarea } from '@/components/ui/textarea';
import { useAssessment } from '@/store/assessmentStore';
import { cn } from '@/lib/utils';

const reviewKey = (assessmentId: string) => `tryaigap.review.${assessmentId}`;
const ratedKey = (reviewId: string) => `tryaigap.rated.${reviewId}`;

function ScorePicker({
  value,
  onChange,
  labels,
  idPrefix,
}: {
  value: number | null;
  onChange: (v: number) => void;
  labels: string[];
  idPrefix: string;
}) {
  return (
    <div className="flex gap-1.5" role="radiogroup">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          id={`${idPrefix}-${v}`}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`${v} — ${labels[v - 1] ?? ''}`}
          onClick={() => onChange(v)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer',
            value === v
              ? 'brand-gradient text-white shadow-md ring-2 ring-primary/30 border-0'
              : 'border-border/70 bg-card/60 hover:border-primary/50 text-foreground hover:bg-muted/40',
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function ReviewStatus({ review, onRated }: { review: ReviewOut; onRated: (avg: number) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const stages = t('review.stages', { returnObjects: true }) as string[];
  const scaleLabels = t('evaluation.labels', { returnObjects: true }) as string[];

  const [ratingOpen, setRatingOpen] = useState(false);
  const [knowledge, setKnowledge] = useState<number | null>(null);
  const [friendliness, setFriendliness] = useState<number | null>(null);
  const [methodology, setMethodology] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [ratingError, setRatingError] = useState(false);
  const [ratedAvg, setRatedAvg] = useState<number | null>(null);

  const currentStage = review.stage >= 2 ? 2 : review.stage >= 1 ? 1 : 0;
  const validatedCount = review.chapters.filter((c) => c.validated).length;

  const ratingMutation = useMutation({
    mutationFn: () =>
      submitReviewRating(review.review_id, {
        chapter_key: 'overall',
        knowledge,
        friendliness,
        methodology,
        comments: comments.trim() || null,
      }),
    onSuccess: (res) => {
      localStorage.setItem(ratedKey(review.review_id), String(res.average));
      setRatedAvg(res.average);
      setRatingOpen(false);
      onRated(res.average);
      void queryClient.invalidateQueries({ queryKey: ['review', review.review_id] });
    },
    onError: () => setRatingError(true),
  });

  const storedAvg = Number(localStorage.getItem(ratedKey(review.review_id)) ?? Number.NaN);

  return (
    <div className="space-y-6">
      {/* Stepper de 3 Fases de la Revisión */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Estado de la sesión
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Acompañamiento con Consultor Sénior
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stages.map((st, i) => {
            const active = i === currentStage;
            const done = i < currentStage;
            return (
              <div
                key={st}
                className={cn(
                  'rounded-xl border p-4 transition-all flex items-center gap-3',
                  active
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                    : done
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                      : 'border-border/60 bg-card/40 opacity-60 text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0',
                    active
                      ? 'brand-gradient text-white'
                      : done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{st}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {i === 0 ? 'Agenda coordinada' : i === 1 ? 'Sesión de 90 min' : 'Resultados calibrados'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tarjeta de Consultor Asignado */}
        <div className="rounded-xl border border-border/70 bg-card/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient text-white shadow-md text-lg font-bold">
              {review.consultant ? review.consultant.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'CS'}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consultor Sénior Asignado</p>
              <h3 className="text-sm font-bold text-foreground">{review.consultant || 'Especialista TryAIGap'}</h3>
              <p className="text-[11px] text-muted-foreground">consultoria@tryaigap.com</p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-muted-foreground space-y-1">
            <p className="flex items-center sm:justify-end gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Duración: 90 minutos
            </p>
            <p className="flex items-center sm:justify-end gap-1.5">
              <CalendarCheck2 className="h-3.5 w-3.5 text-primary" />
              Sesión síncrona / Asíncrona
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* Checklist de Capítulos Validados */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground">{t('review.chaptersTitle')}</h2>
            <p className="text-xs text-muted-foreground">Revisión y calibración técnica de cada entregable metodológico.</p>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold">
            {validatedCount} de {review.chapters.length} validados
          </Badge>
        </div>

        <div className="space-y-2.5">
          {review.chapters.map((ch) => (
            <div
              key={ch.chapter_key}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 text-xs transition-all',
                ch.validated
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border/60 bg-card/40',
              )}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    {t(`review.chapters.${ch.chapter_key}`, { defaultValue: ch.chapter_key })}
                  </span>
                  {ch.validated ? (
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Validado por consultor
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Pendiente de sesión
                    </Badge>
                  )}
                </div>
                {ch.note && (
                  <p className="text-[11px] text-muted-foreground mt-1 bg-card/60 p-2 rounded-lg border border-border/40">
                    <strong>Notas:</strong> {ch.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* Sección de Evaluación del Consultor */}
      {(review.stage >= 2 || !Number.isNaN(storedAvg)) && (
        <SpotlightCard className="rounded-2xl border border-primary/30 bg-card/90 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">{t('review.ratingTitle')}</h2>
              <p className="text-xs text-muted-foreground">Tu retroalimentación nos ayuda a asegurar el más alto rigor de consultoría.</p>
            </div>
            {(!Number.isNaN(storedAvg) || ratedAvg !== null) && (
              <Badge className="brand-gradient text-white border-0 text-xs px-2.5 py-1">
                <Star className="h-3.5 w-3.5 mr-1 fill-white" />
                {(ratedAvg ?? storedAvg).toFixed(1)} / 5.0
              </Badge>
            )}
          </div>

          {!ratingOpen && !ratedAvg && Number.isNaN(storedAvg) && (
            <Button
              onClick={() => setRatingOpen(true)}
              className="brand-gradient text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer"
            >
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Evaluar sesión de consultoría
            </Button>
          )}

          {ratingOpen && (
            <div className="space-y-4 pt-2 text-xs">
              {ratingError && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>Ocurrió un error al enviar la evaluación. Intenta nuevamente.</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Dominio metodológico</Label>
                  <ScorePicker
                    value={knowledge}
                    onChange={setKnowledge}
                    labels={scaleLabels}
                    idPrefix="score-knowledge"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Claridad y trato</Label>
                  <ScorePicker
                    value={friendliness}
                    onChange={setFriendliness}
                    labels={scaleLabels}
                    idPrefix="score-friendliness"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Utilidad de recomendaciones</Label>
                  <ScorePicker
                    value={methodology}
                    onChange={setMethodology}
                    labels={scaleLabels}
                    idPrefix="score-methodology"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review-comments" className="text-xs font-semibold">Comentarios adicionales (opcional)</Label>
                <Textarea
                  id="review-comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Escribe comentarios sobre las recomendaciones o el plan de trabajo..."
                  className="text-xs rounded-xl"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  className="brand-gradient text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer"
                  disabled={!isRatingComplete({ knowledge, friendliness, methodology }) || ratingMutation.isPending}
                  onClick={() => ratingMutation.mutate()}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {ratingMutation.isPending ? t('common.loading') : 'Enviar evaluación'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRatingOpen(false)} className="text-xs rounded-xl">
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </SpotlightCard>
      )}
    </div>
  );
}

/** Human review landing: booking or status + chapters + rating. */
export default function Review() {
  const { t } = useTranslation();
  const { assessment } = useAssessment();

  const existingReviewId = assessment ? localStorage.getItem(reviewKey(assessment.id)) : null;

  const reviewQuery = useQuery({
    queryKey: ['review', existingReviewId],
    queryFn: () => fetchReview(existingReviewId!),
    enabled: !!existingReviewId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createReview({
        assessment_id: assessment!.id,
        mode: 'sync',
      }),
    onSuccess: (data) => {
      localStorage.setItem(reviewKey(assessment!.id), data.review_id);
      void reviewQuery.refetch();
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <ShieldCheck className="h-3 w-3" />
              Módulo 7: Revisión Supervisada
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('review.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('review.sub')}
          </p>
        </div>
      </div>

      {assessment?.plan === 'free' && (
        <SpotlightCard className="rounded-2xl border border-primary/40 bg-card/90 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Acompañamiento exclusivo del Plan Pro</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-lg">
                  La sesión de 90 minutos con un consultor sénior para calibración y plan de acción directivo requiere el Plan Pro.
                </p>
              </div>
            </div>
            <Button asChild className="brand-gradient text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer">
              <Link to="/estimator">{t('dashboard.upgradeCta')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {reviewQuery.data ? (
        <ReviewStatus
          review={reviewQuery.data}
          onRated={() => void reviewQuery.refetch()}
        />
      ) : assessment?.plan !== 'free' ? (
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-white shadow-lg">
              <UserCheck className="h-7 w-7" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Solicita tu sesión de 90 minutos</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Un consultor sénior TryAIGap revisará tus respuestas, calibrará tus puntuaciones y te entregará recomendaciones ejecutivas defendibles.
            </p>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="brand-gradient text-white font-bold text-xs h-11 px-6 rounded-xl shadow-lg cursor-pointer"
          >
            <CalendarCheck2 className="h-4 w-4 mr-1.5" />
            {createMutation.isPending ? t('common.loading') : 'Agendar sesión de revisión'}
          </Button>
        </SpotlightCard>
      ) : null}
    </div>
  );
}
