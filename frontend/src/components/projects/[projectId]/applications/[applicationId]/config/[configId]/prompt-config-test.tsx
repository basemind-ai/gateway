import equal from 'deep-equal';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleUpdatePromptConfig } from '@/api';
import { TestPromptConfigView } from '@/components/prompt-config/test-prompt-config-view';
import { WarningModal } from '@/components/warning-modal';
import { useShowError } from '@/stores/toast-store';
import { ModelVendor, PromptConfig, PromptConfigTest } from '@/types';

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
	const t = useTranslations('promptConfigTest');

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
		const templateVariablesAreEqual = equal(
			Object.keys(promptTestConfig.templateVariables),
			promptConfig.expectedTemplateVariables,
		);
		if (templateVariablesAreEqual) {
			void updateConfig();
			return;
		}
		setIsWarningModalVisible(true);
	}

	return (
		<div
			data-testid="prompt-testing-container"
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
					data-testid="prompt-config-test-create-button"
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
			<TestPromptConfigView
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
