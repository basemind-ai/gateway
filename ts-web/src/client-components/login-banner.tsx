'use client';
import Image from 'next/image';

import { Dimensions } from '@/constants';

export function LoginBanner({
	heading,
	title,
	subtitle,
	imageSrc,
	iconSrc,
}: {
	heading: string;
	title: string;
	subtitle: string;
	imageSrc: string;
	iconSrc: string;
}) {
	return (
		<div
			data-testid="login-banner-container"
			className="rounded-xl border border-neutral-700 p-6 bg-zinc-900 relative"
		>
			<div className="flex gap-4 items-center">
				<Image
					data-testid="login-banner-icon"
					height={Dimensions.Eight}
					width={Dimensions.Eight}
					src={iconSrc}
					alt={heading}
				/>
				<h1 className="text-white text-xl">{heading}</h1>
			</div>

			<h3 className="text-zinc-100 mt-4 text-lg">{title}</h3>
			<p className="text-neutral-500 mt-5">{subtitle}</p>
			<Image
				data-testid="login-banner-splash-image"
				fill={true}
				priority
				className="w-4/5 mt-12 ml-auto mr-auto relative"
				src={imageSrc}
				alt={title}
			/>
		</div>
	);
}
