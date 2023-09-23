'use client';
import Image from 'next/image';
import useTranslation from 'next-translate/useTranslation';

import { Dimensions } from '@/constants';

export function LoginBanner({
	imageSrc,
	iconSrc,
}: {
	imageSrc: string;
	iconSrc: string;
}) {
	const { t } = useTranslation('signin-banner');

	return (
		<div
			data-testid="login-banner-container"
			className="rounded-xl border border-b-base-300 p-6 bg-base-200 relative"
		>
			<div className="flex gap-4 items-center">
				<Image
					data-testid="login-banner-icon"
					height={Dimensions.Eight}
					width={Dimensions.Eight}
					src={iconSrc}
					alt={t('bannerHeading')}
				/>
				<h1 className="text-base-content text-xl">
					{t('bannerHeading')}
				</h1>
			</div>

			<h3 className="text-base-content mt-4 text-lg">
				{t('bannerTitle')}
			</h3>
			<p className="text-neutral-content mt-5">{t('bannerSubtitle')}</p>
			<Image
				data-testid="login-banner-splash-image"
				fill={true}
				priority
				className="w-4/5 mt-12 ml-auto mr-auto relative"
				src={imageSrc}
				alt={t('title')}
			/>
		</div>
	);
}
