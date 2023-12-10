import { CTASection } from '@/components/static-site/cta-section';
import { FeaturesSection } from '@/components/static-site/features-section';
import { Footer } from '@/components/static-site/footer';
import { StaticPageHeader } from '@/components/static-site/header';
import { IntroSection } from '@/components/static-site/intro-section';
import { TrackStaticPage } from '@/components/static-site/track-static-page';

export default function LandingPage() {
	return (
		<div
			className=" overflow-y-scroll bg-base-100 relative"
			data-testid="landing-page-container"
		>
			<TrackStaticPage pageName="landing-page" />
			<div className="container mx-auto">
				<StaticPageHeader />
				<main className="mx-auto pb-12 z-0  px-8">
					<IntroSection />
					<FeaturesSection />
					<CTASection />
				</main>
				<Footer />
			</div>
		</div>
	);
}
