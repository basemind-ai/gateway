import { useTranslations } from 'next-intl';

import { openAIRoleColorMap } from '@/constants/models';
import {
	ModelVendor,
	OpenAIPromptMessageRole,
	ProviderMessageType,
} from '@/types';
import { isOpenAIContentMessage } from '@/utils/predicates';

const openAIRoleElementMapper: Record<
	OpenAIPromptMessageRole,
	React.FC<{ message: string }>
> = {
	[OpenAIPromptMessageRole.Assistant]: ({ message }) => (
		<span>
			[
			<span className={`text-${openAIRoleColorMap.assistant}`}>
				{`${OpenAIPromptMessageRole.Assistant} message`}
			</span>
			]: <span className="text-base-content">{message}</span>
		</span>
	),
	[OpenAIPromptMessageRole.Tool]: ({ message }) => (
		<span>
			[
			<span className={`text-${openAIRoleColorMap.tool}`}>
				{`${OpenAIPromptMessageRole.Tool} message`}
			</span>
			]: <span className="text-base-content">{message}</span>
		</span>
	),
	[OpenAIPromptMessageRole.System]: ({ message }) => (
		<span>
			[
			<span
				className={`text-${openAIRoleColorMap.system}`}
			>{`${OpenAIPromptMessageRole.System} message`}</span>
			]: ]: <span className="text-base-content">{message}</span>
		</span>
	),
	[OpenAIPromptMessageRole.User]: ({ message }) => (
		<span>
			[
			<span
				className={`text-${openAIRoleColorMap.user}`}
			>{`${OpenAIPromptMessageRole.User} message`}</span>
			]: <span className="text-base-content">{message}</span>
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
				{messageContent.map((msg, i) => (
					<p
						className="text-base-content"
						data-testid="message-content-paragraph"
						key={i}
					>
						{msg}
					</p>
				))}
			</div>
		</div>
	);
}
