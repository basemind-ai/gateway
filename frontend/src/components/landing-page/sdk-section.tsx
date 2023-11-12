import { useTranslations } from 'next-intl';

import { CodeSnippet } from '@/components/landing-page/code-snippet';
import { Section } from '@/components/landing-page/section';

export function SDKSection() {
	const kotlinCode = `suspend fun getPrompt(userInput: String): String {
	val client = BaseMindClient.getInstance(apiToken = "myToken")

	val templateVariables = mutableMapOf<String, String>()
	templateVariables["userInput"] = userInput

	val result = client.requestPrompt(templateVariables)
	return result.content'
}`;

	const t = useTranslations('landingPage');

	return (
		<Section name="sdk">
			<div className="flex flex-col justify-between content-center mx-auto">
				<h1
					className="text-secondary text-xl 2xl:text-xl mb-4 text-center font-semibold"
					data-testid="sdk-section-title"
				>
					{t('sdkSectionTitle')}
				</h1>
				<CodeSnippet codeText={kotlinCode} language="kotlin" />
			</div>
		</Section>
	);
}
