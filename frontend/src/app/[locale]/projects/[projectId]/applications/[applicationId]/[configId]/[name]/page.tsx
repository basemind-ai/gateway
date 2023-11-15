'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreatePromptConfig, handleUpdatePromptConfig } from '@/api';
import TestConfigView from '@/components/prompt-config/test-config-view';
import { WarningModal } from '@/components/warning-modal';
import { Navigation } from '@/constants';
import { PromptConfigDefault } from '@/constants/forms';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { usePromptConfig } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import {
	ModelVendor,
	OpenAIModelParameters,
	OpenAIPromptMessage,
	PromptConfigCreateBody,
	PromptConfigTest,
} from '@/types';
import { areArraysEqual, decodeUrlSpaces } from '@/utils/helpers';
import { populateLink } from '@/utils/navigation';

const isOpenAIConfig = (
	config: PromptConfigTest<unknown, unknown>,
): config is PromptConfigTest<OpenAIModelParameters, OpenAIPromptMessage> => {
	return config.modelVendor === ModelVendor.OpenAI;
};
export default function ConfigEditScreen({
	params: { projectId, applicationId, configId, name },
}: {
	params: {
		applicationId: string;
		configId: string;
		name: string;
		projectId: string;
	};
}) {
	const t = useTranslations('config');
	const router = useRouter();
	const user = useAuthenticatedUser();
	const [isLoading, setIsLoading] = useState(false);
	const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
	const serverConfig = usePromptConfig(applicationId, configId);
	const isNew: boolean = configId === 'new';
	const ctaCopy: string = isNew ? t('createConfig') : t('saveConfig');
	const cleanName = decodeUrlSpaces(name);

	const showError = useShowError();
	const initialConfig =
		!isNew && serverConfig
			? {
					modelParameters: serverConfig.modelParameters,
					modelType: serverConfig.modelType,
					modelVendor: serverConfig.modelVendor,
					name: serverConfig.name,
					promptConfigId: serverConfig.id,
					promptMessages: serverConfig.providerPromptMessages,
					templateVariables: Object.fromEntries(
						serverConfig.expectedTemplateVariables.map((key) => [
							key,
							'',
						]),
					),
			  }
			: PromptConfigDefault;

	const [config, setConfig] = useState(initialConfig);

	function closeModal() {
		setIsWarningModalVisible(false);
	}

	function onContinueWithChanges() {
		closeModal();
		void updateConfig();
	}

	function getPromptConfigCreateBody(
		configuration: PromptConfigTest<
			OpenAIModelParameters,
			OpenAIPromptMessage
		>,
	): PromptConfigCreateBody {
		return {
			modelParameters: configuration.modelParameters,
			modelType: configuration.modelType,
			modelVendor: configuration.modelVendor,
			name: configuration.name,
			promptMessages: configuration.promptMessages,
		};
	}
	async function createConfig() {
		setIsLoading(true);
		try {
			const { id: configID } = await handleCreatePromptConfig({
				applicationId,
				data: getPromptConfigCreateBody(config),
				projectId,
			});
			router.replace(
				populateLink(
					Navigation.Config,
					projectId,
					applicationId,
					configID,
				),
			);
		} catch {
			showError(t('createConfigError'));
		} finally {
			setIsLoading(false);
		}
	}
	async function updateConfig() {
		setIsLoading(true);
		try {
			await handleUpdatePromptConfig({
				applicationId,
				data: getPromptConfigCreateBody(config),
				projectId,
				promptConfigId: configId,
			});
			router.replace(
				populateLink(
					Navigation.Config,
					projectId,
					applicationId,
					configId,
				),
			);
		} catch {
			showError(t('saveConfigError'));
		} finally {
			setIsLoading(false);
		}
	}

	function handleSave() {
		if (isNew) {
			void createConfig();
		} else if (
			areArraysEqual(
				Object.keys(config.templateVariables),
				serverConfig?.expectedTemplateVariables,
			)
		) {
			void updateConfig();
		} else {
			setIsWarningModalVisible(true);
		}
	}

	return (
		<div
			data-testid="config-edit-screen"
			className="my-6 mx-32 flex flex-col gap-8"
		>
			<div className="flex justify-between">
				<h1
					className="text-2xl font-semibold text-base-content"
					data-testid="config-edit-screen-title"
				>
					{`${t('config')} / ${cleanName}`}
				</h1>
				<button
					className="btn btn-primary self-end"
					data-testid="test-create-button"
					disabled={isLoading || !user}
					onClick={handleSave}
				>
					{isLoading ? (
						<span
							data-testid="loading-spinner"
							className="loading loading-spinner loading-xs mx-1.5"
						/>
					) : (
						ctaCopy
					)}
				</button>
			</div>
			{user && (
				<TestConfigView
					projectId={projectId}
					applicationId={applicationId}
					config={config}
					setConfig={setConfig}
				/>
			)}
			{isWarningModalVisible && (
				<WarningModal
					warningText={t('warningText')}
					closeModal={closeModal}
					onContinue={onContinueWithChanges}
				/>
			)}
		</div>
	);
}
