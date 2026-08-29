import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  { id: 'q1', q: 'landing.faq.q1', a: 'landing.faq.a1' },
  { id: 'q2', q: 'landing.faq.q2', a: 'landing.faq.a2' },
  { id: 'q3', q: 'landing.faq.q3', a: 'landing.faq.a3' },
  { id: 'q4', q: 'landing.faq.q4', a: 'landing.faq.a4' },
  { id: 'q5', q: 'landing.faq.q5', a: 'landing.faq.a5' },
];

export function LandingFaq() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <HelpCircle className="h-3.5 w-3.5" />
          {t('landing.faq.badge')}
        </span>
        <h2 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground">
          {t('landing.faq.title')}
        </h2>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          {t('landing.faq.subtitle')}
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-b border-border/60 py-1 last:border-b-0"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold hover:text-primary transition-colors py-3">
                {t(item.q)}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 pb-3">
                {t(item.a)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}