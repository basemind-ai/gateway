import { useMemo } from 'react';

import { CohereParametersForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/cohere-model-parameters-form';
import {
	OpenAIModelParametersForm,
	OpenAIPromptTemplate,
} from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/openai-model-parameters-form';
import {
	ModelParameters,
	ModelType,
	ModelVendor,
	OpenAIContentMessage,
	OpenAIModelParameters,
	OpenAIModelType,
	ProviderMessageType,
} from '@/types';

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
	const parametersForm = useMemo(() => {
		if (modelVendor === ModelVendor.Cohere) {
			return (
				<CohereParametersForm
					modelType={modelType as OpenAIModelType}
					setParameters={setParameters}
					existingParameters={
						existingParameters as OpenAIModelParameters
					}
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
	}, [modelVendor]);

	return (
		<div
			className="flex flex-col"
			data-testid="parameters-and-prompt-form-container"
		>
			<div>{parametersForm}</div>
			<div className="card-divider" />
			<div>
				{modelVendor === ModelVendor.OpenAI && (
					<OpenAIPromptTemplate
						messages={(messages ?? []) as OpenAIContentMessage[]}
						setMessages={
							setMessages as (
								messages: OpenAIContentMessage[],
							) => void
						}
					/>
				)}
			</div>
		</div>
	);
}
