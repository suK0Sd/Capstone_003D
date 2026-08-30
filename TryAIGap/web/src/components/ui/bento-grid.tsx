import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr max-w-6xl mx-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
}

export function BentoCard({ children, className, colSpan = 1, ...props }: BentoCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/70 p-5 sm:p-6 shadow-xs backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-lg',
        colSpan === 2 && 'md:col-span-2',
        colSpan === 3 && 'md:col-span-2 lg:col-span-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
