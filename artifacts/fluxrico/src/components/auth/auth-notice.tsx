import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

/**
 * A single, calm status strip for form-level states (server errors, success
 * confirmations, honest delivery notices). Field-level errors stay attached
 * to their inputs. Copy must always reflect reality — nothing here claims an
 * email was sent unless the API confirmed delivery.
 */
export function AuthNotice({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const isError = tone === 'error';
  const isSuccess = tone === 'success';
  const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;

  const toneClasses = isError
    ? 'border-[hsl(0_68%_55%/0.35)] bg-[hsl(0_68%_55%/0.08)] text-[hsl(0_58%_44%)]'
    : isSuccess
      ? 'border-[hsl(var(--landing-cyan)/0.4)] bg-[hsl(var(--landing-cyan-soft))]'
      : 'border-[hsl(var(--landing-purple)/0.3)] bg-[hsl(var(--landing-purple-soft))]';

  const textClass = isError
    ? 'text-[hsl(0_58%_44%)]'
    : isSuccess
      ? 'text-[hsl(190_60%_26%)] dark:text-[hsl(190_80%_75%)]'
      : 'text-[hsl(var(--landing-purple-deep))] dark:text-[hsl(var(--landing-purple))]';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 ${toneClasses}`}
      data-testid={`auth-notice-${isError ? 'error' : isSuccess ? 'success' : 'info'}`}
    >
      <Icon size={15} strokeWidth={2.1} className={`mt-0.5 shrink-0 ${textClass}`} aria-hidden="true" />
      <div className={`text-[0.82rem] font-medium leading-5 ${textClass}`}>{children}</div>
    </div>
  );
}
