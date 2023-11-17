import { FeaturesSection } from '@/components/marketing-site/features-section';
import { Footer } from '@/components/marketing-site/footer';
import { LandingPageHeader } from '@/components/marketing-site/header';
import { IntroSection } from '@/components/marketing-site/intro-section';
import { SDKSection } from '@/components/marketing-site/sdk-section';

export default function LandingPage() {
	return (
		<div
			className="container mx-auto overflow-y-scroll bg-base-100"
			data-testid="landing-page-container"
		>
			<LandingPageHeader />
			<main className="md:w-9/12 mx-auto pb-12 relative z-0">
				<IntroSection />
				<FeaturesSection />
				<SDKSection />
			</main>
			<Footer />
		</div>
	);
}
