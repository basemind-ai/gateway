'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Gear, Speedometer2 } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { PromptAnalyticsPage } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-analytics-page';
import { PromptDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-deletion';
import { PromptGeneralInfo } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-general-info';
import { PromptGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/prompts/[promptId]/prompt-general-settings';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { ApiError } from '@/errors';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { usePromptConfig, useSetPromptConfigs } from '@/stores/project-store';
import { useShowError } from '@/stores/toast-store';
import { OpenAIModelParameters, OpenAIPromptMessage } from '@/types';

enum TAB_NAMES {
	OVERVIEW,
	MODEL,
	PROMPT,
	SETTINGS,
}

export default function PromptConfiguration({
	params: { projectId, applicationId, promptConfigId },
}: {
	params: {
		projectId: string;
		applicationId: string;
		promptConfigId: string;
	};
}) {
	useAuthenticatedUser();
	useProjectBootstrap(false);

	const t = useTranslations('promptConfig');
	const showError = useShowError();

	const promptConfig = usePromptConfig<
		OpenAIModelParameters,
		OpenAIPromptMessage
	>(applicationId, promptConfigId);
	const setPromptConfigs = useSetPromptConfigs();

	const { isLoading } = useSWR(
		promptConfig ? null : { projectId, applicationId },
		handleRetrievePromptConfigs,
		{
			/* c8 ignore start */
			onError({ message }: ApiError) {
				showError(message);
			},
			/* c8 ignore end */
			onSuccess(promptConfigs) {
				setPromptConfigs(applicationId, promptConfigs);
			},
		},
	);

	const tabs: TabData<TAB_NAMES>[] = [
		{
			id: TAB_NAMES.OVERVIEW,
			text: t('overview'),
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.SETTINGS,
			text: t('settings'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
	];
	const [selectedTab, setSelectedTab] = useState(TAB_NAMES.OVERVIEW);

	if (!promptConfig && isLoading) {
		return (
			<div
				data-testid="prompt-config-page-loading"
				className="h-full w-full flex items-center justify-center"
			>
				<span className="loading loading-spinner loading-md" />
			</div>
		);
	} else if (promptConfig) {
		return (
			<div data-testid="prompt-page" className="my-8 mx-32">
				<h1
					data-testid="prompt-page-title"
					className="text-2xl font-semibold text-base-content"
				>
					{t('modelConfiguration')} / {promptConfig.name}
				</h1>
				<div className="mt-3.5 w-full mb-8">
					<TabNavigation<TAB_NAMES>
						tabs={tabs}
						selectedTab={selectedTab}
						onTabChange={setSelectedTab}
						trailingLine={true}
					/>
				</div>
				{selectedTab === TAB_NAMES.OVERVIEW && (
					<>
						<PromptAnalyticsPage
							projectId={projectId}
							applicationId={applicationId}
							promptConfigId={promptConfigId}
						/>
						<div className="h-8" />
						<PromptGeneralInfo
							projectId={projectId}
							applicationId={applicationId}
							promptConfigId={promptConfigId}
						/>
					</>
				)}
				{selectedTab === TAB_NAMES.SETTINGS && (
					<>
						<PromptGeneralSettings
							projectId={projectId}
							applicationId={applicationId}
							promptConfigId={promptConfigId}
						/>
						<div className="h-4" />
						<PromptDeletion
							projectId={projectId}
							applicationId={applicationId}
							promptConfigId={promptConfigId}
						/>
					</>
				)}
			</div>
		);
	} else {
		return null;
	}
}
