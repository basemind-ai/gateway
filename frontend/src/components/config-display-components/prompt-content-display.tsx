import { useTranslations } from 'next-intl';

import { ModelVendor, ProviderMessageType } from '@/types';
import { isOpenAIContentMessage } from '@/utils/predicates';

const contentMapper: Record<
	ModelVendor,
	(message: any, index: number) => string
> = {
	[ModelVendor.Cohere]: (
		m: ProviderMessageType<ModelVendor.Cohere>,
		i: number,
	) => `${i}: ${m.message}`,
	[ModelVendor.OpenAI]: (
		m: ProviderMessageType<ModelVendor.OpenAI>,
		i: number,
	) =>
		`${i} - [${m.role}]: ${isOpenAIContentMessage(m) ? m.content : m.name}`,
};

export function PromptContentDisplay<T extends ModelVendor>({
	messages,
	modelVendor,
}: {
	messages: ProviderMessageType<T>[];
	modelVendor: ModelVendor;
}) {
	const t = useTranslations('createConfigWizard');

	const messageContent = messages.map(contentMapper[modelVendor]);

	return (
		<div data-testid="prompt-content-display-container">
			<h4
				className="font-medium p-4"
				data-testid="prompt-content-display-title"
			>
				{t('promptTemplate')}
			</h4>
			<div
				className="border-2 border-neutral p-4 rounded"
				data-testid="prompt-content-display-messages"
			>
				{messageContent.map((m, i) => (
					<p
						data-testid="message-content-paragraph"
						key={m.slice(0, 10) + i}
					>
						<span className="text-info">{m}</span>
					</p>
				))}
			</div>
		</div>
	);
}
