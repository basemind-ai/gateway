import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Section } from '@/components/static-site/section';
import { Dimensions, Navigation } from '@/constants';

export function IntroSection() {
	const t = useTranslations('landingPage');

	return (
		<Section name="intro">
			<div
				className="md:w-5/12 text-center md:text-left lg:py-32 xl:py-40 2xl:py-56"
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
				<Link
					href={Navigation.SignIn}
					className=" btn-primary mt-6 btn btn-wide"
					data-testid="intro-section-signup-button"
				>
					{t('signUp')}
				</Link>
			</div>
			<div
				className="md:w-5/12 mt-8"
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
