'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Section } from '@/components/marketing-site/section';
import { Dimensions, Navigation } from '@/constants';

export function IntroSection() {
	const t = useTranslations('landingPage');
	const router = useRouter();
	function handleSignUpClick() {
		router.push(Navigation.SignIn);
	}

	return (
		<Section name="intro">
			<div
				className="md:w-5/12 text-center md:text-left"
				data-testid="intro-section-text-container"
			>
				<h1
					className="text-base-content text-4xl xl:text-5xl 2xl:text-6xl font-bold"
					data-testid="intro-section-title"
				>
					{t('introSectionTitle')}
				</h1>
				<p
					className="text-md xl:text-lg 2xl:text-xl text-base-content/80 mt-4"
					data-testid="intro-section-description"
				>
					{t('introSectionDescription')}
				</p>
				<button
					className="btn btn-primary mt-6"
					onClick={handleSignUpClick}
					data-testid="intro-section-signup-button"
				>
					{t('signUp')}
				</button>
			</div>
			<div
				className="md:w-5/12 mt-8 md:mt-0"
				data-testid="intro-section-image-container"
			>
				<Image
					priority
					width={Dimensions.Twelve}
					height={Dimensions.Twelve}
					src="/images/hero.svg"
					alt="Hero Image"
					className="w-full aspect-square z-10"
				/>
			</div>
		</Section>
	);
}
