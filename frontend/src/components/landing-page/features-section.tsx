import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Feature } from '@/components/landing-page/feature';
import { Section } from '@/components/landing-page/section';
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
					reverse={true}
					name="serverless"
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
					title={t('featureDashboardTitle')}
					subtitle={t('featureDashboardSubtitle')}
					description={t('featureDashboardDescription')}
					name="dashboard"
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
					title={t('featureVendorAgnosticTitle')}
					subtitle={t('featureVendorAgnosticSubtitle')}
					description={t('featureVendorAgnosticDescription')}
					reverse={true}
					name="vendor-agnostic"
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
		</Section>
	);
}
