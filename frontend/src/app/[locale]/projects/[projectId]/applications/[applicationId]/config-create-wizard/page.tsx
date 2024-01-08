'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Record } from 'react-bootstrap-icons';
import { Oval } from 'react-loading-icons';
import { shallow } from 'zustand/shallow';

import { handleCreatePromptConfig, handleRetrieveProjects } from '@/api';
import { Navbar } from '@/components/navbar';
import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import { PromptConfigTestingForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/prompt-config-testing-form';
import { Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	useApplication,
	useProject,
	usePromptConfigs,
	useSetProjects,
} from '@/stores/api-store';
import {
	PromptConfigWizardStore,
	usePromptWizardStore,
	WizardStage,
	wizardStoreSelector,
} from '@/stores/prompt-config-wizard-store';
import { CoherePromptMessage, ModelVendor, OpenAIPromptMessage } from '@/types';
import { setRouteParams } from '@/utils/navigation';

const stepColor = 'step-secondary';
const stepper = Object.values(WizardStage).filter((v) => typeof v === 'number');

function shouldAllowContinue(store: PromptConfigWizardStore) {
	if (!store.configName.length) {
		return false;
	}

	if (store.wizardStage === 1) {
		if (!store.messages.length) {
			return false;
		}
		if (store.modelVendor === ModelVendor.Cohere) {
			const [message] = store.messages as CoherePromptMessage[];
			return message.message.trim().length;
		}
		return store.messages.every(
			(message) => (message as OpenAIPromptMessage).content.trim().length,
		);
	}

	return true;
}

export default function PromptConfigCreateWizard({
	params: { applicationId, projectId },
}: {
	params: { applicationId: string; projectId: string };
}) {
	const t = useTranslations('createConfigWizard');

	const application = useApplication(projectId, applicationId);
	const handleError = useHandleError();
	const project = useProject(projectId);
	const promptConfigs = usePromptConfigs();
	const router = useRouter();
	const setProjects = useSetProjects();
	const user = useAuthenticatedUser();

	const { initialized, page, track } = useAnalytics();

	const [nameIsValid, setNameIsValid] = useState(false);
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

	const handleRefreshProject = useCallback(async () => {
		try {
			const projects = await handleRetrieveProjects();
			setProjects(projects);
		} catch {
			handleError(t('errorRefreshingProject'));
		}
	}, [setProjects]);

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
					projectCredits={project?.credits ?? '1'}
					modelType={store.modelType}
					modelVendor={store.modelVendor}
					parameters={store.parameters}
					handleError={handleError}
					handleRefreshProject={handleRefreshProject}
				/>
			),
			[
				store.messages,
				store.templateVariables,
				handleTemplateVariablesChange,
				project,
			],
		),
	};

	useEffect(() => {
		if (initialized) {
			page('createConfigWizard', {
				applicationId,
				projectId,
				stage: store.wizardStage,
			});
		}
	}, [initialized, store.wizardStage]);

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
			track('createConfig', {
				messageLength: store.messages.length,
				name: store.configName,
				parameters: store.parameters,
				type: store.modelType,
				vendor: store.modelVendor,
			});
			store.resetState();
			router.replace(
				setRouteParams(Navigation.PromptConfigDetail, {
					applicationId,
					projectId,
					promptConfigId,
				}),
			);
		} catch {
			handleError(t('errorCreatingConfig'));
			setIsLoading(false);
		}
	};

	return (
		<main
			data-testid="config-create-wizard-page"
			className="flex flex-col min-h-screen w-full bg-base-100"
		>
			{isLoading ? (
				<Oval height="50vh" width="50vw" className="m-auto" />
			) : (
				<>
					<div className="page-content-container">
						<Navbar
							project={project}
							application={application}
							userPhotoURL={user?.photoURL}
						/>
						<div className="card-divider flex justify-between content-center items-center">
							<h2 className="card-header">{t('createConfig')}</h2>
							<ul className="steps z-0">
								{stepper.map((stage) => (
									<li
										key={stage}
										className={`step ${
											store.wizardStage === stage &&
											stepColor
										}
										}`}
									/>
								))}
							</ul>
						</div>
						<div className="transform transition-transform duration-300 ease-in-out rounded-data-card shadow-xl">
							{wizardStageComponentMap[store.wizardStage]}
							<div className="divider divide-accent" />
							<div className="items-center justify-end px-5 modal-action">
								<div className="flex justify-between gap-4">
									{store.wizardStage === 0 && (
										<button
											data-testid="config-create-wizard-cancel-button"
											onClick={() => {
												setIsLoading(true);
												store.resetState();
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
									)}
									{store.wizardStage > 0 && (
										<button
											data-testid="config-create-wizard-back-button"
											onClick={store.setPrevWizardStage}
											className="btn btn-neutral"
											disabled={isLoading}
										>
											{t('backButtonText')}
										</button>
									)}
									{store.wizardStage === 2 && (
										<button
											data-testid="config-create-wizard-save-button"
											onClick={() => {
												void handleConfigSave();
											}}
											className="btn btn-primary"
											disabled={!store.messages.length}
										>
											{t('saveButtonText')}
										</button>
									)}
									{store.wizardStage < 2 && (
										<button
											data-testid="config-create-wizard-continue-button"
											onClick={store.setNextWizardStage}
											className="btn btn-primary"
											disabled={
												!nameIsValid ||
												!shouldAllowContinue(store)
											}
										>
											{t('continueButtonText')}
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</>
			)}
		</main>
	);
}
