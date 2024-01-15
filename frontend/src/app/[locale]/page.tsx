import '../../styles/landing-page.scss';

import { unstable_setRequestLocale } from 'next-intl/server';

import { BenefitsSection } from '@/components/static-site/benefits';
import { CTASection } from '@/components/static-site/cta-section';
import { FAQSection } from '@/components/static-site/faq-section';
import { FeatureSection } from '@/components/static-site/features-section';
import { Footer } from '@/components/static-site/footer';
import { StaticPageHeader } from '@/components/static-site/header';
import { HeroSection } from '@/components/static-site/hero-section';
import { PricingSection } from '@/components/static-site/pricing-section';
import { TrackStaticPage } from '@/components/static-site/track-static-page';

export default function LandingPage({
	params: { locale },
}: {
	params: { locale: string };
}) {
	unstable_setRequestLocale(locale);

	return (
		<>
			<TrackStaticPage pageName="landing-page" />
			<StaticPageHeader />
			<HeroSection />
			<FeatureSection />
			<BenefitsSection />
			<PricingSection />
			<FAQSection />
			<CTASection />
			<Footer />
		</>
	);
}
