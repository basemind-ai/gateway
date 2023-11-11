'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { ChevronRight } from 'react-bootstrap-icons';

import { CodeSnippet } from '@/components/landing-page/code-snippet';
import { Feature } from '@/components/landing-page/feature';
import { Logo } from '@/components/logo';
import { Dimensions, Navigation } from '@/constants';

function Header({ onLogoClick }: { onLogoClick: () => void }) {
	const t = useTranslations('landingPage');
	const router = useRouter();

	return (
		<header
			className="navbar md:w-9/12 mx-auto sticky top-0 z-50 bg-base-100 pb-5"
			data-testid="landing-page-header"
		>
			<div className="flex-none lg:flex navbar-start">
				<Logo
					width={Dimensions.Eleven}
					height={Dimensions.Eleven}
					textSize="text-3xl"
					onClick={onLogoClick}
				/>
			</div>
			<div className="navbar-end">
				<button
					className="btn btn-outline btn-md m-2"
					data-testid="sign-up-button"
					onClick={() => {
						router.replace(Navigation.SignIn);
					}}
				>
					{t('signIn')}
					<ChevronRight />
				</button>
			</div>
		</header>
	);
}

function SectionOne() {
	const t = useTranslations('landingPage');

	const router = useRouter();

	return (
		<section
			className="flex flex-col md:flex-row justify-between items-center py-24 px-2 md:px-0"
			data-testid="landing-page-top-section"
		>
			<div className="md:w-5/12 text-center md:text-left">
				<h1 className="text-base-content text-4xl xl:text-5xl 2xl:text-6xl font-bold">
					{t('firstSectionTitle')}
				</h1>
				<p className="text-md xl:text-lg 2xl:text-xl text-base-content/80 mt-4">
					{t('firstSectionDescription')}
				</p>
				<button
					className="btn btn-primary mt-6"
					onClick={() => {
						router.replace(Navigation.SignIn);
					}}
				>
					{t('signUp')}
				</button>
			</div>
			<div className="md:w-5/12 mt-8 md:mt-0">
				<Image
					priority
					width={Dimensions.Twelve}
					height={Dimensions.Twelve}
					src="/images/hero2.svg"
					alt="Hero Image"
					className="w-full aspect-square z-10"
				/>
			</div>
		</section>
	);
}

function SectionTwo() {
	const t = useTranslations('landingPage');

	return (
		<section
			className="flex flex-col md:flex-row justify-between items-center py-24 px-2 md:px-0"
			data-testid="landing-page-providers-section"
		>
			<div className="md:w-9/12 flex flex-col mx-auto gap-8 md:gap-32">
				<Feature
					title={t('featureOneTitle')}
					subtitle={t('featureOneSubtitle')}
					description={t('featureOneDescription')}
					reverse={true}
				>
					<Image
						width={Dimensions.Twelve}
						height={Dimensions.Twelve}
						src="/images/stats.svg"
						alt="Hero Image"
						className="w-full z-10"
					/>
				</Feature>
				<Feature
					title={t('featureTwoTitle')}
					subtitle={t('featureTwoSubtitle')}
					description={t('featureTwoDescription')}
				>
					<Image
						width={Dimensions.Twelve}
						height={Dimensions.Twelve}
						src="/images/prompt-testing.svg"
						alt="Hero Image"
						className="w-full z-10"
					/>
				</Feature>
				<Feature
					title={t('featureThreeTitle')}
					subtitle={t('featureThreeSubtitle')}
					description={t('featureThreeDescription')}
					reverse={true}
				>
					<div className="grid grid-cols-4 gap-8 w-full">
						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/hugging.svg"
							alt="Hero Image"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/gcp.svg"
							alt="Hero Image"
							className="w-full pt-2 z-10"
						/>
						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/azure.svg"
							alt="Hero Image"
							className="w-full z-10"
						/>

						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/aws.svg"
							alt="Hero Image"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/anthropic.svg"
							alt="Hero Image"
							className="w-full z-10"
						/>

						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/palm2.svg"
							alt="Hero Image"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/cohere.svg"
							alt="Hero Image"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twelve}
							height={Dimensions.Twelve}
							src="/images/openai.svg"
							alt="Hero Image"
							className="w-full z-10"
						/>
					</div>
				</Feature>
			</div>
		</section>
	);
}

function SectionThree() {
	const kotlinCode = `suspend fun getPrompt(userInput: String): String {
	val client = BaseMindClient.getInstance(apiToken = "myToken")

	val templateVariables = mutableMapOf<String, String>()
	templateVariables["userInput"] = userInput

	val result = client.requestPrompt(templateVariables)
	return result.content'
}`;

	const t = useTranslations('landingPage');

	return (
		<section
			className="flex flex-col md:flex-row justify-between items-center py-24 px-2 md:px-0"
			data-testid="landing-page-code-snippet-section"
		>
			<h1 className="text-secondary text-lg 2xl:text-xl mb-4 text-center font-semibold">
				{t('sectionThreeTitle')}
			</h1>

			<CodeSnippet codeText={kotlinCode} language="kotlin" />
		</section>
	);
}

function Footer() {
	const t = useTranslations('landingPage');

	return (
		<footer
			className="footer footer-center p-12 bg-base-200 text-base-content"
			data-testid="landing-page-footer"
		>
			<div>
				<p>{t('footerText')}</p>
				<p>{t('footerCopyright')}</p>
			</div>
		</footer>
	);
}

export default function LandingPage() {
	const containerRef = useRef<HTMLDivElement>();

	return (
		<div
			className="container mx-auto overflow-y-scroll bg-base-100"
			data-testid="landing-page-container"
			ref={containerRef as unknown as React.LegacyRef<any>}
		>
			<Header
				onLogoClick={() => {
					containerRef.current?.scrollTo({
						top: 0,
						behavior: 'smooth',
					});
				}}
			/>
			<main className="md:w-9/12 mx-auto pb-12 relative z-0">
				<SectionOne />
				<SectionTwo />
				<SectionThree />
			</main>
			<Footer />
		</div>
	);
}
