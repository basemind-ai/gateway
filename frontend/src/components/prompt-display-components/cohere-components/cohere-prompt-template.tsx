import { useTranslations } from 'next-intl';

import { CoherePromptMessage, ModelVendor, ProviderMessageType } from '@/types';
import { handleChange } from '@/utils/events';
import { extractTemplateVariables } from '@/utils/models';

export function CoherePromptTemplate({
	messages,
	setMessages,
}: {
	messages: ProviderMessageType<ModelVendor.Cohere>[];
	setMessages: (messages: ProviderMessageType<ModelVendor.Cohere>[]) => void;
}) {
	const t = useTranslations('createConfigWizard');

	const handleSetMessages = (message: string) => {
		setMessages([
			{
				message,
				templateVariables: extractTemplateVariables(message),
			} satisfies CoherePromptMessage,
		]);
	};

	return (
		<div data-testid="cohere-prompt-template-form-container">
			<div
				className="form-control"
				data-testid="cohere-prompt-template-form"
			>
				<label
					className="label"
					data-testid="cohere-prompt-template-form-label"
				>
					<span
						className="label-text"
						data-testid="cohere-prompt-template-form-label-text"
					>
						{t('messageContent')}
					</span>
					<span
						className="text-info label-text-alt text-sm"
						data-testid="cohere-prompt-template-form-label-alt-text"
					>
						{t('wrapVariable')}
					</span>
				</label>
				<textarea
					className="card-textarea"
					placeholder={t('promptMessagePlaceholder')}
					value={messages[0]?.message ?? ''}
					onChange={handleChange(handleSetMessages)}
					data-testid="cohere-prompt-template-form-textarea"
				/>
			</div>
		</div>
	);
}
