'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { FeaturesSection } from '@/components/landing-page/features-section';
import { Footer } from '@/components/landing-page/footer';
import { LandingPageHeader } from '@/components/landing-page/header';
import { IntroSection } from '@/components/landing-page/intro-section';
import { SDKSection } from '@/components/landing-page/sdk-section';
import { Navigation } from '@/constants';

export default function LandingPage() {
	const containerRef = useRef<HTMLDivElement>();

	const router = useRouter();

	const routeToSignIn = () => {
		router.replace(Navigation.SignIn);
	};

	/* c8 ignore start */
	const scrollToTop = () => {
		containerRef.current?.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};
	/* c8 ignore stop */

	return (
		<div
			className="container mx-auto overflow-y-scroll bg-base-100"
			data-testid="landing-page-container"
			ref={containerRef as unknown as React.LegacyRef<any>}
		>
			<LandingPageHeader
				onButtonClick={routeToSignIn}
				onLogoClick={scrollToTop}
			/>
			<main className="md:w-9/12 mx-auto pb-12 relative z-0">
				<IntroSection onClick={routeToSignIn} />
				<FeaturesSection />
				<SDKSection />
			</main>
			<Footer />
		</div>
	);
}
