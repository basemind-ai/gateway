import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Record } from 'react-bootstrap-icons';

import { createWebsocket, WebsocketHandler } from '@/api';
import { modelTypeToNameMap } from '@/constants/models';
import {
	ModelParameters,
	ModelType,
	ModelVendor,
	PromptConfigTest,
	PromptConfigTestResultChunk,
	ProviderMessageType,
} from '@/types';
import { handleChange } from '@/utils/events';

const finishReasonStyle = (finishReason: string): string => {
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

	const [websocketHandler, setWebsocketHandler] =
		useState<null | WebsocketHandler<T>>(null);
	const [testIsRunning, setTestIsRunning] = useState(false);
	const [testName, setTestName] = useState('');
	const [results, setResults] = useState<PromptConfigTestResultChunk[]>([]);
	const [finishReason, setFinishReason] = useState('');

	useEffect(() => {
		(async () => {
			const handler = await createWebsocket<T>({
				applicationId,
				handleClose: () => {
					setWebsocketHandler(null);
				},
				handleError: () => {
					handleError(t('runningTestError'));
				},
				handleMessage: ({
					data,
				}: MessageEvent<PromptConfigTestResultChunk>) => {
					if (data.finishReason) {
						setTestIsRunning(false);
						setFinishReason(data.finishReason);
					}
					setResults((oldResults) => [...oldResults, data]);
				},
				projectId,
			});
			setWebsocketHandler(handler);
		})();

		return () => websocketHandler?.closeSocket();
	}, []);

	const expectedVariables = messages.reduce<string[]>((acc, cur) => {
		return [...acc, ...(cur.templateVariables ?? [])];
	}, []);

	const handleSetVariable = (key: string) => (value: string) => {
		setTemplateVariables({
			...templateVariables,
			[key]: value,
		});
	};

	const handleRunTest = () => {
		setTestIsRunning(true);
		setResults([]);

		const config = {
			modelParameters: parameters,
			modelType,
			modelVendor,
			name: testName,
			promptConfigId,
			promptMessages: messages,
			templateVariables,
		} satisfies PromptConfigTest<T>;

		void websocketHandler?.sendMessage(config);
	};
	return (
		<div className="flex flex-col">
			{expectedVariables.length ? (
				<div className="flex flex-col">
					<h2 className="text-center">{t('testInputs')}</h2>
					<div className="grid grid-cols-2 gap-4 min-w-[50%]">
						{expectedVariables.map((variable) => (
							<div key={variable} className="form-control">
								<label className="label">{`${t(
									'templateVariable',
								)} - ${variable}`}</label>
								<textarea
									className="textarea textarea-xs bg-neutral w-96"
									data-testid={`test-textarea-${variable}`}
									value={templateVariables[variable]}
									onChange={handleChange(
										handleSetVariable(variable),
									)}
								/>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="w-full text-center mb-8">
					<p className="text-neutral-content">
						{t('noVariablesHeadline')}
					</p>
				</div>
			)}
			<div className="divider divide-accent" />
			<div className="flex justify-between items-center">
				<div className="form-control">
					<label className="label">
						<span className="label-text">{t('testName')}</span>
					</label>
					<input
						type="text"
						className="input input-bordered"
						value={testName}
						onChange={handleChange(setTestName)}
					/>
				</div>
				<button
					disabled={!testName.trim().length || testIsRunning}
					className="btn btn-primary btn-round self-end"
					onClick={handleRunTest}
				>
					{t('runTest')}
				</button>
			</div>
			{results.length > 0 && (
				<>
					<div className="divider divide-accent" />
					<div className="flex flex-col justify-between overflow-scroll">
						<div className="flex justify-between items-center">
							<h3 className="font-medium">{t('testResults')}</h3>
							<span>{modelTypeToNameMap[modelType]}</span>
						</div>
						<div className="border-accent border-2 rounded p-4">
							{results
								.map((message) => message.content)
								.join(' ')}
						</div>
						{finishReason && (
							<h4
								className={`p-4 text-center ${finishReasonStyle(
									finishReason,
								)} underline`}
							>
								{finishReason}
							</h4>
						)}
					</div>
				</>
			)}
		</div>
	);
}
