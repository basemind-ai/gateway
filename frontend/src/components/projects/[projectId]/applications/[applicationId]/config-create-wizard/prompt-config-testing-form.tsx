import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Record } from 'react-bootstrap-icons';

import { modelTypeToNameMap, modelVendorToLocaleMap } from '@/constants/models';
import { usePromptTesting } from '@/hooks/use-prompt-testing';
import {
	ModelParameters,
	ModelType,
	ModelVendor,
	OpenAIContentMessage,
	PromptConfigTest,
	ProviderMessageType,
} from '@/types';
import { parseDuration } from '@/utils/datetime';
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
	const t = useTranslations('createConfigWizard');
	const [testName, setTestName] = useState('');

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
			handleError(t('runningTestError'));
		},
		projectId,
	});

	const expectedVariables = messages.reduce<string[]>((acc, cur) => {
		return [...acc, ...(cur.templateVariables ?? [])];
	}, []);

	const handleRunTest = () => {
		resetState();

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
					onClick={testFinishReason ? resetState : handleRunTest}
				>
					{testFinishReason ? t('newTest') : t('runTest')}
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
				<table className="custom-table w-full mb-5">
					<thead>
						<tr>
							<th>{t('modelVendor')}</th>
							<th>{t('modelType')}</th>
							<th>{t('finishReason')}</th>
							<th>{t('duration')}</th>
							<th>{t('requestTokens')}</th>
							<th>{t('responseTokens')}</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td data-testid="test-model-vendor-display">
								{modelVendorToLocaleMap[modelVendor]}
							</td>
							<td data-testid="test-model-type-display">
								{modelTypeToNameMap[modelType]}
							</td>
							<td data-testid="test-finish-reason-display">
								{testFinishReason || 'N/A'}
							</td>
							<td data-testid="test-duration-display">
								{testRecord
									? parseDuration(
											testRecord.streamResponseLatency,
									  )
									: `0 MS`}
							</td>
							<td data-testid="test-request-tokens-display">
								{testRecord ? testRecord.requestTokens : 0}
							</td>
							<td data-testid="test-response-tokens-display">
								{testRecord ? testRecord.responseTokens : 0}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
