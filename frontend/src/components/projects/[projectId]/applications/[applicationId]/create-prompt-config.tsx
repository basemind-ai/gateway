import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreatePromptConfig } from '@/api';
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
}
