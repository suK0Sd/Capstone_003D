import { useAssessmentStore } from '@/store/assessmentStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock } from 'lucide-react';
import { getDemoPlan, setDemoPlan } from '@/api/mockData';

export function PlanDemoToggle() {
  const assessment = useAssessmentStore((s) => s.assessment);
  const setAssessment = useAssessmentStore((s) => s.setAssessment);

  const currentPlan = assessment?.plan ?? getDemoPlan();
  const isPro = currentPlan === 'pro';

  const toggle = () => {
    const nextPlan = isPro ? 'free' : 'pro';
    setDemoPlan(nextPlan);
    if (assessment) {
      setAssessment({ ...assessment, plan: nextPlan });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      title="Alternar entre Plan Free y Plan PRO (Modo Demo)"
      className="inline-flex items-center gap-1.5 h-8 text-xs font-medium border-dashed cursor-pointer"
    >
      {isPro ? (
        <>
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden md:inline">Cuenta:</span>
          <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-amber-500 hover:bg-amber-600 font-bold">
            PRO
          </Badge>
        </>
      ) : (
        <>
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden md:inline">Cuenta:</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
            FREE
          </Badge>
        </>
      )}
    </Button>
  );
}
