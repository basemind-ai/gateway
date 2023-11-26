'use client';

import { useTranslations } from 'next-intl';
import { memo, useState } from 'react';
import { Gear, RocketTakeoff, Speedometer2 } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { Navbar } from '@/components/navbar';
import { PromptConfigAnalyticsPage } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-analytics-page';
import { PromptConfigDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-deletion';
import { PromptConfigGeneralInfo } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-general-info';
import { PromptConfigGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-general-settings';
import { PromptConfigTesting } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-testing';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useHandleError } from '@/hooks/use-handle-error';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import {
	useProject,
	useProjects,
	usePromptConfig,
	useSetPromptConfigs,
} from '@/stores/api-store';

enum TAB_NAME {
	OVERVIEW,
	TESTING,
	SETTINGS,
}

export { TAB_NAME as PromptConfigPageTab };

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
	const handleError = useHandleError();

	const promptConfig = usePromptConfig<any>(applicationId, promptConfigId);
	const setPromptConfigs = useSetPromptConfigs();
	const project = useProject(projectId);
	const projects = useProjects();

	const [selectedTab, setSelectedTab] = useState(TAB_NAME.OVERVIEW);

	const { isLoading } = useSWR(
		promptConfig ? null : { applicationId, projectId },
		handleRetrievePromptConfigs,
		{
			onError: handleError,
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

	if (!promptConfig || !project) {
		return null;
	}

	const tabs: TabData<TAB_NAME>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: TAB_NAME.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <RocketTakeoff className="w-3.5 h-3.5" />,
			id: TAB_NAME.TESTING,
			text: t('test'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB_NAME.SETTINGS,
			text: t('settings'),
		},
	];

	const tabComponents: Record<TAB_NAME, React.FC> = {
		[TAB_NAME.OVERVIEW]: memo(() => (
			<>
				<PromptConfigAnalyticsPage
					projectId={projectId}
					applicationId={applicationId}
					promptConfig={promptConfig}
				/>
				<div className="h-8" />
				<PromptConfigGeneralInfo promptConfig={promptConfig} />
			</>
		)),
		[TAB_NAME.TESTING]: memo(() => (
			<PromptConfigTesting
				projectId={projectId}
				applicationId={applicationId}
				promptConfig={promptConfig}
			/>
		)),
		[TAB_NAME.SETTINGS]: memo(() => (
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
					promptConfig={promptConfig}
				/>
			</>
		)),
	};

	const TabComponent = tabComponents[selectedTab];

	return (
		<div data-testid="prompt-page-container" className="my-8 mx-32">
			<Navbar
				project={project}
				headerText={`${t('modelConfiguration')} / ${promptConfig.name}`}
				showSelect={projects.length > 1}
			/>
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
