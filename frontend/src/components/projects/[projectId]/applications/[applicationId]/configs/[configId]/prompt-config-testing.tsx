import deepEqual from 'fast-deep-equal/es6';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';

import { handleUpdatePromptConfig } from '@/api';
import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import { PromptConfigTestingForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/prompt-config-testing-form';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	ModelType,
	ModelVendor,
	PromptConfig,
	ProviderMessageType,
} from '@/types';

export function PromptConfigTesting<T extends ModelVendor>({
	projectId,
	applicationId,
	promptConfig,
}: {
	applicationId: string;
	projectId: string;
	promptConfig: PromptConfig<T>;
}) {
	const t = useTranslations('promptConfig');

	const handleError = useHandleError();

	const initialValuesRef = useRef(structuredClone(promptConfig));

	const expectedVariablesRef = useRef<string[]>(
		promptConfig.providerPromptMessages
			.reduce<string[]>((acc, cur) => {
				return [...acc, ...(cur.templateVariables ?? [])];
			}, [])
			.sort(),
	);

	const [isLoading, setIsLoading] = useState(false);
	const [templateVariables, setTemplateVariables] = useState<
		Record<string, string>
	>({});
	const [modelType, setModelType] = useState<ModelType<T>>(
		promptConfig.modelType,
	);
	const [name, setName] = useState(promptConfig.name);
	const [modelVendor, setModelVendor] = useState<T>(promptConfig.modelVendor);
	const [messages, setMessages] = useState<ProviderMessageType<T>[]>(
		promptConfig.providerPromptMessages,
	);
	const [parameters, setParameters] = useState(promptConfig.modelParameters);

	const expectedVariables = useMemo(
		() =>
			messages
				.reduce<string[]>((acc, cur) => {
					return [...acc, ...(cur.templateVariables ?? [])];
				}, [])
				.sort(),
		[messages],
	);

	const isExpectedVariablesChanged = !deepEqual(
		expectedVariables,
		expectedVariablesRef.current,
	);

	const isChanged = useMemo(
		() =>
			initialValuesRef.current.modelType !== modelType ||
			initialValuesRef.current.modelVendor !== modelVendor ||
			!deepEqual(initialValuesRef.current.modelParameters, parameters) ||
			!deepEqual(
				initialValuesRef.current.providerPromptMessages,
				messages,
			),
		[modelType, modelVendor, parameters, messages],
	);

	const updatePromptConfig = async () => {
		setIsLoading(true);
		try {
			await handleUpdatePromptConfig({
				applicationId,
				data: {
					modelParameters: parameters,
					modelType,
					modelVendor,
					promptMessages: messages,
				},
				projectId,
				promptConfigId: promptConfig.id,
			});
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div data-testid="prompt-config-test-container">
			<PromptConfigBaseForm
				configName={promptConfig.name}
				modelType={modelType}
				modelVendor={modelVendor}
				setConfigName={() => undefined}
				setIsValid={() => undefined}
				setModelType={(m) => {
					setModelType(m as ModelType<T>);
				}}
				setVendor={(v) => {
					setModelVendor(v as T);
				}}
				validateConfigName={() => true}
				showConfigNameInput={false}
			/>
			<div className="card-divider" />
			<PromptConfigParametersAndPromptForm
				modelType={modelType}
				modelVendor={modelVendor}
				existingParameters={parameters}
				messages={messages}
				setMessages={setMessages}
				setParameters={setParameters}
			/>
			<div className="card-divider" />
			<PromptConfigTestingForm<T>
				applicationId={applicationId}
				promptConfigId={promptConfig.id}
				projectId={projectId}
				modelType={modelType}
				modelVendor={modelVendor}
				parameters={parameters}
				templateVariables={templateVariables}
				setTemplateVariables={setTemplateVariables}
				handleError={handleError}
				messages={messages}
				showPromptTemplateDisplay={false}
			/>
			<div className="card-divider" />
			<div
				data-testid="prompt-config-test-actions"
				className="rounded-data-card"
			>
				<div className="flex justify-end gap-2">
					<button
						disabled={
							isExpectedVariablesChanged ||
							!isChanged ||
							isLoading
						}
						className="card-action-button btn-primary"
						onClick={() => {
							void updatePromptConfig;
						}}
					>
						{isLoading ? (
							<span className="loading loading-spinner loading-xs mx-2" />
						) : (
							t('update')
						)}
					</button>
					<button
						className="card-action-button btn-primary"
						disabled={isLoading}
					>
						{isLoading ? (
							<span className="loading loading-spinner loading-xs mx-2" />
						) : (
							t('clone')
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
