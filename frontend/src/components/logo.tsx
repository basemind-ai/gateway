import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Dimensions } from '@/constants';

export function Logo({
	width = Dimensions.Seven,
	height = Dimensions.Seven,
	textSize = 'text-2xl',
}: {
	height?: number;
	textSize?: string;
	width?: number;
}) {
	const t = useTranslations('common');

	return (
		<div
			className="flex justify-between items-center"
			data-testid="logo-component"
		>
			<Image
				priority
				width={width}
				height={height}
				src="/images/pinecone-transparent-bg.svg"
				alt="Logo"
				data-testid="logo-image"
			/>
			<span
				className={`${textSize} font-bold text-primary`}
				data-testid="logo-text"
			>
				{t('basemindName')}
			</span>
		</div>
	);
}
