import { FeaturesSection } from '@/components/static-site/features-section';
import { Footer } from '@/components/static-site/footer';
import { StaticPageHeader } from '@/components/static-site/header';
import { IntroSection } from '@/components/static-site/intro-section';
import { SDKSection } from '@/components/static-site/sdk-section';

export default function LandingPage() {
	return (
		<div
			className="container mx-auto overflow-y-scroll bg-base-100"
			data-testid="landing-page-container"
		>
			<StaticPageHeader />
			<main className="md:w-9/12 mx-auto pb-12 relative z-0">
				<IntroSection />
				<FeaturesSection />
				<SDKSection />
			</main>
			<Footer />
		</div>
	);
}
