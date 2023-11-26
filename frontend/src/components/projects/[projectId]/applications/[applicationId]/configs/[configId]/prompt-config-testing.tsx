import deepEqual from 'fast-deep-equal/es6';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';

import { handleCreatePromptConfig, handleUpdatePromptConfig } from '@/api';
import { EntityNameInput } from '@/components/entity-name-input';
import { Modal } from '@/components/modal';
import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import { PromptConfigTestingForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/prompt-config-testing-form';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { usePromptConfigs, useSetPromptConfigs } from '@/stores/api-store';
import {
	ModelType,
	ModelVendor,
	PromptConfig,
	ProviderMessageType,
} from '@/types';
import { setRouteParams } from '@/utils/navigation';

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
	const promptConfigs = usePromptConfigs();
	const router = useRouter();
	const setPromptConfigs = useSetPromptConfigs();

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
	const [isNameModalOpen, setIsNameModalOpen] = useState(false);
	const [isNameValid, setIsNameValid] = useState(false);

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

	const validateName = (value: string) =>
		!(promptConfigs[applicationId]?.map((c) => c.name) ?? []).includes(
			value,
		);

	const updatePromptConfig = async () => {
		setIsLoading(true);
		try {
			const updatedPromptConfig = await handleUpdatePromptConfig({
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
			setPromptConfigs(applicationId, [
				...(promptConfigs[applicationId]?.filter(
					(pc) => pc.id !== updatedPromptConfig.id,
				) ?? []),
				updatedPromptConfig,
			]);
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	};

	const saveNewConfig = async () => {
		setIsLoading(true);
		try {
			const newPromptConfig = await handleCreatePromptConfig({
				applicationId,
				data: {
					modelParameters: parameters,
					modelType,
					modelVendor,
					name,
					promptMessages: messages,
				},
				projectId,
			});
			setPromptConfigs(applicationId, [
				...(promptConfigs[applicationId] ?? []),
				newPromptConfig,
			]);
			router.replace(
				setRouteParams(Navigation.PromptConfigDetail, {
					applicationId,
					projectId,
					promptConfigId: newPromptConfig.id,
				}),
			);
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
							!isChanged ||
							isExpectedVariablesChanged ||
							isLoading
						}
						className="card-action-button btn-secondary"
						data-testid="prompt-config-test-update-button"
						onClick={() => {
							void updatePromptConfig();
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
						data-testid="prompt-config-test-save-as-new-button"
						disabled={isLoading}
						onClick={() => {
							setIsNameModalOpen(true);
						}}
					>
						{isLoading ? (
							<span className="loading loading-spinner loading-xs mx-2" />
						) : (
							t('saveAsNew')
						)}
					</button>
				</div>
			</div>
			<Modal modalOpen={isNameModalOpen}>
				<div
					className="rounded-data-card"
					data-testid="save-as-new-name-form"
				>
					<EntityNameInput
						dataTestId={'prompt-config-save-as-new-name-input'}
						isLoading={isLoading}
						setIsValid={setIsNameValid}
						setValue={setName}
						validateValue={validateName}
						value={name}
					/>
					<div className="flex justify-end gap-2">
						<button
							className="card-action-button btn-neutral"
							data-testid="cancel-save-as-new-button"
							disabled={isLoading}
							onClick={() => {
								setIsNameModalOpen(false);
								setName(initialValuesRef.current.name);
							}}
						>
							{t('cancel')}
						</button>
						<button
							className="card-action-button btn-success"
							disabled={isLoading || !isNameValid}
							data-testid="confirm-save-as-new-button"
							onClick={() => {
								setIsNameModalOpen(false);
								void saveNewConfig();
							}}
						>
							{isLoading ? (
								<span className="loading loading-spinner loading-xs mx-2" />
							) : (
								t('confirm')
							)}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
