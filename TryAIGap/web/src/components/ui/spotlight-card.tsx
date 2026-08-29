import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderGlowColor?: string;
}

export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  (
    {
      children,
      className,
      spotlightColor = 'rgba(201, 53, 159, 0.12)',
      borderGlowColor = 'rgba(20, 184, 166, 0.35)',
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLDivElement | null>(null);

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const el = internalRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    }, []);

    return (
      <div
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        onMouseMove={handleMouseMove}
        className={cn(
          'group relative rounded-xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Subtle Ambient Radial Highlight */}
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 80%)`,
          }}
          aria-hidden="true"
        />

        {/* Interactive Border Glow */}
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(200px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${borderGlowColor}, transparent 80%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1.5px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

SpotlightCard.displayName = 'SpotlightCard';