import { ReactNode, useEffect, useState } from 'react';
import reactStringReplace from 'react-string-replace';

import { openAIRoleColorMap } from '@/constants/models';
import {
	ModelVendor,
	OpenAIPromptMessageRole,
	ProviderMessageType,
} from '@/types';
import { curlyBracketsRe } from '@/utils/models';

const openAIRoleElementMapper: Record<
	OpenAIPromptMessageRole,
	React.FC<{ message: string; templateVariables?: Record<string, string> }>
> = {
	[OpenAIPromptMessageRole.Assistant]: ({ message, templateVariables }) => (
		<span>
			[
			<span className={`text-${openAIRoleColorMap.assistant}`}>
				{`${OpenAIPromptMessageRole.Assistant} message`}
			</span>
			]:{' '}
			<span className="text-base-content">
				{parseTemplateVariables(message, templateVariables)}
			</span>
		</span>
	),

	[OpenAIPromptMessageRole.System]: ({ message, templateVariables }) => (
		<span>
			[
			<span
				className={`text-${openAIRoleColorMap.system}`}
			>{`${OpenAIPromptMessageRole.System} message`}</span>
			]:{' '}
			<span className="text-base-content">
				{parseTemplateVariables(message, templateVariables)}
			</span>
		</span>
	),
	[OpenAIPromptMessageRole.User]: ({ message, templateVariables }) => (
		<span>
			[
			<span
				className={`text-${openAIRoleColorMap.user}`}
			>{`${OpenAIPromptMessageRole.User} message`}</span>
			]:{' '}
			<span className="text-base-content">
				{parseTemplateVariables(message, templateVariables)}
			</span>
		</span>
	),
};

const contentMapper: Record<
	ModelVendor,
	(
		templateVariables?: Record<string, string>,
	) => (message: any, index: number) => React.ReactNode
> = {
	[ModelVendor.Cohere]:
		(templateVariables?: Record<string, string>) =>
		(m: ProviderMessageType<ModelVendor.Cohere>) => (
			<span className="text-base-content">
				{parseTemplateVariables(m.message, templateVariables)}
			</span>
		),
	[ModelVendor.OpenAI]:
		(templateVariables?: Record<string, string>) =>
		(m: ProviderMessageType<ModelVendor.OpenAI>) =>
			openAIRoleElementMapper[m.role]({
				message: m.content,
				templateVariables,
			}),
};

const parseTemplateVariables = (
	content: string,
	templateVariables?: Record<string, string>,
) => {
	return reactStringReplace(content, curlyBracketsRe, (match, i) => {
		const value = templateVariables?.[match] ?? '';
		return (
			<span
				key={i}
				className="text-accent"
				data-testid="template-variable"
			>
				{value || `{${match}}`}
			</span>
		);
	});
};

export function PromptContentDisplay<T extends ModelVendor>({
	messages,
	modelVendor,
	className = 'pt-2 pb-2',
	templateVariables,
}: {
	className?: string;
	messages: ProviderMessageType<T>[];
	modelVendor: ModelVendor;
	templateVariables?: Record<string, string>;
}) {
	const [parsedMessages, setParsedMessages] = useState<ReactNode[]>([]);

	useEffect(() => {
		const mapper = contentMapper[modelVendor](templateVariables);
		setParsedMessages(messages.map(mapper));
	}, [messages, modelVendor, templateVariables]);

	return (
		<div
			className={className}
			data-testid="prompt-content-display-container"
		>
			{parsedMessages.map((msg, i) => (
				<p
					className="text-base-content"
					data-testid="message-content-paragraph"
					key={i}
				>
					{msg}
				</p>
			))}
		</div>
	);
}
