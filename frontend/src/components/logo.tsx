import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Dimensions } from '@/constants';

export function Logo() {
	const t = useTranslations('common');

	return (
		<div
			className="flex justify-start  items-center"
			data-testid="logo-component"
		>
			<Image
				priority
				width={Dimensions.Seven}
				height={Dimensions.Seven}
				src="/images/basemind-logo.svg"
				alt="Logo"
				data-testid="logo-image"
			/>
			<span
				className="text-2xl font-bold text-primary"
				data-testid="logo-text"
			>
				{t('basemindName')}
			</span>
		</div>
	);
}
