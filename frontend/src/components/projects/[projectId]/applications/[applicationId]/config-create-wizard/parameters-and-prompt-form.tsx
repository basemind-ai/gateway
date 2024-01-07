import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';

import { CohereModelParametersForm } from '@/components/prompt-display-components/cohere-components/cohere-model-parameters-form';
import { CoherePromptTemplate } from '@/components/prompt-display-components/cohere-components/cohere-prompt-template';
import { OpenAIModelParametersForm } from '@/components/prompt-display-components/openai-components/openai-model-parameters-form';
import { OpenAIPromptTemplateForm } from '@/components/prompt-display-components/openai-components/openai-prompt-template-form';
import { Dimensions } from '@/constants';
import {
	CohereModelParameters,
	CohereModelType,
	CoherePromptMessage,
	ModelParameters,
	ModelType,
	ModelVendor,
	OpenAIContentMessage,
	OpenAIModelParameters,
	OpenAIModelType,
	ProviderMessageType,
} from '@/types';

function ParametersForm<T extends ModelVendor>({
	existingParameters,
	setParameters,
	modelType,
	modelVendor,
}: {
	existingParameters?: ModelParameters<T>;
	modelType: ModelType<T>;
	modelVendor: T;
	setParameters: (parameters: ModelParameters<T>) => void;
}) {
	if (modelVendor === ModelVendor.Cohere) {
		return (
			<CohereModelParametersForm
				modelType={modelType as CohereModelType}
				setParameters={setParameters}
				existingParameters={existingParameters as CohereModelParameters}
			/>
		);
	}
	return (
		<OpenAIModelParametersForm
			modelType={modelType as OpenAIModelType}
			setParameters={setParameters}
			existingParameters={existingParameters as OpenAIModelParameters}
		/>
	);
}

function TemplateForm<T extends ModelVendor>({
	setMessages,
	modelVendor,
	messages,
}: {
	messages: ProviderMessageType<T>[];
	modelVendor: T;
	setMessages: (messages: ProviderMessageType<T>[]) => void;
}) {
	if (modelVendor === ModelVendor.Cohere) {
		return (
			<CoherePromptTemplate
				messages={messages as CoherePromptMessage[]}
				setMessages={
					setMessages as (messages: CoherePromptMessage[]) => void
				}
			/>
		);
	}
	return (
		<OpenAIPromptTemplateForm
			messages={messages as OpenAIContentMessage[]}
			setMessages={
				setMessages as (messages: OpenAIContentMessage[]) => void
			}
		/>
	);
}

export function PromptConfigParametersAndPromptForm<T extends ModelVendor>({
	modelVendor,
	modelType,
	messages,
	existingParameters,
	setParameters,
	setMessages,
}: {
	existingParameters?: ModelParameters<T>;
	messages?: ProviderMessageType<T>[];
	modelType: ModelType<T>;
	modelVendor: T;
	setMessages: (messages: ProviderMessageType<T>[]) => void;
	setParameters: (parameters: ModelParameters<T>) => void;
}) {
	const t = useTranslations('createConfigWizard');

	const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

	return (
		<div
			className="flex flex-col"
			data-testid="parameters-and-prompt-form-container"
		>
			<TemplateForm
				messages={messages ?? []}
				modelVendor={modelVendor}
				setMessages={setMessages}
			/>
			<div className="card-divider" />
			<button
				data-testid="advanced-options-toggle"
				className="flex w-fit justify-between items-center gap-2"
				onClick={() => {
					setShowAdvancedOptions(!showAdvancedOptions);
				}}
			>
				<span>{t('advancedOptions')}</span>
				{showAdvancedOptions ? (
					<ChevronUp
						height={Dimensions.Four}
						width={Dimensions.Four}
					/>
				) : (
					<ChevronDown
						height={Dimensions.Four}
						width={Dimensions.Four}
					/>
				)}
			</button>
			{showAdvancedOptions && (
				<ParametersForm
					existingParameters={existingParameters}
					modelType={modelType}
					modelVendor={modelVendor}
					setParameters={setParameters}
				/>
			)}
		</div>
	);
}
