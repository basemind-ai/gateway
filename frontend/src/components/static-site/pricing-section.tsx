'use client';
import { useTranslations } from 'next-intl';
import {
	Boxes,
	CurrencyDollar,
	JournalText,
	Lightning,
	PlusCircle,
	Search,
	Slack,
} from 'react-bootstrap-icons';

import { Perk, PricingCard } from '@/components/static-site/pricing-card';
import { Navigation } from '@/constants';
import { getEnv } from '@/utils/env';

export const firstPackagePerks: Perk[] = [
	{ icon: Lightning, title: 'Serverless AI' },
	{ icon: JournalText, title: 'On-the-fly prompt management' },
	{ icon: Search, title: 'Prompt testing' },
	{ icon: CurrencyDollar, title: 'Free credits for AI models' },
];

const secondPackagePerks: Perk[] = [
	{ icon: PlusCircle, title: 'Everything in Building' },
	{ icon: Boxes, title: 'Unlimited volumes' },
	{ icon: Slack, title: 'Implementation specialist' },
];
export function PricingSection() {
	const t = useTranslations('landingPage');
	return (
		<section
			className="z-0 px-8 pt-16 md:pt-24 bg-base-200 relative"
			data-testid="landing-page-pricing"
		>
			<div className="mx-auto container px-6 lg:px-8">
				<h2 className="gradient-headline text-center font-bold text-4xl xl:text-5xl 2xl:text-6xl ">
					{t('pricingTitle')}
				</h2>
				<p className="text-base-content/60 text-center pt-2 text-xl xl:text-2xl 2xl:text-4xl ">
					{t('pricingSubtitle')}
				</p>
				<div className="flex flex-col lg:flex-row content-center gap-8 lg:gap-0 lg:justify-evenly pt-16">
					<PricingCard
						title={t('pricingFreeCardTitle')}
						displayCost={t('pricingFreeCardCost')}
						perks={firstPackagePerks}
						cta={t('pricingFreeCardCTA')}
						url={Navigation.SignIn}
					/>
					<PricingCard
						title={t('pricingSalesCardTitle')}
						displayCost={t('pricingSalesCardCost')}
						perks={secondPackagePerks}
						cta={t('pricingSalesCardCTA')}
						url={getEnv().NEXT_PUBLIC_SCHEDULE_MEETING_URL}
					/>
				</div>
			</div>
		</section>
	);
}
