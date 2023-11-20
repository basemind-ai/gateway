import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Record } from 'react-bootstrap-icons';

import {
	modelTypeToNameMap,
	modelVendorsTranslationKeyMap,
} from '@/constants/models';
import { usePromptTesting } from '@/hooks/use-prompt-testing';
import {
	ModelParameters,
	ModelType,
	ModelVendor,
	OpenAIContentMessage,
	PromptConfigTest,
	ProviderMessageType,
} from '@/types';
import { handleChange } from '@/utils/events';

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

export function PromptConfigTesting<T extends ModelVendor>({
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
}: {
	applicationId: string;
	handleError: (error: string) => void;
	messages: ProviderMessageType<T>[];
	modelType: ModelType<T>;
	modelVendor: T;
	parameters: ModelParameters<T>;
	projectId: string;
	promptConfigId?: string;
	setTemplateVariables: (templateVariables: Record<string, string>) => void;
	templateVariables: Record<string, string>;
}) {
	const t = useTranslations('createPromptConfigDialog');
	const [testName, setTestName] = useState('');

	const {
		isRunningTest,
		modelResponses,
		sendMessage,
		testFinishReason,
		testRecord,
	} = usePromptTesting({
		applicationId,
		handleError: () => {
			handleError(t('runningTestError'));
		},
		projectId,
	});

	const expectedVariables = messages.reduce<string[]>((acc, cur) => {
		return [...acc, ...(cur.templateVariables ?? [])];
	}, []);

	const handleRunTest = () => {
		const config = {
			modelParameters: parameters,
			modelType,
			modelVendor,
			name: testName,
			promptConfigId,
			promptMessages: messages,
			templateVariables,
		} satisfies PromptConfigTest<T>;

		void sendMessage(config);
	};

	const allExpectedVariablesHaveLength = expectedVariables.every(
		(variable) =>
			templateVariables[variable] &&
			templateVariables[variable].length > 0,
	);

	return (
		<div className="flex flex-col" data-testid="prompt-config-testing-form">
			<div>
				<h4 className="font-medium p-4">{t('promptTemplate')}</h4>
				<div className="border-2 border-neutral p-4 rounded">
					{messages.map((m, i) => (
						<p
							data-testid="message-content-paragraph"
							key={(m as OpenAIContentMessage).content + i}
						>
							{(m as OpenAIContentMessage).content}
						</p>
					))}
				</div>
			</div>
			{expectedVariables.length > 0 && (
				<div>
					<h4 className="font-medium p-4">{t('testInputs')}</h4>
					<div
						className="border-2 border-neutral p-4 rounded grid grid-cols-2 gap-4 min-w-[50%]"
						data-testid="test-inputs-container"
					>
						{expectedVariables.map((variable) => (
							<div key={variable} className="form-control">
								<input
									type="text"
									className="input input-secondary input-sm w-96 placeholder-accent"
									data-testid={`input-variable-input-${variable}`}
									value={templateVariables[variable]}
									placeholder={`{${variable}}`}
									onChange={handleChange((value: string) => {
										setTemplateVariables({
											...templateVariables,
											[variable]: value,
										});
									})}
								/>
							</div>
						))}
					</div>
				</div>
			)}
			<div className="flex justify-between items-center p-4">
				<div className="form-control">
					<label className="label">
						<span className="label-text">{t('testName')}</span>
					</label>
					<input
						type="text"
						data-testid="test-name-input"
						className="input input-sm input-bordered input-neutral"
						value={testName}
						onChange={handleChange(setTestName)}
					/>
				</div>
				<button
					disabled={
						!allExpectedVariablesHaveLength ||
						!testName.trim().length ||
						isRunningTest
					}
					data-testid="run-test-button"
					className="btn btn-primary btn-round self-end btn-sm"
					onClick={handleRunTest}
				>
					{t('runTest')}
				</button>
			</div>
			{modelResponses.length > 0 && (
				<div>
					<h4 className="font-medium p-4">{t('testResults')}</h4>
					<div
						className="border-2 border-neutral p-4 rounded"
						data-testid="model-response-container"
					>
						{modelResponses
							.map((message) => message.content)
							.join(' ')}
					</div>
				</div>
			)}
			<div className="pt-10">
				<div className="border-2 border-neutral p-4 rounded grid grid-cols-2 gap-4 min-w-[50%]">
					<div className="flex gap-4 justify-evenly p-1">
						<span
							className="self-end"
							data-testid="test-model-vendor-display"
						>
							{`${t('modelVendor')}: ${t(
								modelVendorsTranslationKeyMap[modelVendor],
							)}`}
						</span>
						<span
							className="self-end"
							data-testid="test-model-type-display"
						>
							{`${t('modelType')}: ${
								modelTypeToNameMap[modelType]
							}`}
						</span>
						{testFinishReason && (
							<span
								className="self-end"
								data-testid="test-finish-reason-display"
							>
								{`${t('finishReason')}: `}
								<span
									className={`self-end ${finishReasonStyle(
										testFinishReason,
									)}`}
								>
									{testFinishReason}
								</span>
							</span>
						)}
					</div>
					{testRecord && (
						<div className="flex gap-4 justify-evenly p-1">
							<span
								className="self-end"
								data-testid="test-latency-display"
							>
								{`${t('latency')}: ${
									testRecord.streamResponseLatency
								}`}
							</span>
							<span
								className="self-end"
								data-testid="test-request-tokens-display"
							>
								{`${t('requestTokens')}: ${
									testRecord.requestTokens
								}`}
							</span>
							<span
								className="self-end"
								data-testid="test-response-tokens-display"
							>
								{`${t('responseTokens')}: ${
									testRecord.responseTokens
								}`}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
