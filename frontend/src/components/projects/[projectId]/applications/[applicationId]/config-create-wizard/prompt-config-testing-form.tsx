import { useTranslations } from 'next-intl';
import { PlayFill, Record, Repeat } from 'react-bootstrap-icons';

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
	handleRefreshProject,
}: {
	applicationId: string;
	handleError: (error: unknown) => void;
	handleRefreshProject: () => Promise<void>;
	messages: ProviderMessageType<T>[];
	modelType: ModelType<T>;
	modelVendor: T;
	parameters: ModelParameters<T>;
	projectCredits: string;
	projectId: string;
	promptConfigId?: string;
	setTemplateVariables: (templateVariables: Record<string, string>) => void;
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
		handleRefreshProject,
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
				track('runConfigTest', {
					applicationId,
					projectId,
					promptConfigId,
				});
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

	const responseContent = modelResponses
		.map((message) => message.content)
		.join('');

	return (
		<div
			className="flex flex-col justify-evenly"
			data-testid="prompt-config-testing-form"
		>
			<div className="text-info text-xl text-center pb-5">
				{`${t('credits') + projectCredits}$`}
			</div>
			<>
				<div className="flex justify-between">
					<h2
						className="card-header self-end"
						data-testid="prompt-content-display-title"
					>
						{t('promptTemplate')}
					</h2>
					<button
						disabled={
							!allExpectedVariablesHaveLength || isRunningTest
						}
						data-testid="run-test-button"
						className="btn btn-wide btn-success self-start"
						onClick={testFinishReason ? resetState : handleRunTest}
					>
						{renderButtonIcon()}
						{t('runTest')}
					</button>
				</div>
				<PromptContentDisplay
					modelVendor={modelVendor}
					messages={messages}
				/>
			</>
			{expectedVariables.length > 0 && (
				<>
					<div className="card-divider" />
					<CardHeaderWithTooltip
						headerText={t('testInputs')}
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
			{responseContent && (
				<>
					<div className="card-divider" />
					<h2 className="card-header">{t('modelResponse')}</h2>
					<div className="rounded-dark-card">
						<div
							className="flex gap-2 pt-5 pb-5  content-center items-center"
							data-testid="model-response-container"
						>
							<span className="text-success">
								{responseContent}
							</span>
						</div>
					</div>
				</>
			)}
			{(testRecord ?? testFinishReason) && (
				<>
					<div className="card-divider" />
					<h2 className="card-header">{t('testResults')}</h2>
					<div className="rounded-dark-card">
						<PromptTestResultTable
							modelVendor={modelVendor}
							modelType={modelType}
							testFinishReason={testFinishReason}
							testRecord={testRecord}
						/>
					</div>
				</>
			)}
		</div>
	);
}
