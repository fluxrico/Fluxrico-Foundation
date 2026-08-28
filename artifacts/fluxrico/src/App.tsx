import { useState, type ReactNode } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { FluxricoMark } from '@/components/fluxrico-mark';
import { FluxricoSignal } from '@/components/fluxrico-signal';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import Navigator from '@/pages/navigator';
import NavigatorResult from '@/pages/navigator-result';
import { NavigatorStateProvider } from '@/components/navigator-state';

const queryClient = new QueryClient();

function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showFoundationNote, setShowFoundationNote] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="fluxrico-grain min-h-[100dvh] overflow-x-hidden bg-[#F6F7FF] text-[#191A4D]">
      <header className="relative z-20 mx-auto flex min-h-[5.3rem] max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="fluxrico-focus rounded-lg" data-testid="link-fluxrico-home">
          <FluxricoMark />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Foundation navigation">
          <a className="fluxrico-focus rounded-md text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#686B8D] transition-colors hover:text-[#191A4D]" href="#perspective" data-testid="link-perspective">Perspective</a>
          <a className="fluxrico-focus rounded-md text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#686B8D] transition-colors hover:text-[#191A4D]" href="#principles" data-testid="link-principles">Principles</a>
          <a className="fluxrico-focus rounded-md text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#686B8D] transition-colors hover:text-[#191A4D]" href="#signal" data-testid="link-signal">The signal</a>
          <span className="ml-1 h-1 w-1 rounded-full bg-[#B7BAD3]" aria-hidden="true" />
          <button type="button" onClick={() => setShowFoundationNote(true)} className="fluxrico-focus rounded-full border border-[#CFD1E4] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#37386B] transition-all hover:border-[#6B5CE7] hover:bg-white hover:text-[#4A3AD2]" data-testid="button-join-preview">Join the preview</button>
        </nav>
        <button type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="fluxrico-focus flex h-11 w-11 items-center justify-center rounded-full border border-[#D7D9EA] text-[#343568] transition-colors hover:bg-white md:hidden" data-testid="button-mobile-navigation">
          {mobileOpen ? <X size={19} strokeWidth={1.8} /> : <Menu size={19} strokeWidth={1.8} />}
        </button>
      </header>

      {mobileOpen && (
        <nav className="relative z-20 mx-5 mb-3 flex flex-col gap-1 rounded-2xl border border-[#D9DBEB] bg-white/90 p-2 shadow-[0_18px_45px_rgba(33,31,104,0.1)] backdrop-blur md:hidden" aria-label="Mobile foundation navigation">
          <a className="fluxrico-focus rounded-xl px-4 py-3 text-sm font-semibold text-[#4B4D76] hover:bg-[#F1F2FE]" href="#perspective" onClick={closeMobile} data-testid="mobile-link-perspective">Perspective</a>
          <a className="fluxrico-focus rounded-xl px-4 py-3 text-sm font-semibold text-[#4B4D76] hover:bg-[#F1F2FE]" href="#principles" onClick={closeMobile} data-testid="mobile-link-principles">Principles</a>
          <a className="fluxrico-focus rounded-xl px-4 py-3 text-sm font-semibold text-[#4B4D76] hover:bg-[#F1F2FE]" href="#signal" onClick={closeMobile} data-testid="mobile-link-signal">The signal</a>
          <button type="button" onClick={() => { closeMobile(); setShowFoundationNote(true); }} className="mt-1 rounded-xl bg-[#211F61] px-4 py-3 text-left text-sm font-semibold text-white" data-testid="mobile-button-join-preview">Join the preview</button>
        </nav>
      )}

      <main>
        <section className="mx-auto grid max-w-[1240px] gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-28 lg:pt-20" aria-labelledby="hero-title">
          <div className="max-w-[38rem]">
            <div className="fluxrico-rise inline-flex items-center gap-2 rounded-full border border-[#D7D8EE] bg-white/65 px-3 py-2 text-[0.63rem] font-bold uppercase tracking-[0.19em] text-[#5F6190] shadow-[0_3px_16px_rgba(48,44,127,0.04)]" data-testid="status-foundation-preview">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#28BDE5] opacity-40" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#18B9E1]" /></span>
              Foundation preview / 01
            </div>
            <p className="fluxrico-rise fluxrico-rise-delay-1 mt-8 text-[0.68rem] font-bold uppercase tracking-[0.23em] text-[#5C56C9] sm:mt-10" data-testid="text-hero-eyebrow">A calmer operating system for your next move.</p>
            <h1 id="hero-title" className="fluxrico-rise fluxrico-rise-delay-1 mt-5 max-w-[39rem] text-[3.35rem] font-extrabold leading-[0.98] tracking-[-0.075em] text-[#191A4D] sm:text-[5.15rem] lg:text-[5.9rem]">
              From idea
              <span className="relative mx-2 inline-block text-[#5B4AE2] sm:mx-3">
                to
                <svg className="absolute -bottom-2 left-0 h-2.5 w-full" viewBox="0 0 80 10" fill="none" aria-hidden="true"><path d="M2 7C22 2 53 2 78 6" stroke="#18B9E1" strokeWidth="3" strokeLinecap="round" /></svg>
              </span>
              income.
            </h1>
            <p className="fluxrico-rise fluxrico-rise-delay-2 mt-7 max-w-[31rem] text-[1.04rem] leading-7 text-[#626486] sm:mt-8 sm:text-[1.1rem] sm:leading-8" data-testid="text-hero-supporting">Fluxrico is a calm place to turn an unfinished idea into a clearer path for making, sharing, and earning online.</p>
            <div className="fluxrico-rise fluxrico-rise-delay-3 mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button type="button" onClick={() => setShowFoundationNote(true)} className="fluxrico-focus group inline-flex min-h-14 items-center gap-5 rounded-full bg-[#211F61] px-6 py-3.5 text-[0.73rem] font-bold uppercase tracking-[0.17em] text-white shadow-[0_13px_28px_rgba(33,31,97,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#35318A] hover:shadow-[0_17px_34px_rgba(33,31,97,0.25)] active:translate-y-0" data-testid="button-start-signal">
                Start with a signal
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F48AA] transition-transform group-hover:translate-x-0.5" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={2.2} /></span>
              </button>
              <span className="text-xs font-medium text-[#8183A0]">A first look, not a sales pitch.</span>
            </div>
            {showFoundationNote && (
              <div className="fluxrico-rise mt-6 flex max-w-[29rem] items-start gap-3 rounded-2xl border border-[#CAD0F0] bg-[#F0F1FF] px-4 py-3.5 text-sm leading-5 text-[#4E5180]" role="status" aria-live="polite" data-testid="status-preview-note">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#6857E8]" aria-hidden="true" />
                The preview is being shaped now. This is the first quiet corner of Fluxrico.
                <button type="button" className="fluxrico-focus ml-auto shrink-0 rounded-md px-1 text-[#4E5180] underline underline-offset-2 hover:text-[#211F61]" onClick={() => setShowFoundationNote(false)} data-testid="button-dismiss-preview-note">Dismiss</button>
              </div>
            )}
          </div>
          <div id="signal" className="fluxrico-rise fluxrico-rise-delay-2 relative lg:mt-5">
            <div className="absolute -left-4 -top-4 z-10 hidden rounded-full border border-[#D6D4F4] bg-[#F6F7FF] px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#6861C8] shadow-sm sm:block">Clarity, in motion</div>
            <FluxricoSignal />
            <div className="absolute -bottom-5 -right-3 z-10 hidden rounded-2xl border border-[#D9DBEC] bg-white px-4 py-3 shadow-[0_14px_30px_rgba(45,42,120,0.1)] sm:block">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.17em] text-[#888BA9]">A useful distinction</p>
              <p className="mt-1 text-sm font-bold tracking-[-0.02em] text-[#27285C]">Momentum over noise.</p>
            </div>
          </div>
        </section>

        <section id="perspective" className="border-y border-[#E1E2EF] bg-[#F1F2FC] px-5 py-20 sm:px-8 lg:px-10 lg:py-28" aria-labelledby="perspective-title">
          <div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
            <div>
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#5C56C9]">The perspective</p>
              <h2 id="perspective-title" className="mt-5 max-w-[27rem] text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.065em] text-[#191A4D] sm:text-[3.75rem]">Good work begins before the work.</h2>
            </div>
            <div className="flex max-w-[38rem] flex-col justify-end lg:pb-1">
              <p className="text-lg leading-8 text-[#626486] sm:text-[1.28rem] sm:leading-9">The space between “I have an idea” and “people can find value in this” is where most momentum gets lost. Fluxrico gives that in-between a little more shape.</p>
              <div className="mt-9 h-px w-full bg-[#D6D8E9]" />
              <div className="mt-5 flex items-center justify-between text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#8587A3]"><span>For thoughtful builders</span><span>01 — 03</span></div>
            </div>
          </div>
        </section>

        <section id="principles" className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28" aria-labelledby="principles-title">
          <div className="flex flex-col justify-between gap-7 border-b border-[#DBDDEC] pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#5C56C9]">The working principles</p>
              <h2 id="principles-title" className="mt-4 text-[2.25rem] font-extrabold leading-none tracking-[-0.06em] text-[#191A4D] sm:text-[3.1rem]">Make the next step visible.</h2>
            </div>
            <p className="max-w-[17rem] text-sm leading-6 text-[#747696]">Three things we believe a serious creative workspace should protect.</p>
          </div>
          <div className="grid divide-y divide-[#DBDDEC] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <article className="py-8 sm:pr-8 sm:pt-10" data-testid="card-principle-focus"><span className="text-[0.7rem] font-bold text-[#5B4AE2]">01</span><h3 className="mt-8 text-xl font-bold tracking-[-0.03em] text-[#25265A]">Focus is a feature.</h3><p className="mt-3 text-sm leading-6 text-[#747696]">A quieter surface helps the useful thought stay in the room.</p></article>
            <article className="py-8 sm:px-8 sm:pt-10" data-testid="card-principle-direction"><span className="text-[0.7rem] font-bold text-[#5B4AE2]">02</span><h3 className="mt-8 text-xl font-bold tracking-[-0.03em] text-[#25265A]">Direction beats velocity.</h3><p className="mt-3 text-sm leading-6 text-[#747696]">Clarity compounds when every move has a reason behind it.</p></article>
            <article className="py-8 sm:pl-8 sm:pt-10" data-testid="card-principle-motion"><span className="text-[0.7rem] font-bold text-[#5B4AE2]">03</span><h3 className="mt-8 text-xl font-bold tracking-[-0.03em] text-[#25265A]">Progress can feel good.</h3><p className="mt-3 text-sm leading-6 text-[#747696]">The path from making to earning deserves some humanity.</p></article>
          </div>
        </section>

        <section className="mx-5 mb-8 overflow-hidden rounded-[2rem] bg-[#211F61] sm:mx-8 lg:mx-10" aria-labelledby="closing-title">
          <div className="relative mx-auto max-w-[1160px] px-6 py-14 sm:px-10 sm:py-20 lg:px-14">
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#684BE8]/40 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#04B9E7]/20 blur-3xl" />
            <div className="relative max-w-[44rem]">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#77DCF1]">A place to begin</p>
              <h2 id="closing-title" className="mt-5 text-[2.65rem] font-extrabold leading-[1.02] tracking-[-0.07em] text-[#F8F8FF] sm:text-[4.25rem]">Bring the half-formed thing.</h2>
              <p className="mt-6 max-w-[29rem] text-base leading-7 text-[#C2C4E1]">Fluxrico is being built for the moment before the launch plan — when the idea needs a little room to become itself.</p>
              <button type="button" onClick={() => setShowFoundationNote(true)} className="fluxrico-focus group mt-8 inline-flex min-h-13 items-center gap-4 rounded-full bg-[#F1F2FF] px-5 py-3 text-[0.7rem] font-bold uppercase tracking-[0.17em] text-[#27256C] transition-all hover:-translate-y-0.5 hover:bg-white" data-testid="button-closing-preview">Keep me close <ArrowUpRight size={16} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
            </div>
            <div className="absolute bottom-8 right-10 hidden select-none font-extrabold leading-none tracking-[-0.1em] text-white/[0.06] sm:block sm:text-[8rem] lg:right-14 lg:text-[11rem]" aria-hidden="true">F.</div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <FluxricoMark compact />
        <p className="text-xs text-[#8587A3]">A considered beginning for the work ahead.</p>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#8587A3]">© Fluxrico / 2025</p>
      </footer>
    </div>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/dashboard" component={Dashboard} /><Route path="/navigator" component={Navigator} /><Route path="/navigator/result" component={NavigatorResult} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><NavigatorStateProvider><Router /></NavigatorStateProvider></WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;