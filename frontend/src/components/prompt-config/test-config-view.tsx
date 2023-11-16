import { useTranslations } from 'next-intl';
import {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';

import { createWebsocket, WebsocketHandler } from '@/api';
import ModelConfigurationView from '@/components/prompt-config/model-configuration-view';
import OpenAIPromptTemplate from '@/components/prompt-config/open-a-i-prompt-template';
import Results from '@/components/prompt-config/results';
import TestInputs from '@/components/prompt-config/test-inputs';
import { useShowError } from '@/stores/toast-store';
import {
	ModelVendor,
	PromptConfigTest,
	PromptConfigTestResultChunk,
} from '@/types';

enum TestSection {
	ModelConfiguration = 'modelConfiguration',
	PromptTemplate = 'promptTemplate',
	Results = 'results',
	TestInputs = 'testInputs',
}

export default function TestConfigView<T extends ModelVendor>({
	promptTestConfig,
	setPromptTestConfig,
	projectId,
	applicationId,
}: {
	applicationId: string;
	projectId: string;
	promptTestConfig: PromptConfigTest<T>;
	setPromptTestConfig: Dispatch<SetStateAction<PromptConfigTest<T>>>;
}) {
	const t = useTranslations('promptTesting');
	const showError = useShowError();

	const [openSection, setOpenSection] = useState<TestSection | null>(
		TestSection.ModelConfiguration,
	);
	const [websocketHandler, setWebsocketHandler] =
		useState<null | WebsocketHandler<any>>(null);

	const [resultTestConfig, setResultTestConfig] =
		useState<PromptConfigTest<T> | null>(null);
	const [testResult, setTestResult] = useState<PromptConfigTestResultChunk[]>(
		[],
	);

	useEffect(() => {
		(async () => {
			const handler = await createWebsocket<any>({
				applicationId,
				handleClose: () => {
					return;
				},
				handleError,
				handleMessage,
				projectId,
			});
			setWebsocketHandler(handler);
		})();

		return () => websocketHandler?.closeSocket();
	}, []);

	const toggleSection = (section: TestSection | null) => {
		setOpenSection(openSection === section ? null : section);
	};

	const handleRunTest = () => {
		setResultTestConfig(promptTestConfig);
		setTestResult([]);

		if (openSection === TestSection.TestInputs) {
			toggleSection(TestSection.Results);
		}

		void websocketHandler?.sendMessage(promptTestConfig);
	};

	const handleMessage = useCallback(
		({ data }: MessageEvent<PromptConfigTestResultChunk>) => {
			setTestResult((oldResults) => [...oldResults, data]);
		},
		[testResult],
	);

	const handleError = useCallback(() => {
		showError(t('runningTestError'));
	}, []);

	const getHeadlineOpacity = (section: string) =>
		openSection === section ? 'opacity-100' : 'opacity-80';

	const getSectionYSize = (section: string) =>
		openSection === section ? 'scale-y-100' : 'scale-y-0';

	return (
		<>
			<div>
				<div
					data-testid="model-config-headline"
					className={`flex justify-between cursor-pointer hover:opacity-100 ${getHeadlineOpacity(
						TestSection.ModelConfiguration,
					)}`}
					onClick={() => {
						toggleSection(TestSection.ModelConfiguration);
					}}
				>
					<h2 className="text-xl font-normal text-base-content mb-4">
						{t('modelConfig')}
					</h2>
					{openSection === TestSection.ModelConfiguration ? (
						<ChevronUp />
					) : (
						<ChevronDown />
					)}
				</div>
				<div
					className={`transform transition-transform duration-300 ease-in-out ${getSectionYSize(
						TestSection.ModelConfiguration,
					)} origin-top`}
				>
					{openSection === 'modelConfiguration' && (
						<ModelConfigurationView
							promptTestConfig={promptTestConfig}
							setPromptTestConfig={setPromptTestConfig}
						/>
					)}
				</div>
			</div>
			<div>
				<div
					data-testid="prompt-template-headline"
					className={`flex justify-between cursor-pointer hover:opacity-100 ${getHeadlineOpacity(
						TestSection.PromptTemplate,
					)}`}
					onClick={() => {
						toggleSection(TestSection.PromptTemplate);
					}}
				>
					<h2
						className={`text-xl font-normal text-base-content mb-4`}
					>
						{t('promptTemplate')}
					</h2>
					{openSection === TestSection.PromptTemplate ? (
						<ChevronUp />
					) : (
						<ChevronDown />
					)}
				</div>
				<div
					className={`transform transition-transform duration-300 ease-in-out ${getSectionYSize(
						TestSection.PromptTemplate,
					)} origin-top`}
				>
					{openSection === TestSection.PromptTemplate &&
						(promptTestConfig.modelVendor === ModelVendor.OpenAI ? (
							<OpenAIPromptTemplate
								promptTestConfig={
									promptTestConfig as PromptConfigTest<ModelVendor.OpenAI>
								}
								setPromptTestConfig={
									setPromptTestConfig as Dispatch<
										SetStateAction<
											PromptConfigTest<ModelVendor.OpenAI>
										>
									>
								}
							/>
						) : null)}
				</div>
			</div>
			<div>
				<div
					className={`flex justify-between cursor-pointer hover:opacity-100 ${getHeadlineOpacity(
						TestSection.TestInputs,
					)}`}
					onClick={() => {
						toggleSection(TestSection.TestInputs);
					}}
				>
					<h2 className="text-xl font-normal text-base-content mb-4">
						{t('testInputs')}
					</h2>
					{openSection === TestSection.TestInputs ? (
						<ChevronUp />
					) : (
						<ChevronDown />
					)}
				</div>
				<div
					className={`transform transition-transform duration-300 ease-in-out ${getSectionYSize(
						TestSection.TestInputs,
					)} origin-top`}
				>
					{openSection === TestSection.TestInputs && (
						<TestInputs<T>
							templateVariables={
								promptTestConfig.templateVariables
							}
							setPromptTestConfig={setPromptTestConfig}
							handleRunTest={handleRunTest}
						/>
					)}
				</div>
			</div>
			<div>
				<div
					className={`flex justify-between cursor-pointer hover:opacity-100 ${getHeadlineOpacity(
						TestSection.Results,
					)}`}
					onClick={() => {
						toggleSection(TestSection.Results);
					}}
				>
					<h2 className="text-xl font-normal text-base-content mb-4">
						{t('results')}
					</h2>
					{openSection === TestSection.Results ? (
						<ChevronUp />
					) : (
						<ChevronDown />
					)}
				</div>
				<div
					className={`transform transition-transform duration-300 ease-in-out ${getSectionYSize(
						TestSection.Results,
					)} origin-top`}
				>
					{openSection === TestSection.Results && (
						<Results
							handleRunTest={handleRunTest}
							testConfig={resultTestConfig}
							result={testResult}
						/>
					)}
				</div>
			</div>
		</>
	);
}
