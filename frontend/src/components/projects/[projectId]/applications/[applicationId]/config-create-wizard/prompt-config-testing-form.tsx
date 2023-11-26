import { useTranslations } from 'next-intl';
import { ChevronRight, PlayFill, Record, Repeat } from 'react-bootstrap-icons';

import { PromptContentDisplay } from '@/components/prompt-display-components/prompt-content-display';
import { PromptTestInputs } from '@/components/prompt-display-components/prompt-test-inputs';
import { PromptTestResultTable } from '@/components/prompt-display-components/prompt-test-result-table';
import { WebsocketError } from '@/errors';
import { usePromptTesting } from '@/hooks/use-prompt-testing';
import {
	ModelParameters,
	ModelType,
	ModelVendor,
	PromptConfigTest,
	ProviderMessageType,
} from '@/types';

export const finishReasonStyle = (finishReason: string): string => {
	switch (finishReason) {
		case 'error': {
			return 'text-error';
		}
		case 'done': {
			return 'text-success';
		}
		default: {
			return 'text-warning';
		}
	}
};

export function PromptConfigTestingForm<T extends ModelVendor>({
	messages,
	templateVariables,
	setTemplateVariables,
	projectId,
	applicationId,
	handleError,
	modelVendor,
	modelType,
	parameters,
	promptConfigId,
	showPromptTemplateDisplay = true,
}: {
	applicationId: string;
	handleError: (error: unknown) => void;
	messages: ProviderMessageType<T>[];
	modelType: ModelType<T>;
	modelVendor: T;
	parameters: ModelParameters<T>;
	projectId: string;
	promptConfigId?: string;
	setTemplateVariables: (templateVariables: Record<string, string>) => void;
	showPromptTemplateDisplay?: boolean;
	templateVariables: Record<string, string>;
}) {
	const t = useTranslations('createConfigWizard');

	const {
		isRunningTest,
		modelResponses,
		sendMessage,
		testFinishReason,
		testRecord,
		resetState,
	} = usePromptTesting({
		applicationId,
		handleError: () => {
			handleError(new WebsocketError(t('runningTestError')));
		},
		projectId,
	});

	const expectedVariables = messages.reduce<string[]>((acc, cur) => {
		return [...acc, ...(cur.templateVariables ?? [])];
	}, []);

	const handleRunTest = async () => {
		resetState();

		const config = {
			modelParameters: parameters,
			modelType,
			modelVendor,
			promptConfigId,
			promptMessages: messages,
			templateVariables,
		} satisfies PromptConfigTest<T>;

		try {
			await sendMessage(config);
		} catch (e) {
			handleError(e);
		}
	};

	const allExpectedVariablesHaveLength = expectedVariables.every(
		(variable) =>
			templateVariables[variable] &&
			templateVariables[variable].length > 0,
	);

	return (
		<div
			className="flex flex-col justify-evenly"
			data-testid="prompt-config-testing-form"
		>
			{showPromptTemplateDisplay && (
				<PromptContentDisplay
					modelVendor={modelVendor}
					messages={messages}
				/>
			)}
			{expectedVariables.length > 0 && (
				<>
					<div className="card-section-divider" />
					<PromptTestInputs
						setTemplateVariables={setTemplateVariables}
						templateVariables={templateVariables}
						expectedVariables={expectedVariables}
					/>
				</>
			)}
			<div className="card-section-divider" />
			<div className="flex justify-center items-end p-4">
				<button
					disabled={!allExpectedVariablesHaveLength || isRunningTest}
					data-testid="run-test-button"
					className="btn btn-primary btn-outline btn-circle btn-lg"
					onClick={testFinishReason ? resetState : handleRunTest}
				>
					{testFinishReason ? (
						<Repeat className="h-8 w-8" />
					) : (
						<PlayFill className="h-8 w-8" />
					)}
				</button>
			</div>

			<div className="card-section-divider" />
			<div>
				<h2 className="card-header">{t('modelResponse')}</h2>
				<div
					className="rounded-data-card flex flex-col gap-2"
					data-testid="model-response-container"
				>
					<ChevronRight className="h-4 w-4" />
					<span className="text-info">
						{modelResponses
							.map((message) => message.content)
							.join(' ')}
					</span>
				</div>
			</div>
			<div className="card-section-divider" />
			<PromptTestResultTable
				modelVendor={modelVendor}
				modelType={modelType}
				testFinishReason={testFinishReason}
				testRecord={testRecord}
			/>
		</div>
	);
}
