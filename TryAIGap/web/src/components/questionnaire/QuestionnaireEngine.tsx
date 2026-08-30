/**
 * Questionnaire engine shared by the maturity diagnostic and the area kits.
 * Flow per wireframe-v2.html: question → block summary → module summary,
 * 1-5 scale + "No sé" + per-question delegation, debounced autosave,
 * freemium gating on the free plan (maturity module only).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  GitBranch,
  HelpCircle,
  Lock,
  Paperclip,
  Save,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { fetchQuestionnaire } from '@/api';
import type { QuestionnaireOut } from '@/api/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { DelegateDialog } from '@/components/questionnaire/DelegateDialog';
import { MaturityRadar } from '@/components/questionnaire/MaturityRadar';
import { useQuestionnaireAnswers } from '@/hooks/useQuestionnaireAnswers';
import {
  averageScore,
  countAnswered,
  levelIndex,
  type AnswersMap,
} from '@/lib/answers';
import {
  canAnswerQuestion,
  FREE_MATURITY_LIMIT,
  freeMaturityLimitReached,
} from '@/lib/planGate';
import { useAssessmentStore } from '@/store/assessmentStore';
import { cn } from '@/lib/utils';

interface UiQuestion {
  id: string;
  code: string;
  text: string;
}

interface UiBlock {
  id: string;
  title: string;
  dim: string;
  questions: UiQuestion[];
}

interface QbankQuestion {
  id: string;
  text: string;
}

interface QbankBlock {
  id: string;
  title: string;
  dim?: string;
  questions: QbankQuestion[];
}

interface QbankModule {
  moduleLabel?: string;
  blocks: QbankBlock[];
}

type View = 'question' | 'block' | 'module';

interface QuestionnaireEngineProps {
  module: 'maturity' | 'area';
  areaKey?: string;
  moduleLabel: string;
}

function getDimensionIcon(dim: string) {
  const d = dim.toLowerCase();
  if (d.includes('dato') || d.includes('data')) return Database;
  if (d.includes('tecno') || d.includes('tech')) return Cpu;
  if (d.includes('talento') || d.includes('talent')) return Users;
  if (d.includes('proceso') || d.includes('process') || d.includes('operac')) return GitBranch;
  return Sparkles;
}

export function QuestionnaireEngine({ module, areaKey, moduleLabel }: QuestionnaireEngineProps) {
  const { t, i18n } = useTranslation();
  const { t: tq } = useTranslation('qbank');
  const navigate = useNavigate();
  const assessment = useAssessmentStore((s) => s.assessment);

  const [blockIdx, setBlockIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [view, setView] = useState<View>('question');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [delegatedNames, setDelegatedNames] = useState<Record<string, string>>({});

  const qQuery = useQuery<QuestionnaireOut>({
    queryKey: ['questionnaire', module, areaKey ?? null, i18n.language],
    queryFn: () => fetchQuestionnaire(module, areaKey),
  });

  const {
    answers,
    setAnswer,
    saveStatus,
    saveNow,
    paywallHit,
    loading: answersLoading,
  } = useQuestionnaireAnswers(assessment?.id, { module, areaKey });

  /** API questionnaire overlaid with qbank copy (full 4-locale coverage). */
  const blocks = useMemo<UiBlock[]>(() => {
    if (!qQuery.data) return [];
    const bankRaw: unknown =
      module === 'maturity' ? tq('maturity') : tq(`areas.${areaKey ?? ''}`);
    let bankBlocks: QbankBlock[] = [];
    if (module === 'maturity') {
      const m = bankRaw as QbankModule;
      if (m && typeof m === 'object' && Array.isArray(m.blocks)) bankBlocks = m.blocks;
    } else if (Array.isArray(bankRaw)) {
      bankBlocks = bankRaw as QbankBlock[];
    }
    return qQuery.data.blocks.map((b, bi) => {
      const qb = bankBlocks[bi];
      return {
        id: b.id,
        title: qb?.title ?? b.title ?? b.id,
        dim: qb?.dim ?? b.dimension ?? qb?.title ?? b.title ?? b.id,
        questions: b.questions.map((q) => ({
          id: q.id,
          code: q.code,
          text: qb?.questions?.find((x) => x.id === q.code)?.text ?? q.text ?? '',
        })),
      };
    });
  }, [qQuery.data, module, areaKey, tq]);

  const allQids = useMemo(() => blocks.flatMap((b) => b.questions.map((q) => q.id)), [blocks]);
  const total = allQids.length;
  const answered = countAnswered(answers, allQids);
  const plan = assessment?.plan ?? 'free';
  const isFreeMaturity = module === 'maturity' && plan === 'free';
  const limitReached = isFreeMaturity && freeMaturityLimitReached(plan, answered);

  const block = blocks.length > 0 ? blocks[Math.min(blockIdx, blocks.length - 1)] : undefined;
  const question =
    block && block.questions.length > 0
      ? block.questions[Math.min(qIdx, block.questions.length - 1)]
      : undefined;
  const stored = question ? answers[question.id] : undefined;

  function ordinal(): number {
    let ord = 0;
    for (let i = 0; i < blockIdx; i++) ord += blocks[i]?.questions.length ?? 0;
    return ord + qIdx + 1;
  }

  function guardFree(q: UiQuestion): boolean {
    if (!isFreeMaturity) return true;
    if (canAnswerQuestion(plan, answered, !!answers[q.id])) return true;
    setPaywallOpen(true);
    return false;
  }

  function handleScale(v: number) {
    if (!question || !guardFree(question)) return;
    setAnswer(question.id, { value: v, state: 'answered' });
  }

  function handleIdk() {
    if (!question || !guardFree(question)) return;
    setAnswer(question.id, { value: null, state: 'idk' });
  }

  function handleDelegated(name: string) {
    if (!question) return;
    setDelegatedNames((m) => ({ ...m, [question.id]: name }));
    setAnswer(question.id, { value: null, state: 'delegated' });
  }

  function goPrev() {
    if (view === 'block') {
      setView('question');
      return;
    }
    if (view === 'module') {
      setBlockIdx(blocks.length - 1);
      setQIdx((blocks[blocks.length - 1]?.questions.length ?? 1) - 1);
      setView('question');
      return;
    }
    if (qIdx > 0) setQIdx(qIdx - 1);
    else if (blockIdx > 0) {
      setBlockIdx(blockIdx - 1);
      setQIdx((blocks[blockIdx - 1]?.questions.length ?? 1) - 1);
    }
  }

  function goNext() {
    if (block && qIdx < block.questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      void saveNow();
      setView('block');
    }
  }

  function continueFromBlock() {
    if (blockIdx >= blocks.length - 1) {
      setView('module');
    } else {
      setBlockIdx(blockIdx + 1);
      setQIdx(0);
      setView('question');
    }
  }

  function gotoBlock(i: number) {
    setBlockIdx(i);
    setQIdx(0);
    setView('question');
  }

  // Atajos de teclado accesibles (WCAG 2.2): teclas 1-5 seleccionan escala, flechas navegan
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (view !== 'question' || delegateOpen || paywallOpen) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '1' && e.key <= '5') {
        const val = parseInt(e.key, 10);
        handleScale(val);
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, delegateOpen, paywallOpen, blockIdx, qIdx, question]);

  if (qQuery.isLoading || answersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (qQuery.error || blocks.length === 0 || !block || !question) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertDescription>{t('common.errorGeneric')}</AlertDescription>
      </Alert>
    );
  }

  const levels = t('questionnaire.levels', { returnObjects: true }) as string[];
  const levelLabel = (score: number) =>
    Array.isArray(levels) ? levels[levelIndex(score)] : '';

  const saveIndicator =
    saveStatus === 'saving'
      ? t('questionnaire.saving')
      : saveStatus === 'saved'
        ? t('questionnaire.saved')
        : saveStatus === 'error'
          ? t('questionnaire.saveError')
          : null;

  const progressPct = Math.round((ordinal() / Math.max(total, 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Freemium banner (maturity, free plan) */}
      {isFreeMaturity && (
        <div className="rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Badge variant="secondary" className="text-[11px] font-semibold">
              {t('freemium.chip')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Math.min(answered, FREE_MATURITY_LIMIT)}/{FREE_MATURITY_LIMIT}{' '}
              {t('freemium.counter')}
            </span>
          </div>
          <Button asChild size="sm" className="brand-gradient border-0 text-white text-xs h-8 rounded-lg">
            <Link to="/estimator">
              <Lock className="h-3.5 w-3.5 mr-1" /> {t('freemium.upgrade')}
            </Link>
          </Button>
        </div>
      )}

      {/* Paywall alert (limit hit interactively or by the server) */}
      {(paywallOpen || paywallHit || (limitReached && view === 'question' && !stored)) && (
        <Alert className="border-primary bg-card/90 rounded-2xl shadow-md">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs sm:text-sm">
              <strong className="text-foreground">{t('paywall.eyebrow')}. </strong>
              <span className="text-muted-foreground">
                {t('freemium.limitReached', { limit: FREE_MATURITY_LIMIT })}
              </span>
            </span>
            <Button asChild size="sm" className="brand-gradient border-0 text-white rounded-lg text-xs h-8">
              <Link to="/estimator">{t('paywall.cta')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Selector de Bloques y Dimensiones con Iconos y Scores */}
      <div className="flex flex-wrap gap-2 items-center">
        {blocks.map((b, i) => {
          const s = averageScore(answers, b.questions.map((q) => q.id));
          const current = i === blockIdx && view === 'question';
          const blockAnswered = b.questions.every((q) => !!answers[q.id]);
          const Icon = getDimensionIcon(b.dim);

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => gotoBlock(i)}
              className={cn(
                'group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer',
                current
                  ? 'border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30'
                  : blockAnswered
                    ? 'border-border/80 bg-card/80 text-foreground hover:border-primary/40'
                    : 'border-border/60 bg-card/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', current ? 'text-primary' : 'text-muted-foreground')} />
              <span>{b.dim}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  s ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {s ? s.toFixed(1) : '—'}
              </span>
              {blockAnswered && <Check className="h-3 w-3 text-primary ml-0.5" />}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setView('module')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ml-auto',
            view === 'module'
              ? 'border-primary bg-primary/15 text-primary ring-1 ring-primary/30'
              : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-muted/40',
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          {t('maturity.viewSummary')}
        </button>
      </div>

      {/* VISTA 1: PREGUNTA ACTIVA */}
      {view === 'question' && question && (
        <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-xl backdrop-blur-xl">
          {/* Header de Pregunta con Progreso */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {question.code}
              </span>
              <span className="text-xs font-bold text-foreground">
                {moduleLabel} · {block.title}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('questionnaire.progress', { n: ordinal(), t: total })} ({progressPct}%)
              </span>
            </div>
          </div>

          <Progress value={progressPct} className="mt-2 h-1.5 bg-muted/60" />

          {/* Texto de la Pregunta */}
          <div className="mt-6 space-y-2">
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground leading-relaxed">
              {question.text}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('questionnaire.scaleHelp')}
            </p>
          </div>

          {/* Escala de Evaluación 1 a 5 con Tarjetas Interactivas */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((v) => {
              const active = stored?.state === 'answered' && stored.value === v;
              const scaleLabels = t('questionnaire.scale', { returnObjects: true }) as string[];
              const labelText = scaleLabels?.[v - 1] ?? `Nivel ${v}`;

              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleScale(v)}
                  aria-pressed={active}
                  className={cn(
                    'group relative flex flex-col items-center justify-between rounded-xl border p-4 text-center transition-all cursor-pointer',
                    active
                      ? 'border-primary bg-primary/15 shadow-md ring-2 ring-primary/40'
                      : 'border-border/70 bg-card/60 hover:border-primary/50 hover:bg-muted/40',
                  )}
                >
                  <div className="flex items-center justify-center">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold transition-colors',
                        active ? 'brand-gradient text-white shadow-md' : 'bg-muted text-foreground group-hover:bg-primary/20 group-hover:text-primary',
                      )}
                    >
                      {v}
                    </span>
                  </div>
                  <span className="mt-2.5 text-xs font-medium text-muted-foreground group-hover:text-foreground leading-tight">
                    {labelText}
                  </span>
                  {active && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Badges de Estado Especial ("No sé" o "Delegado") */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {stored?.state === 'idk' && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs py-1 px-2.5">
                <HelpCircle className="h-3.5 w-3.5 mr-1" /> {t('questionnaire.idkMarked')}
              </Badge>
            )}
            {stored?.state === 'delegated' && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs py-1 px-2.5">
                <Users className="h-3.5 w-3.5 mr-1" />
                {t('questionnaire.delegatedTo', {
                  name: delegatedNames[question.id] ?? '—',
                })}
              </Badge>
            )}
          </div>

          {/* Barra de Herramientas de Pregunta (Adjuntar, Delegar, No sé) */}
          <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-border/50">
            <Button asChild variant="outline" size="sm" className="text-xs h-9 rounded-xl cursor-pointer">
              <Link to="/documents">
                <Paperclip className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                {t('questionnaire.attach')}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (guardFree(question)) setDelegateOpen(true);
              }}
              className="text-xs h-9 rounded-xl cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              {t('questionnaire.delegate')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleIdk}
              className="text-xs h-9 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
              {t('questionnaire.idk')}
            </Button>
          </div>

          {/* Navegación y Guardado */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={blockIdx === 0 && qIdx === 0}
              className="text-xs h-10 px-4 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              {t('questionnaire.back')}
            </Button>

            <div className="flex items-center gap-3">
              {saveIndicator && (
                <span
                  className={cn(
                    'text-xs font-semibold flex items-center gap-1',
                    saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  <Save className="h-3 w-3" />
                  {saveIndicator}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-xs h-10 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {t('questionnaire.saveExit')}
              </Button>
              <Button
                type="button"
                onClick={goNext}
                disabled={!stored}
                className="brand-gradient text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer"
              >
                {t('questionnaire.next')}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* VISTA 2: RESUMEN DE BLOQUE / DIMENSIÓN */}
      {view === 'block' && (
        <BlockSummary
          block={block}
          answers={answers}
          levelLabel={levelLabel}
          isLast={blockIdx >= blocks.length - 1}
          onEdit={goPrev}
          onContinue={continueFromBlock}
        />
      )}

      {/* VISTA 3: RESUMEN GLOBAL DEL MÓDULO */}
      {view === 'module' && (
        <ModuleSummary
          module={module}
          moduleLabel={moduleLabel}
          blocks={blocks}
          answers={answers}
          levelLabel={levelLabel}
          onReview={goPrev}
        />
      )}

      {/* Modal de Delegación */}
      {question && assessment && (
        <DelegateDialog
          open={delegateOpen}
          onOpenChange={setDelegateOpen}
          assessmentId={assessment.id}
          questionId={question.id}
          onSent={handleDelegated}
        />
      )}
    </div>
  );
}

function BlockSummary({
  block,
  answers,
  levelLabel,
  isLast,
  onEdit,
  onContinue,
}: {
  block: UiBlock;
  answers: AnswersMap;
  levelLabel: (score: number) => string;
  isLast: boolean;
  onEdit: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const score = averageScore(answers, block.questions.map((q) => q.id));

  return (
    <SpotlightCard className="mx-auto max-w-3xl rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-xl">
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {t('questionnaire.blockComplete')} · {block.title}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          {block.dim} · <span className="text-primary">{score.toFixed(1)}/5</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t('questionnaire.prelimLevel')}: <strong className="text-foreground">{levelLabel(score)}</strong>
        </p>
      </div>

      <ul className="mt-6 divide-y divide-border/50 rounded-xl border border-border/60 bg-card/40 p-2">
        {block.questions.map((q) => {
          const a = answers[q.id];
          return (
            <li key={q.id} className="flex items-center justify-between gap-4 p-3 text-xs">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{q.code}</strong> · {q.text}
              </span>
              <Badge
                variant={a ? 'secondary' : 'outline'}
                className={cn(
                  'shrink-0 text-xs px-2.5 py-0.5 font-bold',
                  a?.state === 'answered' && 'bg-primary/15 text-primary border-primary/30',
                )}
              >
                {a?.state === 'answered' && typeof a.value === 'number'
                  ? `${a.value} / 5`
                  : a?.state === 'idk'
                    ? t('questionnaire.idkShort')
                    : a?.state === 'delegated'
                      ? t('questionnaire.delegate')
                      : '—'}
              </Badge>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex items-center justify-between pt-4 border-t border-border/60">
        <Button variant="outline" size="sm" onClick={onEdit} className="text-xs h-10 px-4 rounded-xl cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t('questionnaire.editAnswers')}
        </Button>
        <Button onClick={onContinue} className="brand-gradient text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer">
          {isLast ? t('questionnaire.seeModuleSummary') : t('questionnaire.continueBlock')}{' '}
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    </SpotlightCard>
  );
}

function ModuleSummary({
  module,
  moduleLabel,
  blocks,
  answers,
  levelLabel,
  onReview,
}: {
  module: 'maturity' | 'area';
  moduleLabel: string;
  blocks: UiBlock[];
  answers: AnswersMap;
  levelLabel: (score: number) => string;
  onReview: () => void;
}) {
  const { t } = useTranslation();
  const allQids = blocks.flatMap((b) => b.questions.map((q) => q.id));
  const score = averageScore(answers, allQids);
  const answered = countAnswered(answers, allQids);
  const radarData = blocks.map((b) => ({
    dim: b.dim,
    score: Number(averageScore(answers, b.questions.map((q) => q.id)).toFixed(2)),
  }));

  return (
    <SpotlightCard className="mx-auto max-w-4xl rounded-2xl border border-primary/40 bg-card/90 p-6 md:p-8 shadow-2xl">
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {t('questionnaire.moduleComplete')} · {moduleLabel}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {score.toFixed(1)}/5 · <span className="text-primary">{levelLabel(score)}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t('questionnaire.answeredCount', { answered, total: allQids.length })}
        </p>
      </div>

      {module === 'maturity' && (
        <div className="mt-8 rounded-2xl border border-border/70 bg-card/50 p-6">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
            {t('maturity.radarTitle')}
          </h3>
          <MaturityRadar data={radarData} />
        </div>
      )}

      {/* Grid de Dimensiones y Scores */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => {
          const s = averageScore(answers, b.questions.map((q) => q.id));
          const Icon = getDimensionIcon(b.dim);
          return (
            <div key={b.id} className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Icon className="h-4 w-4 text-primary" />
                <span className="truncate">{b.dim}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-foreground">{s ? s.toFixed(1) : '—'}/5</span>
                <span className="text-[11px] text-muted-foreground">{levelLabel(s)}</span>
              </div>
              <Progress value={(s / 5) * 100} className="h-1.5 bg-muted/60" />
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border/60">
        <Button variant="outline" size="sm" onClick={onReview} className="text-xs h-10 px-4 rounded-xl cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {t('questionnaire.editAnswers')}
        </Button>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="text-xs h-10 px-4 rounded-xl cursor-pointer">
            <Link to="/areas">
              {module === 'area' ? t('questionnaire.backAreas') : t('questionnaire.continueAreas')}
            </Link>
          </Button>
          <Button asChild size="sm" className="brand-gradient text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-md cursor-pointer">
            <Link to="/results">
              {t('questionnaire.seeResults')} <Check className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </SpotlightCard>
  );
}
