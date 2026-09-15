import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Circular status visual for auth states (mail, check, warning, spinner).
 * Tone adjusts the halo and surface; the dashed ring keeps every state
 * visually part of one system. Decorative only — copy carries the meaning.
 */
export function AuthStatusBadge({
  tone = 'purple',
  children,
}: {
  tone?: 'purple' | 'success' | 'error';
  children: ReactNode;
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-[hsl(var(--landing-cyan-soft))] text-[hsl(var(--landing-cyan))]'
      : tone === 'error'
        ? 'bg-[hsl(0_68%_55%/0.1)] text-[hsl(0_58%_46%)]'
        : 'bg-[hsl(var(--landing-purple-soft))] text-[hsl(var(--landing-purple))]';

  return (
    <span
      className={cn('auth-status-badge fluxrico-rise', toneClasses)}
      data-tone={tone}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
