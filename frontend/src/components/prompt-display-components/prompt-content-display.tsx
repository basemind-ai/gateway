import { useTranslations } from 'next-intl';

import { openAIRoleColorMap } from '@/constants/models';
import { ModelVendor, OpenAIMessageRole, ProviderMessageType } from '@/types';
import { isOpenAIContentMessage } from '@/utils/predicates';

const openAIRoleElementMapper: Record<
	OpenAIMessageRole,
	React.FC<{ message: string }>
> = {
	assistant: ({ message }) => (
		<span>
			[
			<span className={`${openAIRoleColorMap.assistant}`}>assistant</span>
			]: <span className="text-base-content">{message}</span>
		</span>
	),
	function: ({ message }) => (
		<span>
			[<span className={`${openAIRoleColorMap.function}`}>function</span>
			]: <span className="text-base-content">{message}</span>
		</span>
	),
	system: ({ message }) => (
		<span>
			[<span className={`${openAIRoleColorMap.system}`}>system</span>]:{' '}
			<span className="text-base-content">{message}</span>
		</span>
	),
	user: ({ message }) => (
		<span>
			[<span className={`${openAIRoleColorMap.user}`}>user</span>]:{' '}
			<span className="text-base-content">{message}</span>
		</span>
	),
};

const contentMapper: Record<
	ModelVendor,
	(message: any, index: number) => React.ReactNode
> = {
	[ModelVendor.Cohere]: (
		m: ProviderMessageType<ModelVendor.Cohere>,
		i: number,
	) => (
		<span>
			[<span className="text-accent">{i}</span>]:{' '}
			<span className="text-info">{m.message}</span>
		</span>
	),
	[ModelVendor.OpenAI]: (m: ProviderMessageType<ModelVendor.OpenAI>) =>
		openAIRoleElementMapper[m.role]({
			message: isOpenAIContentMessage(m) ? m.content : m.name,
		}),
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
			<h2
				className="card-header"
				data-testid="prompt-content-display-title"
			>
				{t('promptTemplate')}
			</h2>
			<div
				className="rounded-data-card"
				data-testid="prompt-content-display-messages"
			>
				{messageContent.map((m, i) => (
					<p data-testid="message-content-paragraph" key={i}>
						{m}
					</p>
				))}
			</div>
		</div>
	);
}
