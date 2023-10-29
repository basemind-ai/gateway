'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function LoginBanner({ imageSrc }: { imageSrc: string }) {
	const t = useTranslations('signin');

	return (
		<div data-testid="login-banner-container" className=" flex px-16 ">
			<Image
				data-testid="login-banner-splash-image"
				fill={true}
				priority
				className="relative"
				src={imageSrc}
				alt={t('bannerTitle')}
			/>
		</div>
	);
}
