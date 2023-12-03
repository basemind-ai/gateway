import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { CodeSnippet } from '@/components/code-snippet';
import { FeatureCard } from '@/components/static-site/feature-card';
import { Section } from '@/components/static-site/section';
import { Dimensions } from '@/constants';

export const KotlinCode = `suspend fun getPrompt(userInput: String): String {
	val client = BaseMindClient.getInstance(apiToken = "myToken")

	val templateVariables = mutableMapOf<String, String>()
	templateVariables["userInput"] = userInput

	val result = client.requestPrompt(templateVariables)
	return result.content'
}`;

export function FeaturesSection() {
	const t = useTranslations('landingPage');

	return (
		<Section name="features">
			<div className="flex flex-col mx-auto gap-8 md:gap-20 xl:gap-28 2xl:gap-32">
				<FeatureCard
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
						alt="Stats FeatureCard"
						className="w-full z-10"
					/>
				</FeatureCard>
				<FeatureCard
					title={t('featureDashboardTitle')}
					subtitle={t('featureDashboardSubtitle')}
					description={t('featureDashboardDescription')}
					name="dashboard"
				>
					<Image
						width={Dimensions.ThirtySix}
						height={Dimensions.Twenty}
						src="/images/prompt-testing-feature.svg"
						alt="Prompt Testing FeatureCard"
						className="w-full z-10"
					/>
				</FeatureCard>
				<FeatureCard
					title={t('featureVendorAgnosticTitle')}
					subtitle={t('featureVendorAgnosticSubtitle')}
					description={t('featureVendorAgnosticDescription')}
					reverse={true}
					name="vendor-agnostic"
				>
					<div className="grid grid-cols-4 gap-12 w-full lg:p-8">
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
				</FeatureCard>
				<div className="hidden lg:block">
					<FeatureCard
						title={t('featureSdkTitle')}
						subtitle={t('featureSdkSubtitle')}
						description={t('featureSdkDescription')}
						name="sdk"
					>
						<CodeSnippet
							codeText={KotlinCode}
							language="kotlin"
							allowCopy={false}
						/>
					</FeatureCard>
				</div>
			</div>
		</Section>
	);
}
