/* eslint-disable @typescript-eslint/unbound-method */
'use client';

import { router } from 'next/client';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { Record } from 'react-bootstrap-icons';
import { shallow } from 'zustand/shallow';

import { Navbar } from '@/components/navbar';
import { PromptConfigBaseForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/base-form';
import { PromptConfigParametersAndPromptForm } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/parameters-and-prompt-form';
import { PromptConfigTesting } from '@/components/projects/[projectId]/applications/[applicationId]/config-create-wizard/testing-form';
import { Navigation } from '@/constants';
import { useProject, useProjects } from '@/stores/api-store';
import {
	PromptConfigWizardStore,
	usePromptWizardStore,
	WizardStage,
} from '@/stores/prompt-config-wizard-store';
import { useShowError } from '@/stores/toast-store';
import { setPathParams } from '@/utils/navigation';

const WIZARD_STATE_SELECTOR = (s: PromptConfigWizardStore) => ({
	configName: s.configName,
	messages: s.messages,
	modelType: s.modelType,
	modelVendor: s.modelVendor,
	parameters: s.parameters,
	setConfigName: s.setConfigName,
	setMessages: s.setMessages,
	setModelType: s.setModelType,
	setModelVendor: s.setModelVendor,
	setNextWizardStage: s.setNextWizardStage,
	setParameters: s.setParameters,
	setPrevWizardStage: s.setPrevWizardStage,
	setTemplateVariables: s.setTemplateVariables,
	templateVariables: s.templateVariables,
	wizardStage: s.wizardStage,
});

export default function PromptConfigCreateWizard({
	params: { applicationId, projectId },
}: {
	params: { applicationId: string; projectId: string };
}) {
	const t = useTranslations('createPromptConfigDialog');
	const showError = useShowError();

	const project = useProject(projectId);
	const projects = useProjects();

	const store = usePromptWizardStore(WIZARD_STATE_SELECTOR, shallow);

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
				/>
			),
			[
				store.configName,
				handleConfigNameChange,

				store.modelType,
				store.modelVendor,
				handleModelTypeChange,
				handleModelVendorChange,
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
		[WizardStage.TEST_AND_SAVE]: useMemo(
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
				{wizardStageComponentMap[store.wizardStage]}
				<div className="divider divide-accent" />
				<div className="gap-4 items-center justify-between px-5 modal-action">
					<button
						data-testid="create-prompt-config-dialog-cacncel-button"
						onClick={() => {
							void router.push(
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
								data-testid="create-prompt-config-dialog-cacncel-button"
								onClick={store.setPrevWizardStage}
								className="btn btn-secondary"
							>
								{t('backButtonText')}
							</button>
						)}
						{store.wizardStage < 2 && (
							<button
								data-testid="create-prompt-config-dialog-continue-button"
								onClick={store.setNextWizardStage}
								className="btn btn-primary"
								disabled={
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
