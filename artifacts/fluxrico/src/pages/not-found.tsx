import { ArrowRight, Compass } from 'lucide-react';
import { Link } from 'wouter';
import { FluxricoMark } from '@/components/fluxrico-mark';

export default function NotFound() {
  return (
    <div className="fluxrico-grain flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#F6F7FF] text-[#191A4D]">
      <header className="mx-auto flex min-h-[5.3rem] w-full max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="fluxrico-focus rounded-lg" data-testid="link-notfound-home">
          <FluxricoMark />
        </Link>
        <Link
          href="/dashboard"
          className="fluxrico-focus hidden min-h-10 items-center rounded-full border border-[#CFD1E4] px-4 text-[0.66rem] font-bold uppercase tracking-[0.15em] text-[#37386B] transition-colors hover:border-[#6B5CE7] hover:text-[#4A3AD2] sm:inline-flex"
          data-testid="link-notfound-dashboard"
        >
          Go to dashboard
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
        <div className="fluxrico-rise w-full max-w-[34rem] rounded-[2rem] border border-[#DCDDED] bg-white/80 p-8 text-center shadow-[0_18px_45px_rgba(45,42,120,0.07)] sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#211F61] text-[#6CE0F4] shadow-[0_10px_22px_rgba(35,31,104,0.18)]">
            <Compass size={22} strokeWidth={1.6} />
          </span>
          <p className="mt-7 text-[0.64rem] font-bold uppercase tracking-[0.21em] text-[#6258D0]">Off the marked path</p>
          <h1 className="mt-4 text-[3.4rem] font-extrabold leading-none tracking-[-0.075em] text-[#191A4D] sm:text-[4.6rem]">404</h1>
          <p className="mt-5 text-base leading-7 text-[#626486]">
            This page does not exist — or has not taken shape yet. Your journey is still where you left it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="fluxrico-focus group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#211F61] px-5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_13px_28px_rgba(33,31,97,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#35318A]"
              data-testid="button-notfound-dashboard"
            >
              Back to your dashboard
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4F48AA] transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={15} strokeWidth={2.2} />
              </span>
            </Link>
            <Link
              href="/navigator"
              className="fluxrico-focus inline-flex min-h-12 items-center rounded-full border border-[#D4D5E8] bg-white px-5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#5753A5] transition-colors hover:border-[#8E88E1]"
              data-testid="button-notfound-navigator"
            >
              Start Navigator
            </Link>
          </div>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#8587A3]">Fluxrico / 404</p>
        <p className="text-xs text-[#8587A3]">A considered beginning for the work ahead.</p>
      </footer>
    </div>
  );
}
