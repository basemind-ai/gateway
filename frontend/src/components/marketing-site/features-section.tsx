import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Feature } from '@/components/marketing-site/feature';
import { Section } from '@/components/marketing-site/section';
import { Dimensions } from '@/constants';

export function FeaturesSection() {
	const t = useTranslations('landingPage');

	return (
		<Section name="features">
			<div className="md:w-9/12 flex flex-col mx-auto gap-8 md:gap-32">
				<Feature
					title={t('featureServerlessTitle')}
					subtitle={t('featureServerlessSubtitle')}
					description={t('featureServerlessDescription')}
					name="serverless"
					reverse={true}
				>
					<Image
						width={Dimensions.ThirtySix}
						height={Dimensions.Twenty}
						src="/images/stats-feature.svg"
						alt="Stats Feature"
						className="w-full z-10"
					/>
				</Feature>
				<Feature
					title={t('featureDashboardTitle')}
					subtitle={t('featureDashboardSubtitle')}
					description={t('featureDashboardDescription')}
					name="dashboard"
					reverse={true}
				>
					<Image
						width={Dimensions.ThirtySix}
						height={Dimensions.Twenty}
						src="/images/prompt-testing-feature.svg"
						alt="Prompt Testing Feature"
						className="w-full z-10"
					/>
				</Feature>
				<Feature
					title={t('featureVendorAgnosticTitle')}
					subtitle={t('featureVendorAgnosticSubtitle')}
					description={t('featureVendorAgnosticDescription')}
					reverse={true}
					name="vendor-agnostic"
				>
					<div className="grid grid-cols-4 gap-8 w-full">
						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/hugging-face-logo.svg"
							alt="Hugging Face Logo"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/gcp-logo.svg"
							alt="GCP Logo"
							className="w-full pt-2 z-10"
						/>
						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/azure-logo.svg"
							alt="Azure Logo"
							className="w-full z-10"
						/>

						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/aws-logo.svg"
							alt="AWS Logo"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/anthropic-logo.svg"
							alt="Anthropic Logo"
							className="w-full z-10"
						/>

						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/palm2-logo.svg"
							alt="PaLM2 Logo"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/cohere-logo.svg"
							alt="Cohere Logo"
							className="w-full z-10"
						/>
						<Image
							width={Dimensions.Twenty}
							height={Dimensions.Twenty}
							src="/images/openai-logo.svg"
							alt="OpenAI Logo"
							className="w-full z-10"
						/>
					</div>
				</Feature>
			</div>
		</Section>
	);
}
