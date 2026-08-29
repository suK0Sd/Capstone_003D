import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bot, Cpu, Database, Network, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface DimensionConfig {
  key: 'data' | 'tech' | 'talent' | 'processes' | 'culture';
  icon: React.ComponentType<{ className?: string }>;
  defaultVal: number;
}

const DIMENSIONS: DimensionConfig[] = [
  { key: 'data', icon: Database, defaultVal: 55 },
  { key: 'tech', icon: Cpu, defaultVal: 60 },
  { key: 'talent', icon: Users, defaultVal: 45 },
  { key: 'processes', icon: Network, defaultVal: 50 },
  { key: 'culture', icon: ShieldCheck, defaultVal: 65 },
];

export function LandingInteractiveRadar() {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, number>>({
    data: 55,
    tech: 60,
    talent: 45,
    processes: 50,
    culture: 65,
  });

  const handleSliderChange = (key: string, val: number[]) => {
    setValues((prev) => ({ ...prev, [key]: val[0] ?? 0 }));
  };

  const avgScore = useMemo(() => {
    const sum = Object.values(values).reduce((acc, v) => acc + v, 0);
    return Math.round(sum / Object.keys(values).length);
  }, [values]);

  // Level classification based on TryAIGap 4-level maturity matrix
  const levelInfo = useMemo(() => {
    if (avgScore >= 76) {
      return {
        level: 4,
        label: t('landing.demo.levels.l4'),
        variant: 'default' as const,
        badgeClass: 'brand-gradient text-white border-0',
        desc: t('landing.demo.levels.l4Desc'),
      };
    }
    if (avgScore >= 51) {
      return {
        level: 3,
        label: t('landing.demo.levels.l3'),
        variant: 'secondary' as const,
        badgeClass: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
        desc: t('landing.demo.levels.l3Desc'),
      };
    }
    if (avgScore >= 26) {
      return {
        level: 2,
        label: t('landing.demo.levels.l2'),
        variant: 'outline' as const,
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        desc: t('landing.demo.levels.l2Desc'),
      };
    }
    return {
      level: 1,
      label: t('landing.demo.levels.l1'),
      variant: 'outline' as const,
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      desc: t('landing.demo.levels.l1Desc'),
    };
  }, [avgScore, t]);

  const center = 150;
  const maxR = 95;

  const angles = useMemo(() => {
    return [0, 1, 2, 3, 4].map((i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);
  }, []);

  const getPentagonPoints = (radiusPct: number) => {
    return angles
      .map((ang) => {
        const x = center + maxR * radiusPct * Math.cos(ang);
        const y = center + maxR * radiusPct * Math.sin(ang);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const dynamicPoints = useMemo(() => {
    const dimKeys: Array<'data' | 'tech' | 'talent' | 'processes' | 'culture'> = [
      'data',
      'tech',
      'talent',
      'processes',
      'culture',
    ];
    return dimKeys
      .map((k, idx) => {
        const valPct = (values[k] ?? 50) / 100;
        const r = maxR * valPct;
        const ang = angles[idx];
        const x = center + r * Math.cos(ang);
        const y = center + r * Math.sin(ang);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values, angles]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <Card className="border border-border/80 shadow-lg bg-card/60 backdrop-blur-sm overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full brand-gradient text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-extrabold">
            {t('landing.demo.title')}
          </CardTitle>
          <CardDescription className="max-w-2xl mx-auto text-sm md:text-base">
            {t('landing.demo.sub')}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Left Controls (5 Official Dimensions) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('landing.demo.controlsHeading')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('landing.demo.controlsHint')}
                </span>
              </div>

              {DIMENSIONS.map((dim) => {
                const Icon = dim.icon;
                const val = values[dim.key] ?? 0;
                return (
                  <div key={dim.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs sm:text-sm">{t(`landing.demo.dims.${dim.key}`)}</span>
                      </div>
                      <span className="font-bold tabular-nums text-primary text-xs sm:text-sm">{val}%</span>
                    </div>
                    <Slider
                      value={[val]}
                      min={10}
                      max={100}
                      step={5}
                      aria-label={t(`landing.demo.dims.${dim.key}`)}
                      onValueChange={(v) => handleSliderChange(dim.key, v)}
                      className="cursor-pointer"
                    />
                  </div>
                );
              })}

              <div className="rounded-lg bg-muted/50 p-3.5 border border-border/50 flex items-start gap-3 mt-3">
                <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">{t('landing.demo.insightTitle')}</p>
                  <p className="text-muted-foreground leading-relaxed">{levelInfo.desc}</p>
                </div>
              </div>
            </div>

            {/* Right Visualizer (Pentagonal Radar) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-xl brand-gradient-soft border border-border/40 text-center">
              {/* SVG Pentagonal Dynamic Radar */}
              <div className="relative w-68 h-68 flex items-center justify-center">
                <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                  {/* Concentric Pentagons (25%, 50%, 75%, 100%) */}
                  <polygon points={getPentagonPoints(0.25)} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <polygon points={getPentagonPoints(0.5)} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
                  <polygon points={getPentagonPoints(0.75)} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />
                  <polygon points={getPentagonPoints(1.0)} fill="none" stroke="currentColor" strokeOpacity="0.25" />

                  {/* 5 Axes from center to outer vertices */}
                  {angles.map((ang, i) => (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={center + maxR * Math.cos(ang)}
                      y2={center + maxR * Math.sin(ang)}
                      stroke="currentColor"
                      strokeOpacity="0.2"
                    />
                  ))}

                  {/* Dynamic Filled Polygon */}
                  <polygon
                    points={dynamicPoints}
                    className="fill-[#C9359F]/25 stroke-[#14B8A6] stroke-2 transition-all duration-300 ease-out"
                  />

                  {/* Vertex Dots */}
                  {dynamicPoints.split(' ').map((pt, i) => {
                    const [x, y] = pt.split(',').map(Number);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        className={i % 2 === 0 ? 'fill-[#C9359F]' : 'fill-[#14B8A6]'}
                      />
                    );
                  })}

                  {/* 5 Axis Labels positioned around the pentagon */}
                  <text x="150" y="32" textAnchor="middle" className="text-[11px] fill-foreground font-semibold">
                    {t('landing.demo.axes.data')}
                  </text>
                  <text x="268" y="122" textAnchor="start" className="text-[11px] fill-foreground font-semibold">
                    {t('landing.demo.axes.tech')}
                  </text>
                  <text x="220" y="270" textAnchor="middle" className="text-[11px] fill-foreground font-semibold">
                    {t('landing.demo.axes.talent')}
                  </text>
                  <text x="80" y="270" textAnchor="middle" className="text-[11px] fill-foreground font-semibold">
                    {t('landing.demo.axes.proc')}
                  </text>
                  <text x="32" y="122" textAnchor="end" className="text-[11px] fill-foreground font-semibold">
                    {t('landing.demo.axes.cult')}
                  </text>
                </svg>
              </div>

              {/* Score & Badge Output */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-brand-gradient">
                    {avgScore}%
                  </span>
                  <Badge variant={levelInfo.variant} className={levelInfo.badgeClass}>
                    {levelInfo.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {t('landing.demo.radarFootnote')}
                </p>
              </div>

              {/* Action Button */}
              <Button asChild size="sm" className="mt-5 w-full brand-gradient border-0 text-white shadow-md">
                <Link to="/start">
                  {t('landing.demo.cta')} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}