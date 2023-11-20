'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Gear, Speedometer2 } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { PromptConfigAnalyticsPage } from '@/components/projects/[projectId]/applications/[applicationId]/config/[configId]/prompt-config-analytics-page';
import { PromptConfigDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/config/[configId]/prompt-config-deletion';
import { PromptConfigGeneralInfo } from '@/components/projects/[projectId]/applications/[applicationId]/config/[configId]/prompt-config-general-info';
import { PromptConfigGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/config/[configId]/prompt-config-general-settings';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { ApiError } from '@/errors';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { usePromptConfig, useSetPromptConfigs } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';

enum TAB_NAME {
	OVERVIEW,
	SETTINGS,
}

export default function PromptConfiguration({
	params: { projectId, applicationId, promptConfigId },
}: {
	params: {
		applicationId: string;
		projectId: string;
		promptConfigId: string;
	};
}) {
	useAuthenticatedUser();
	useProjectBootstrap(false);

	const t = useTranslations('promptConfig');
	const showError = useShowError();

	const promptConfig = usePromptConfig<any>(applicationId, promptConfigId);
	const setPromptConfigs = useSetPromptConfigs();

	const [selectedTab, setSelectedTab] = useState(TAB_NAME.OVERVIEW);

	const { isLoading } = useSWR(
		promptConfig ? null : { applicationId, projectId },
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

	if (isLoading) {
		return (
			<div
				data-testid="prompt-config-page-loading"
				className="h-full w-full flex items-center justify-center"
			>
				<span className="loading loading-spinner loading-md" />
			</div>
		);
	}

	if (!promptConfig) {
		return null;
	}

	const tabs: TabData<TAB_NAME>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: TAB_NAME.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB_NAME.SETTINGS,
			text: t('settings'),
		},
	];

	const tabComponents: Record<TAB_NAME, React.FC> = {
		[TAB_NAME.OVERVIEW]: () => (
			<>
				<PromptConfigAnalyticsPage
					projectId={projectId}
					applicationId={applicationId}
					promptConfig={promptConfig}
				/>
				<div className="h-8" />
				<PromptConfigGeneralInfo
					projectId={projectId}
					applicationId={applicationId}
					promptConfig={promptConfig}
				/>
			</>
		),
		[TAB_NAME.SETTINGS]: () => (
			<>
				<PromptConfigGeneralSettings
					projectId={projectId}
					applicationId={applicationId}
					promptConfig={promptConfig}
				/>
				<div className="h-4" />
				<PromptConfigDeletion
					projectId={projectId}
					applicationId={applicationId}
					promptConfigId={promptConfigId}
				/>
			</>
		),
	};

	const TabComponent = tabComponents[selectedTab];

	return (
		<div data-testid="prompt-page" className="my-8 mx-32">
			<h1
				data-testid="prompt-page-title"
				className="text-2xl font-semibold text-base-content"
			>
				{t('modelConfiguration')} / {promptConfig.name}
			</h1>
			<div className="mt-3.5 w-full mb-8">
				<TabNavigation<TAB_NAME>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
			</div>
			<TabComponent />
		</div>
	);
}
