import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreatePromptConfig } from '@/api';
import { TestPromptConfigView } from '@/components/prompt-config/test-prompt-config-view';
import { Navigation } from '@/constants';
import {
	DefaultCoherePromptConfigTest,
	DefaultOpenAIPromptConfigTest,
} from '@/constants/forms';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useShowError } from '@/stores/toast-store';
import { ModelVendor, PromptConfigTest } from '@/types';
import { setPathParams } from '@/utils/navigation';

export function CreatePromptConfigView<T extends ModelVendor>({
	projectId,
	applicationId,
	modelVendor,
}: {
	applicationId: string;
	modelVendor: T;
	projectId: string;
}) {
	void useAuthenticatedUser();
	const t = useTranslations('createPromptConfig');

	const router = useRouter();
	const showError = useShowError();

	const [isLoading, setIsLoading] = useState(false);
	const [promptTestConfig, setPromptTestConfig] = useState<
		PromptConfigTest<T>
	>(
		(modelVendor === ModelVendor.OpenAI
			? DefaultOpenAIPromptConfigTest
			: DefaultCoherePromptConfigTest) as PromptConfigTest<T>,
	);
	async function createConfig() {
		setIsLoading(true);
		try {
			const { id: configId } = await handleCreatePromptConfig({
				applicationId,
				data: {
					modelParameters: promptTestConfig.modelParameters,
					modelType: promptTestConfig.modelType,
					modelVendor: promptTestConfig.modelVendor,
					name: promptTestConfig.name,
					promptMessages: promptTestConfig.promptMessages,
				},
				projectId,
			});

			const url = setPathParams(Navigation.Config, {
				applicationId,
				configId,
				projectId,
			});

			router.replace(url);
		} catch {
			showError(t('createConfigError'));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div
			data-testid="create-prompt-config-screen"
			className="my-6 mx-32 flex flex-col gap-8"
		>
			<div className="flex justify-between">
				<h1
					className="text-2xl font-semibold text-base-content"
					data-testid="create-prompt-config-title"
				>
					{`${t('config')} / ${promptTestConfig.name}`}
				</h1>
				<button
					className="btn btn-primary self-end"
					data-testid="create-prompt-config-button"
					disabled={isLoading}
					onClick={() => {
						void createConfig();
					}}
				>
					{isLoading ? (
						<span
							data-testid="loading-spinner"
							className="loading loading-spinner loading-xs mx-1.5"
						/>
					) : (
						t('createConfig')
					)}
				</button>
			</div>
			<TestPromptConfigView
				projectId={projectId}
				applicationId={applicationId}
				promptTestConfig={promptTestConfig}
				setPromptTestConfig={setPromptTestConfig}
			/>
		</div>
	);
}
