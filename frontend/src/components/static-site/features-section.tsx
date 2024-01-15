import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Dimensions } from '@/constants';

const ModelsCardData: { alt: string; src: string }[] = [
	{ alt: 'Hugging Face Logo', src: '/images/hugging-face-logo.svg' },
	{ alt: 'GCP Logo', src: '/images/gcp-logo.svg' },
	{ alt: 'Azure Logo', src: '/images/azure-logo.svg' },
	{ alt: 'AWS Logo', src: '/images/aws-logo.svg' },
	{ alt: 'Anthropic Logo', src: '/images/anthropic-logo.svg' },
	{ alt: 'OpenAI Logo', src: '/images/openai-logo.svg' },
	{ alt: 'Cohere Logo', src: '/images/cohere-logo.svg' },
	{ alt: 'PaLM2 Logo', src: '/images/palm2-logo.svg' },
];

export function FeatureSection() {
	const t = useTranslations('landingPage');
	const ServerLessCard = () => {
		return (
			<>
				<figure className="lg:pl-24 ">
					<Image
						priority
						width={Dimensions.Twelve}
						height={Dimensions.Twelve}
						src="/images/hero.svg"
						alt="Hero Image"
						className="py-8 w-2/3 h-fit z-10"
					/>
				</figure>

				<div className="card-body my-auto">
					<h2 className="card-title">
						{t('featureServerlessTitle')} -{' '}
						{t('featureServerlessSubtitle')}
					</h2>
					<p className="text-neutral-content text-sm">
						{t('featureServerlessDescription')}
					</p>
				</div>
			</>
		);
	};

	const StreamingCard = () => {
		return (
			<>
				<figure className="flex flex-grow content-center justify-center h-full ">
					<Image
						priority
						width={Dimensions.Twelve}
						height={Dimensions.Twelve}
						src="/images/grpc.svg"
						alt="Streaming Image"
						className="px-24 pt-8 md:px-6 lg:h-1/2 w-full lg:w-fit z-10"
					/>
				</figure>
				<div className="card-body my-auto md:pl-0">
					<h2 className="card-title">{t('featureStreamingTitle')}</h2>
					<p className="text-neutral-content text-sm">
						{t('featureStreamingDescription')}
					</p>
				</div>
			</>
		);
	};
	const ModelsCard = () => {
		return (
			<>
				<figure className="pt-2">
					<div className="grid grid-cols-4 place-items-center gap-12 md:gap-4 px-4 ">
						{ModelsCardData.map(({ src, alt }) => (
							<Image
								key={alt}
								width={Dimensions.Twelve}
								height={Dimensions.Twelve}
								src={src}
								alt={alt}
								className="w-20 z-10"
							/>
						))}
					</div>
				</figure>
				<div className="card-body">
					<h2 className="card-title">
						{t('featureVendorAgnosticTitle')}
					</h2>
					<p className="text-neutral-content text-sm">
						{t('featureVendorAgnosticDescription')}
					</p>
				</div>
			</>
		);
	};

	const PromptManagementCard = () => {
		return (
			<>
				<figure className="bg-base-100 h-full">
					<Image
						alt="Prompt Management"
						src="/images/prompt-mangment.svg"
						width={Dimensions.Twelve}
						height={Dimensions.Twelve}
						className="w-full z-10"
					/>
				</figure>
				<div className="card-body my-auto">
					<h2 className="card-title">{t('featureDashboardTitle')}</h2>
					<p className="text-neutral-content text-sm">
						{t('featureDashboardDescription')}
					</p>
				</div>
			</>
		);
	};

	return (
		<section
			className="z-0 px-8 bg-base-200 relative py-24"
			data-testid="landing-page-features"
		>
			<h2 className=" text-4xl xl:text-5xl 2xl:text-6xl font-bold bg-gradient-to-r from-neutral-content/50 via-neutral-content/90 to-neutral-content/50 hover:text-neutral-content transition-colors ease-in-out duration-500 bg-clip-text text-center pb-16 text-transparent">
				{t('featureSectionTitle')}
			</h2>
			<div className="grid md:grid-cols-12 container mx-auto gap-8">
				<div className="marketing-card md:col-span-7 md:card-side  md:flex-row ">
					<ServerLessCard />
				</div>

				<div className="marketing-card md:col-span-5 lg:card-side  lg:flex-row">
					<StreamingCard />
				</div>

				<div className="marketing-card md:col-span-6 lg:col-span-5 max-h-min">
					<ModelsCard />
				</div>
				<div className="marketing-card md:col-span-6 lg:col-span-7 card-side lg:flex-row">
					<PromptManagementCard />
				</div>
			</div>
		</section>
	);
}
