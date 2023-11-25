'use client';

import { useTranslations } from 'next-intl';
import { memo, useState } from 'react';
import { Gear, KeyFill, Speedometer2 } from 'react-bootstrap-icons';

import { Navbar } from '@/components/navbar';
import { ApplicationAnalyticsPage } from '@/components/projects/[projectId]/applications/[applicationId]/application-analytics-page';
import { ApplicationApiKeys } from '@/components/projects/[projectId]/applications/[applicationId]/application-api-keys';
import { ApplicationDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/application-deletion';
import { ApplicationGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/application-general-settings';
import { ApplicationPromptConfigs } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { useApplication, useProject, useProjects } from '@/stores/api-store';

enum TAB_NAME {
	OVERVIEW,
	API_KEYS,
	SETTINGS,
}

export { TAB_NAME as applicationPageTabNames };

export default function Application({
	params: { projectId, applicationId },
}: {
	params: { applicationId: string; projectId: string };
}) {
	useAuthenticatedUser();
	useProjectBootstrap(false);

	const t = useTranslations('application');
	const application = useApplication(projectId, applicationId);
	const project = useProject(projectId);
	const projects = useProjects();

	const [selectedTab, setSelectedTab] = useState(TAB_NAME.OVERVIEW);

	const tabs: TabData<TAB_NAME>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: TAB_NAME.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <KeyFill className="w-3.5 h-3.5" />,
			id: TAB_NAME.API_KEYS,
			text: t('apiKeys'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB_NAME.SETTINGS,
			text: t('settings'),
		},
	];

	if (!application || !project) {
		return null;
	}

	const tabComponents: Record<TAB_NAME, React.FC> = {
		[TAB_NAME.OVERVIEW]: memo(() => (
			<>
				<ApplicationAnalyticsPage
					applicationId={applicationId}
					projectId={projectId}
				/>
				<ApplicationPromptConfigs
					applicationId={applicationId}
					projectId={projectId}
				/>
			</>
		)),
		[TAB_NAME.API_KEYS]: memo(() => (
			<ApplicationApiKeys
				applicationId={applicationId}
				projectId={projectId}
			/>
		)),
		[TAB_NAME.SETTINGS]: memo(() => (
			<>
				<ApplicationGeneralSettings
					applicationId={applicationId}
					projectId={projectId}
				/>
				<ApplicationDeletion
					applicationId={applicationId}
					projectId={projectId}
				/>
			</>
		)),
	};

	const TabComponent = tabComponents[selectedTab];

	return (
		<div data-testid="application-page" className="my-8 mx-32">
			<Navbar
				project={project}
				headerText={`${t('application')} / ${application.name}`}
				showSelect={projects.length > 1}
			/>
			{application.description && (
				<div className="pl-20">
					<span className="text-sm line-clamp-1 hover:line-clamp-none">
						{application.description}
					</span>
				</div>
			)}
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
