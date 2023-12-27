import { useTranslations } from 'next-intl';
import { ChevronRight, PlayFill, Record, Repeat } from 'react-bootstrap-icons';

import { CardHeaderWithTooltip } from '@/components/card-header-with-tooltip';
import { PromptContentDisplay } from '@/components/prompt-display-components/prompt-content-display';
import { PromptTestInputs } from '@/components/prompt-display-components/prompt-test-inputs';
import { PromptTestResultTable } from '@/components/prompt-display-components/prompt-test-result-table';
import { WebsocketError } from '@/errors';
import { useAnalytics } from '@/hooks/use-analytics';
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
	projectCredits,
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
	projectCredits?: string;
	projectId: string;
	promptConfigId?: string;
	setTemplateVariables: (templateVariables: Record<string, string>) => void;
	showPromptTemplateDisplay?: boolean;
	templateVariables: Record<string, string>;
}) {
	const t = useTranslations('createConfigWizard');
	const { initialized, track } = useAnalytics();
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
			if (initialized) {
				track('run_config_test', config);
			}
		} catch (e) {
			handleError(e);
		}
	};

	const allExpectedVariablesHaveLength = expectedVariables.every(
		(variable) =>
			templateVariables[variable] &&
			templateVariables[variable].length > 0,
	);

	const renderButtonIcon = () => {
		if (isRunningTest) {
			return (
				<span className="loading loading-bars text-neutral-content" />
			);
		} else if (testFinishReason) {
			return <Repeat className="h-5 w-5" />;
		} else {
			return <PlayFill className="h-6 w-6" />;
		}
	};

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
					<CardHeaderWithTooltip
						headerText={t('variables')}
						tooltipText={t('variablesTooltip')}
						dataTestId="test-inputs-header"
					/>
					<div className="rounded-dark-card">
						<div className="card-section-divider" />
						<PromptTestInputs
							setTemplateVariables={setTemplateVariables}
							templateVariables={templateVariables}
							expectedVariables={expectedVariables}
						/>
					</div>
				</>
			)}
			<div className="card-section-divider" />
			<button
				disabled={!allExpectedVariablesHaveLength || isRunningTest}
				data-testid="run-test-button"
				className="btn btn-wide btn-primary bg-base-content text-base-100 self-center"
				onClick={testFinishReason ? resetState : handleRunTest}
			>
				{renderButtonIcon()}
				{t('runTest')}
			</button>

			{projectCredits && (
				<span className="text-neutral-content text-sm text-center pt-2">
					{`${t('credits') + projectCredits}$`}
				</span>
			)}
			<div className="card-section-divider" />
			<h2 className="card-header">{t('testResults')}</h2>
			<div className="rounded-dark-card">
				<PromptTestResultTable
					modelVendor={modelVendor}
					modelType={modelType}
					testFinishReason={testFinishReason}
					testRecord={testRecord}
				/>
				<div
					className="flex gap-2 pl-4 content-center items-center"
					data-testid="model-response-container"
				>
					<ChevronRight className="h-4 w-4" />
					<span className="text-info">
						{modelResponses
							.map((message) => message.content)
							.join(' ')}
					</span>
				</div>
				<div className="card-section-divider" />
			</div>
		</div>
	);
}
