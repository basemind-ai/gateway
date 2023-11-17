import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleUpdatePromptConfig } from '@/api';
import { TestConfigView } from '@/components/prompt-config/test-config-view';
import { WarningModal } from '@/components/warning-modal';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useShowError } from '@/stores/toast-store';
import { ModelVendor, PromptConfig, PromptConfigTest } from '@/types';
import { areArraysEqual } from '@/utils/helpers';

export function PromptConfigTest<T extends ModelVendor>({
	projectId,
	applicationId,
	promptConfig,
	navigateToOverview,
}: {
	applicationId: string;
	navigateToOverview: () => void;
	projectId: string;
	promptConfig: PromptConfig<T>;
}) {
	void useAuthenticatedUser();
	const t = useTranslations('config');

	const showError = useShowError();

	const [isLoading, setIsLoading] = useState(false);
	const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);

	const [promptTestConfig, setPromptTestConfig] = useState<
		PromptConfigTest<T>
	>({
		modelParameters: promptConfig.modelParameters,
		modelType: promptConfig.modelType,
		modelVendor: promptConfig.modelVendor,
		name: promptConfig.name,
		promptConfigId: promptConfig.id,
		promptMessages: promptConfig.providerPromptMessages,
		templateVariables: Object.fromEntries(
			promptConfig.expectedTemplateVariables.map((key: string) => [
				key,
				'',
			]),
		),
	});

	async function updateConfig() {
		setIsLoading(true);
		try {
			await handleUpdatePromptConfig({
				applicationId,
				data: {
					modelParameters: promptTestConfig.modelParameters,
					modelType: promptTestConfig.modelType,
					modelVendor: promptTestConfig.modelVendor,
					name: promptTestConfig.name,
					promptMessages: promptTestConfig.promptMessages,
				},
				projectId,
				promptConfigId: promptConfig.id,
			});
			navigateToOverview();
		} catch {
			showError(t('saveConfigError'));
		} finally {
			setIsLoading(false);
		}
	}

	function handleSave() {
		if (
			areArraysEqual(
				Object.keys(promptTestConfig.templateVariables),
				promptConfig.expectedTemplateVariables,
			)
		) {
			void updateConfig();
			return;
		}
		setIsWarningModalVisible(true);
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
					{`${t('config')} / ${promptConfig.name}`}
				</h1>
				<button
					className="btn btn-primary self-end"
					data-testid="test-create-button"
					disabled={isLoading}
					onClick={handleSave}
				>
					{isLoading ? (
						<span
							data-testid="loading-spinner"
							className="loading loading-spinner loading-xs mx-1.5"
						/>
					) : (
						t('saveConfig')
					)}
				</button>
			</div>
			<TestConfigView
				projectId={projectId}
				applicationId={applicationId}
				promptTestConfig={promptTestConfig}
				setPromptTestConfig={setPromptTestConfig}
			/>
			{isWarningModalVisible && (
				<WarningModal
					warningText={t('warningText')}
					closeModal={() => {
						setIsWarningModalVisible(false);
					}}
					onContinue={() => {
						setIsWarningModalVisible(false);
						void updateConfig();
					}}
				/>
			)}
		</div>
	);
}
