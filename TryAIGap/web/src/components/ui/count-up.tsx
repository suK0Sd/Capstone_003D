import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // duration in seconds (default: 1.2)
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Lightweight, high-performance numerical counter inspired by React Bits.
 * Uses requestAnimationFrame with easeOutExpo easing and respects prefers-reduced-motion.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState<number>(from);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevToRef = useRef<number>(from);

  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, asignar directamente
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(to);
      prevToRef.current = to;
      return;
    }

    const startVal = prevToRef.current;
    const endVal = to;
    const totalMs = duration * 1000;
    startRef.current = null;

    function easeOutExpo(t: number): number {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function animate(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / totalMs, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startVal + (endVal - startVal) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        prevToRef.current = endVal;
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [to, duration]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
