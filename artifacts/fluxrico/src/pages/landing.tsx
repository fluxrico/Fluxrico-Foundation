import { LandingFooter, LandingRoadmapProduct } from '@/components/landing/landing-sections-b';
import { LandingHeader } from '@/components/landing/landing-header';
import { LandingHero } from '@/components/landing/landing-hero';
import { LandingNavigator, LandingProblemJourney } from '@/components/landing/landing-sections-a';
import { useLandingTheme } from '@/components/landing/theme';
import { cn } from '@/lib/utils';

/** The public marketing experience at `/`. */
export default function Landing() {
  const { resolved } = useLandingTheme();

  return (
    <div
      className={cn('landing-root overflow-x-hidden', resolved === 'dark' && 'dark')}
    >
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingProblemJourney />
        <LandingNavigator />
        <LandingRoadmapProduct />
      </main>
      <LandingFooter />
    </div>
  );
}
