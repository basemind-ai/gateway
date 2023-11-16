import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';

import { createWebsocket, WebsocketHandler } from '@/api';
import ModelConfigurationView from '@/components/prompt-config/model-configuration-view';
import PromptTemplate from '@/components/prompt-config/prompt-template';
import Results from '@/components/prompt-config/results';
import TestInputs from '@/components/prompt-config/test-inputs';
import { useShowError } from '@/stores/toast-store';
import {
	PromptConfigTest,
	PromptConfigTestResultChunk,
	TestSection,
} from '@/types';

export default function TestConfigView({
	config,
	setConfig,
	projectId,
	applicationId,
}: {
	applicationId: string;
	config: PromptConfigTest<any, any>;
	projectId: string;
	setConfig: React.Dispatch<React.SetStateAction<PromptConfigTest<any, any>>>;
}) {
	const t = useTranslations('promptTesting');
	const showError = useShowError();

	const [openSection, setOpenSection] = useState<TestSection | null>(
		TestSection.ModelConfiguration,
	);
	const [websocketHandler, setWebsocketHandler] =
		useState<null | WebsocketHandler<any, any>>(null);
	const [testConfig, setTestConfig] = useState<PromptConfigTest | null>(null);
	const [testResult, setTestResult] = useState<PromptConfigTestResultChunk[]>(
		[],
	);

	useEffect(() => {
		(async () => {
			const handler = await createWebsocket<any, any>({
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
		setTestConfig(config);
		setTestResult([]);

		if (openSection === TestSection.TestInputs) {
			toggleSection(TestSection.Results);
		}

		void websocketHandler?.sendMessage(config);
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
							promptTestConfig={config}
							setPromptTestConfig={setConfig}
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
					{openSection === TestSection.PromptTemplate && (
						<PromptTemplate config={config} setConfig={setConfig} />
					)}
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
						<TestInputs
							templateVariables={config.templateVariables}
							setConfig={setConfig}
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
							testConfig={testConfig}
							result={testResult}
						/>
					)}
				</div>
			</div>
		</>
	);
}
