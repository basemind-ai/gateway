'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Navigation } from '@/constants';

export function CTASection() {
	const t = useTranslations('landingPage');

	return (
		<div className="flex flex-col max-w-screen-md items-center mx-auto gap-6 py-40 xl:py-52 2xl:py-60">
			<h2
				className="text-base-content text-5xl 2xl:text-7xl  font-bold text-center"
				data-testid="cta-section-title"
			>
				{t('ctaSectionTitle')}
			</h2>
			<p
				className="text-md xl:text-lg 2xl:text-xl text-base-content/80 text-center"
				data-testid="cta-section-description"
			>
				{t('ctaSectionSubtitle')}
			</p>
			<Link
				href={Navigation.SignIn}
				className="btn btn-primary btn-wide"
				data-testid="cta-section-button"
			>
				{t('signUp')}
			</Link>
		</div>
	);
}
