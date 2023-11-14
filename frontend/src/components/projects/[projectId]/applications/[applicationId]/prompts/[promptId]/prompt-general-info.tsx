import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreatePromptConfig } from '@/api';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import {
	useAddPromptConfig,
	useApplication,
	usePromptConfig,
} from '@/stores/api-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';
import { OpenAIModelParameters, OpenAIPromptMessage } from '@/types';
import { getCloneName } from '@/utils/helpers';
import { populateLink } from '@/utils/navigation';

export function PromptGeneralInfo({
	projectId,
	applicationId,
	promptConfigId,
}: {
	applicationId: string;
	projectId: string;
	promptConfigId: string;
}) {
	const t = useTranslations('promptConfig');
	const router = useRouter();

	const promptConfig = usePromptConfig<
		OpenAIPromptMessage,
		OpenAIModelParameters
	>(applicationId, promptConfigId);
	const addPromptConfig = useAddPromptConfig();
	const application = useApplication(projectId, applicationId);

	const [cloning, setCloning] = useState(false);
	const showError = useShowError();
	const showInfo = useShowInfo();

	function navigateToPromptTesting() {
		router.push(
			populateLink(
				Navigation.TestingConfig,
				projectId,
				applicationId,
				promptConfigId,
			),
		);
	}

	async function clonePrompt() {
		if (!promptConfig || cloning) {
			return;
		}

		const {
			name,
			modelParameters,
			modelType,
			modelVendor,
			providerPromptMessages,
		} = promptConfig;

		try {
			setCloning(true);
			const newPromptConfig = await handleCreatePromptConfig({
				applicationId,
				data: {
					modelParameters,
					modelType,
					modelVendor,
					name: getCloneName(name),
					promptMessages: providerPromptMessages,
				},
				projectId,
			});
			addPromptConfig(applicationId, newPromptConfig);
			showInfo(t('configCloned'));
			router.push(
				populateLink(
					Navigation.Prompts,
					projectId,
					applicationId,
					newPromptConfig.id,
				),
			);
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setCloning(false);
		}
	}

	if (!promptConfig || !application) {
		return null;
	}

	return (
		<div data-testid="prompt-general-info-container">
			<h2 className="font-semibold text-white text-xl">{t('general')}</h2>
			<div className="custom-card flex flex-col">
				<div className="text-neutral-content grid grid-cols-2 gap-8">
					<div>
						<label className="text-sm">{t('name')}</label>
						<p
							data-testid="prompt-general-info-name"
							className="font-medium text-xl"
						>
							{promptConfig.name}
						</p>
					</div>
					<div>
						<label className="text-sm">
							{t('partOfApplication')}
						</label>
						<p className="font-medium text-xl">
							{application.name}
						</p>
					</div>
					<div>
						<label className="text-sm">{t('noOfVariables')}</label>
						<p data-testid="" className="font-medium text-xl">
							{promptConfig.expectedTemplateVariables.length}
						</p>
					</div>
					<div>
						<label className="text-sm">{t('id')}</label>
						<p className="font-medium text-xl">{promptConfig.id}</p>
					</div>
				</div>
				<div className="mt-8 flex gap-2.5 self-end">
					<button
						data-testid="prompt-clone-btn"
						onClick={() => void clonePrompt()}
						className="btn btn-outline btn-accent"
					>
						{cloning ? (
							<span className="loading loading-spinner loading-xs mx-4" />
						) : (
							t('clone')
						)}
					</button>
					<button
						data-testid="prompt-test-btn"
						disabled={cloning}
						onClick={navigateToPromptTesting}
						className="btn btn-outline btn-primary"
					>
						{t('test')}
					</button>
				</div>
			</div>
		</div>
	);
}
