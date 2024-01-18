import { useTranslations } from 'next-intl';
import { ArrowDown } from 'react-bootstrap-icons';

import { MarketingCodeSnippet } from '@/components/static-site/marketing-code-snippet';

export function HeroSection() {
	const t = useTranslations('landingPage');

	return (
		<main
			className="bg-base-100 flex flex-col justify-between"
			data-testid="landing-page-hero"
		>
			<div className="container mx-auto z-0 flex flex-col content-center text-center max-w-screen-md 2xl:max-w-screen-lg 2xl:py-28 py-12 lg:py-20 gap-8 2xl:gap-12">
				<h1 className="text-5xl md:text-6xl 2xl:text-8xl font-extrabold gradient-headline">
					{t('heroTitle')}
				</h1>
				<p className="text-neutral-content">{t('heroSubtitle')}</p>
				<MarketingCodeSnippet />
			</div>
			<svg className="animate-bounce w-12 h-12 text-base-content-darker mx-auto">
				<ArrowDown />
			</svg>
		</main>
	);
}
