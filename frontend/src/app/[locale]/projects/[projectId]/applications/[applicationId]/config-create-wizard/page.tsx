'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Record } from 'react-bootstrap-icons';
import { shallow } from 'zustand/shallow';

import { handleCreatePromptConfig } from '@/api';
import { Modal } from '@/components/modal';
import { Navbar } from '@/components/navbar';
import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import { PromptConfigTestingForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/prompt-config-testing-form';
import { ProviderKeyCreateModal } from '@/components/projects/[projectId]/provider-key-create-modal';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { useSwrProviderKeys } from '@/hooks/use-swr-provider-keys';
import { useProject, useProjects, usePromptConfigs } from '@/stores/api-store';
import {
	usePromptWizardStore,
	WizardStage,
	wizardStoreSelector,
} from '@/stores/prompt-config-wizard-store';
import { ProviderKey } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export default function PromptConfigCreateWizard({
	params: { applicationId, projectId },
}: {
	params: { applicationId: string; projectId: string };
}) {
	const t = useTranslations('createConfigWizard');
	const handleError = useHandleError();

	const router = useRouter();

	const [nameIsValid, setNameIsValid] = useState(false);

	const project = useProject(projectId);
	const projects = useProjects();

	const promptConfigs = usePromptConfigs();

	const [isLoading, setIsLoading] = useState(false);
	const [isCreateProviderKeyModalOpen, setIsCreateProviderKeyModalOpen] =
		useState(false);

	const { providerKeys, setProviderKeys } = useSwrProviderKeys({ projectId });

	const store = usePromptWizardStore(wizardStoreSelector, shallow);

	// callbacks
	const handleConfigNameChange = useCallback(store.setConfigName, [
		store.setConfigName,
	]);

	const handleModelVendorChange = useCallback(store.setModelVendor, [
		store.setModelVendor,
	]);

	const handleModelTypeChange = useCallback(store.setModelType, [
		store.setModelType,
	]);

	const handleMessagesChange = useCallback(store.setMessages, [
		store.setMessages,
	]);

	const handleParametersChange = useCallback(store.setParameters, [
		store.setParameters,
	]);

	const validateConfigName = useCallback(
		(value: string) =>
			!(promptConfigs[applicationId]?.map((c) => c.name) ?? []).includes(
				value,
			),
		[promptConfigs],
	);

	const handleTemplateVariablesChange = useCallback(
		store.setTemplateVariables,
		[store.setTemplateVariables],
	);

	const hasProviderKey = useMemo(
		() => providerKeys.some((p) => p.modelVendor === store.modelVendor),
		[providerKeys, store.modelVendor],
	);

	const wizardStageComponentMap: Record<WizardStage, React.ReactElement> = {
		[WizardStage.NAME_AND_MODEL]: useMemo(
			() => (
				<PromptConfigBaseForm
					validateConfigName={validateConfigName}
					configName={store.configName}
					modelType={store.modelType}
					modelVendor={store.modelVendor}
					setIsValid={setNameIsValid}
					setConfigName={handleConfigNameChange}
					setModelType={handleModelTypeChange}
					setVendor={handleModelVendorChange}
				/>
			),
			[
				store.configName,
				handleConfigNameChange,
				store.modelType,
				store.modelVendor,
				handleModelTypeChange,
				handleModelVendorChange,
				promptConfigs,
			],
		),
		[WizardStage.PARAMETERS_AND_PROMPT]: useMemo(
			() => (
				<PromptConfigParametersAndPromptForm
					modelVendor={store.modelVendor}
					messages={store.messages}
					setParameters={handleParametersChange}
					setMessages={handleMessagesChange}
					existingParameters={undefined}
					modelType={store.modelType}
				/>
			),
			[
				store.modelVendor,
				store.messages,
				store.parameters,
				handleParametersChange,
				handleMessagesChange,
			],
		),
		[WizardStage.TEST]: useMemo(
			() => (
				<PromptConfigTestingForm
					messages={store.messages}
					templateVariables={store.templateVariables}
					setTemplateVariables={handleTemplateVariablesChange}
					applicationId={applicationId}
					projectId={projectId}
					modelType={store.modelType}
					modelVendor={store.modelVendor}
					parameters={store.parameters}
					handleError={handleError}
				/>
			),
			[
				store.messages,
				store.templateVariables,
				handleTemplateVariablesChange,
			],
		),
	};

	useEffect(() => {
		if (!hasProviderKey && store.wizardStage === 1) {
			setIsCreateProviderKeyModalOpen(true);
		}
	}, [store.wizardStage]);

	const handleConfigSave = async () => {
		setIsLoading(true);

		try {
			const { id: promptConfigId } = await handleCreatePromptConfig({
				applicationId,
				data: {
					modelParameters: store.parameters,
					modelType: store.modelType,
					modelVendor: store.modelVendor,
					name: store.configName,
					promptMessages: store.messages,
				},
				projectId,
			});
			store.resetState();
			router.replace(
				setRouteParams(Navigation.PromptConfigDetail, {
					applicationId,
					projectId,
					promptConfigId,
				}),
			);
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div data-testid="config-create-wizard-page" className="my-8 mx-32">
			{isLoading ? (
				<div className="flex flex-col justify-center items-center h-full right-0 left-0 top-0 bottom-0 absolute m-auto">
					<div className="loading loading-spinner loading-lg align-middle" />
				</div>
			) : (
				<>
					<Navbar
						project={project!}
						headerText={`${t('createPromptConfigTitle')} / ${
							store.configName
						}`}
						showSelect={projects.length > 1}
					/>
					<div className="bg-base-300 transform transition-transform duration-300 ease-in-out rounded-data-card">
						{wizardStageComponentMap[store.wizardStage]}
						{store.wizardStage < 2 && (
							<div className="divider divide-accent" />
						)}
						<div className="gap-4 items-center justify-between px-5 modal-action">
							<button
								data-testid="config-create-wizard-cancel-button"
								onClick={() => {
									router.push(
										setRouteParams(
											Navigation.ApplicationDetail,
											{
												applicationId,
												projectId,
											},
										),
									);
								}}
								className="btn btn-neutral"
							>
								{t('cancelButtonText')}
							</button>
							<div className="flex justify-between gap-4">
								{store.wizardStage > 0 && (
									<button
										data-testid="config-create-wizard-back-button"
										onClick={store.setPrevWizardStage}
										className="btn btn-secondary"
										disabled={isLoading}
									>
										{t('backButtonText')}
									</button>
								)}
								{store.wizardStage >= 1 && (
									<button
										data-testid="config-create-wizard-save-button"
										onClick={() => {
											void handleConfigSave();
										}}
										className="btn btn-primary"
										disabled={
											store.wizardStage === 1 &&
											!store.messages.length
										}
									>
										{store.wizardStage === 1
											? t('skipAndSaveButtonText')
											: t('saveButtonText')}
									</button>
								)}
								{store.wizardStage < 2 && (
									<button
										data-testid="config-create-wizard-continue-button"
										onClick={store.setNextWizardStage}
										className="btn btn-primary"
										disabled={
											!nameIsValid ||
											(store.wizardStage === 0 &&
												!store.configName.length) ||
											(store.wizardStage === 1 &&
												!store.messages.length)
										}
									>
										{t('continueButtonText')}
									</button>
								)}
							</div>
						</div>
					</div>
				</>
			)}
			<Modal
				modalOpen={isCreateProviderKeyModalOpen}
				dataTestId="config-create-wizard-create-provider-key-dialog"
			>
				<div className="p-10">
					<ProviderKeyCreateModal
						projectId={projectId}
						vendors={[]}
						modelVendor={store.modelVendor}
						closeModal={() => {
							setIsCreateProviderKeyModalOpen(false);
						}}
						handleCancel={() => {
							setIsCreateProviderKeyModalOpen(false);
							store.setPrevWizardStage();
						}}
						addProviderKey={(providerKey: ProviderKey) => {
							setProviderKeys([...providerKeys, providerKey]);
						}}
					/>
				</div>
			</Modal>
		</div>
	);
}
