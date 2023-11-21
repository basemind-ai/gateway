'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Record } from 'react-bootstrap-icons';
import { shallow } from 'zustand/shallow';

import { handleCreatePromptConfig } from '@/api';
import { Navbar } from '@/components/navbar';
import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import { PromptConfigTesting } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/prompt-config-testing-form';
import { Navigation, TimeUnit } from '@/constants';
import { ApiError } from '@/errors';
import { useProject, useProjects, usePromptConfigs } from '@/stores/api-store';
import {
	usePromptWizardStore,
	WizardStage,
	wizardStoreSelector,
} from '@/stores/prompt-config-wizard-store';
import { useShowError } from '@/stores/toast-store';
import { setPathParams } from '@/utils/navigation';

export default function PromptConfigCreateWizard({
	params: { applicationId, projectId },
}: {
	params: { applicationId: string; projectId: string };
}) {
	const t = useTranslations('createConfigWizard');
	const showError = useShowError();
	const router = useRouter();
	const project = useProject(projectId);
	const projects = useProjects();
	const promptConfigs = usePromptConfigs();

	const [isLoading, setIsLoading] = useState(false);

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

	const handleTemplateVariablesChange = useCallback(
		store.setTemplateVariables,
		[store.setTemplateVariables],
	);

	const nameIsInvalid = Boolean(
		promptConfigs[applicationId]
			?.map((c) => c.name)
			?.includes(store.configName),
	);

	const wizardStageComponentMap: Record<WizardStage, React.ReactElement> = {
		[WizardStage.NAME_AND_MODEL]: useMemo(
			() => (
				<PromptConfigBaseForm
					configName={store.configName}
					setConfigName={handleConfigNameChange}
					modelType={store.modelType}
					modelVendor={store.modelVendor}
					setModelType={handleModelTypeChange}
					setVendor={handleModelVendorChange}
					nameIsInvalid={nameIsInvalid}
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
				<PromptConfigTesting
					messages={store.messages}
					templateVariables={store.templateVariables}
					setTemplateVariables={handleTemplateVariablesChange}
					applicationId={applicationId}
					projectId={projectId}
					modelType={store.modelType}
					modelVendor={store.modelVendor}
					parameters={store.parameters}
					handleError={showError}
				/>
			),
			[
				store.messages,
				store.templateVariables,
				handleTemplateVariablesChange,
			],
		),
	};

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
			router.replace(
				setPathParams(Navigation.PromptConfigDetail, {
					applicationId,
					projectId,
					promptConfigId,
				}),
			);
			setTimeout(() => {
				store.resetState();
			}, TimeUnit.OneSecondInMilliseconds);
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div data-testid="config-create-wizard-page" className="my-8 mx-32">
			<Navbar
				project={project!}
				headerText={`${t('createPromptConfigTitle')} / ${
					store.configName
				}`}
				showSelect={projects.length > 1}
			/>
			<div className="bg-base-300 transform transition-transform duration-300 ease-in-out custom-card">
				{isLoading ? (
					<div className="loading loading-dots loading-lg" />
				) : (
					wizardStageComponentMap[store.wizardStage]
				)}
				{store.wizardStage < 2 && (
					<div className="divider divide-accent" />
				)}
				<div className="gap-4 items-center justify-between px-5 modal-action">
					<button
						data-testid="config-create-wizard-cancel-button"
						onClick={() => {
							router.push(
								setPathParams(Navigation.ApplicationDetail, {
									applicationId,
									projectId,
								}),
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
									isLoading ||
									(store.wizardStage === 1 &&
										!store.messages.length)
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
									nameIsInvalid ||
									isLoading ||
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
		</div>
	);
}
