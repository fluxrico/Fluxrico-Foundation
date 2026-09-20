import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { ThemeToggle } from '@/components/landing/theme-toggle';
import { useLandingTheme } from '@/components/landing/theme';
import { cn } from '@/lib/utils';

const LAST_UPDATED = 'September 20, 2026';

// ── Shared chrome (mirrors the landing theme so light/dark just works) ──────

function LegalShell({ children }: { children: ReactNode }) {
  const { resolved } = useLandingTheme();

  return (
    <div className={cn('landing-root min-h-screen overflow-x-hidden', resolved === 'dark' && 'dark')}>
      <header className="landing-shell flex items-center justify-between py-5 sm:py-6">
        <Link href="/" className="fluxrico-focus rounded-lg" aria-label="Fluxrico home" data-testid="legal-link-home">
          <FluxricoMark />
        </Link>
        <ThemeToggle tone="surface" />
      </header>
      <main className="landing-shell pb-20 pt-4">{children}</main>
      <footer className="border-t border-[hsl(var(--landing-line))]">
        <div className="landing-shell flex flex-col items-start justify-between gap-2 py-5 text-[0.7rem] text-[hsl(var(--landing-muted))] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Fluxrico. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="font-semibold transition-opacity hover:opacity-100">
              Terms
            </Link>
            <Link href="/privacy" className="font-semibold transition-opacity hover:opacity-100">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LegalHeading({ label, title, updated }: { label: string; title: string; updated?: boolean }) {
  return (
    <div>
      <Link
        href="/"
        className="fluxrico-focus inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[hsl(var(--landing-muted))] transition-opacity hover:opacity-100"
      >
        <ArrowLeft size={12} strokeWidth={2} aria-hidden="true" /> Back to Fluxrico
      </Link>
      <p className="mt-6 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[hsl(var(--landing-accent))]">{label}</p>
      <h1 className="mt-2 max-w-[36rem] text-[2rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--landing-ink))] sm:text-[2.4rem]">
        {title}
      </h1>
      {updated && (
        <p className="mt-3 text-xs text-[hsl(var(--landing-muted))]">Last updated {LAST_UPDATED}.</p>
      )}
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 max-w-[46rem]" aria-label={title}>
      <h2 className="text-base font-extrabold tracking-[-0.02em] text-[hsl(var(--landing-ink))]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-[hsl(var(--landing-body))]">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--landing-accent))]" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

// ── Privacy Policy ───────────────────────────────────────────────────────────

export function PrivacyPolicy() {
  return (
    <LegalShell>
      <LegalHeading label="Legal" title="Privacy Policy" updated />
      <p className="mt-6 max-w-[46rem] text-sm leading-6 text-[hsl(var(--landing-body))]">
        This policy describes what Fluxrico collects, why, and the controls you have. It covers the Fluxrico web
        application and its API. It does not cover Paddle's own handling of payment data or Resend's handling of email
        delivery data — those are described by Paddle's and Resend's own policies.
      </p>

      <LegalSection title="What we collect">
        <ul className="space-y-2.5">
          <Bullet>
            <strong>Account data:</strong> your name, email address, and a salted, irreversible hash of your password.
            We never store or see your actual password.
          </Bullet>
          <Bullet>
            <strong>Journey content:</strong> your Navigator answers, journey state, stage progress, library pieces, and
            workspace preferences — stored so your work survives sign-outs and follows you across devices.
          </Bullet>
          <Bullet>
            <strong>Session data:</strong> server-side session records that keep you signed in for up to 7 days, with
            the session identifier stored in a browser cookie.
          </Bullet>
          <Bullet>
            <strong>Billing linkage:</strong> when you subscribe, we store a link between your account and your Paddle
            customer and subscription identifiers so we can recognize your Pro access. Card numbers and payment details
            never touch Fluxrico — they are handled entirely by Paddle.
          </Bullet>
          <Bullet>
            <strong>Operational logs:</strong> limited server logs used to keep the service working. Secrets such as
            passwords, tokens, and cookies are redacted from logs.
          </Bullet>
        </ul>
      </LegalSection>

      <LegalSection title="Why we process it">
        <ul className="space-y-2.5">
          <Bullet>To create your account, keep it secure, and let you sign in.</Bullet>
          <Bullet>To deliver your journey: persistence, progress tracking, notifications, and sync across devices.</Bullet>
          <Bullet>To send transactional email — email verification and password resets — through our email provider, Resend.</Bullet>
          <Bullet>To establish and maintain Pro access through our payment provider, Paddle.</Bullet>
        </ul>
      </LegalSection>

      <LegalSection title="What we do not do">
        <ul className="space-y-2.5">
          <Bullet>We do not sell your personal data.</Bullet>
          <Bullet>We do not run third-party advertising or tracking on your account.</Bullet>
          <Bullet>We do not use your journey content to train AI models.</Bullet>
        </ul>
      </LegalSection>

      <LegalSection title="Your controls">
        <ul className="space-y-2.5">
          <Bullet>
            <strong>Export:</strong> Settings → Privacy &amp; data → “Download export” gives you a machine-readable JSON
            copy of your account, journey, and subscription state.
          </Bullet>
          <Bullet>
            <strong>Deletion:</strong> Settings → Account actions → “Delete account” permanently removes your account,
            journey content, sessions, and billing link. This cannot be undone.
          </Bullet>
          <Bullet>
            <strong>Sessions:</strong> Settings → Security lets you review active sessions and sign out every other
            browser.
          </Bullet>
          <Bullet>
            <strong>Password:</strong> you can change your password anytime in Settings → Security; changing it signs
            out other sessions.
          </Bullet>
        </ul>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          Your data is kept while your account is active. When you delete your account, we remove your account record,
          journey content, sessions, tokens, and the link between your account and any billing customer. Verification
          and reset tokens expire on their own within 24 hours. Server logs may retain limited operational records for a
          short period after deletion.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions or requests about your data: <span className="font-bold">privacy@fluxrico.app</span>. We will do our
          best to respond within a reasonable time.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

// ── Terms of Service ─────────────────────────────────────────────────────────

export function TermsOfService() {
  return (
    <LegalShell>
      <LegalHeading label="Legal" title="Terms of Service" updated />
      <p className="mt-6 max-w-[46rem] text-sm leading-6 text-[hsl(var(--landing-body))]">
        These terms govern your use of the Fluxrico web application. By creating an account or using Fluxrico, you agree
        to them.
      </p>

      <LegalSection title="The service">
        <p>
          Fluxrico is a structured workspace that helps you turn an unfinished idea into a clearer path toward digital
          income. It provides the Navigator questionnaire, a stage-based roadmap, a personal library, progress tracking,
          and guidance. Fluxrico provides structure, direction, and information — it does not guarantee any particular
          outcome, income, or result. What you build and launch is yours.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <ul className="space-y-2.5">
          <Bullet>You need an account to use the workspace. Keep your password confidential.</Bullet>
          <Bullet>You are responsible for activity that happens under your account.</Bullet>
          <Bullet>You may delete your account at any time from Settings → Account actions.</Bullet>
        </ul>
      </LegalSection>

      <LegalSection title="Free trial and Pro subscription">
        <ul className="space-y-2.5">
          <Bullet>
            New accounts include a free trial (3 days) of the full experience. When the trial ends, you keep your data
            and core workspace access; Pro features require an active subscription.
          </Bullet>
          <Bullet>
            Pro is a subscription billed monthly or yearly through our payment provider, Paddle. Prices are shown at
            checkout before you pay.
          </Bullet>
          <Bullet>
            Subscriptions renew automatically until cancelled. You can cancel or manage billing anytime via the billing
            portal in Settings. Cancelling stops future renewals; access continues until the end of the current billing
            period.
          </Bullet>
          <Bullet>
            EU/UK consumers generally have a statutory right to withdraw from a purchase within 14 days, unless you
            consent to immediate delivery of digital content and acknowledge losing that right — which checkout will ask
            you to do.
          </Bullet>
        </ul>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <ul className="space-y-2.5">
          <Bullet>Don't misuse the service, attempt to break authentication or access controls, or disrupt other users.</Bullet>
          <Bullet>Don't scrape, resell, or redistribute the service or its content as your own product.</Bullet>
          <Bullet>Your journey content is yours; you grant us only the limited rights needed to store and display it for you.</Bullet>
        </ul>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          We work to keep Fluxrico available and reliable, but the service is provided “as is” and we do not promise it
          will be uninterrupted or error-free. We may add, change, or remove features over time; material changes to
          these terms will be reflected on this page with an updated date.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Fluxrico is not liable for indirect, incidental, or consequential
          damages, or for lost profits, data, or opportunities arising from your use of the service. Nothing in these
          terms limits liability that cannot be limited by law.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms: <span className="font-bold">legal@fluxrico.app</span>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

export default function Legal() {
  // Wouter matches /terms and /privacy to distinct components in App.tsx; this
  // default export exists only for tooling convenience.
  return <PrivacyPolicy />;
}
