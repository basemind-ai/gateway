'use client';

import { useTranslations } from 'next-intl';
import { memo, useEffect, useState } from 'react';
import { Gear, RocketTakeoff, Speedometer2 } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrievePromptConfigs } from '@/api';
import { Navbar } from '@/components/navbar';
import { PromptConfigCodeSnippet } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-code-snippet';
import { PromptConfigDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-deletion';
import { PromptConfigGeneralInfo } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-general-info';
import { PromptConfigGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-general-settings';
import { PromptConfigTesting } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-testing';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { PromptConfigPageTab } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	useApplication,
	useProject,
	usePromptConfig,
	useSetPromptConfigs,
} from '@/stores/api-store';

export default function PromptConfiguration({
	params: { projectId, applicationId, promptConfigId },
}: {
	params: {
		applicationId: string;
		projectId: string;
		promptConfigId: string;
	};
}) {
	const user = useAuthenticatedUser();
	const { page, initialized } = useAnalytics();
	const t = useTranslations('promptConfig');
	const handleError = useHandleError();

	const promptConfig = usePromptConfig<any>(applicationId, promptConfigId);
	const setPromptConfigs = useSetPromptConfigs();
	const project = useProject(projectId);
	const application = useApplication(projectId, applicationId);

	const [selectedTab, setSelectedTab] = useState(
		PromptConfigPageTab.OVERVIEW,
	);

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

	useEffect(() => {
		if (initialized) {
			page('config_overview');
		}
	}, [initialized]);

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

	const tabs: TabData<PromptConfigPageTab>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: PromptConfigPageTab.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <RocketTakeoff className="w-3.5 h-3.5" />,
			id: PromptConfigPageTab.TESTING,
			text: t('test'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: PromptConfigPageTab.SETTINGS,
			text: t('settings'),
		},
	];

	const tabComponents: Record<PromptConfigPageTab, React.FC> = {
		[PromptConfigPageTab.OVERVIEW]: memo(() => (
			<>
				<PromptConfigCodeSnippet
					projectId={projectId}
					applicationId={applicationId}
				/>
				<div className="card-divider" />
				<PromptConfigGeneralInfo promptConfig={promptConfig} />
			</>
		)),
		[PromptConfigPageTab.TESTING]: memo(() => (
			<PromptConfigTesting
				projectId={projectId}
				applicationId={applicationId}
				promptConfig={promptConfig}
			/>
		)),
		[PromptConfigPageTab.SETTINGS]: memo(() => (
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
		<main
			data-testid="prompt-page-container"
			className="flex flex-col min-h-screen w-full bg-base-100"
		>
			<div className="page-content-container">
				<Navbar
					project={project}
					application={application}
					config={promptConfig}
					userPhotoURL={user?.photoURL}
				/>
				<TabNavigation<PromptConfigPageTab>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
				<div className="card-divider" />

				<TabComponent />
			</div>
		</main>
	);
}
