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
import { ApplicationPageTabNames } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { useApplication, useProject } from '@/stores/api-store';

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

	const [selectedTab, setSelectedTab] = useState(
		ApplicationPageTabNames.OVERVIEW,
	);

	const tabs: TabData<ApplicationPageTabNames>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: ApplicationPageTabNames.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <KeyFill className="w-3.5 h-3.5" />,
			id: ApplicationPageTabNames.API_KEYS,
			text: t('apiKeys'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: ApplicationPageTabNames.SETTINGS,
			text: t('settings'),
		},
	];

	if (!application || !project) {
		return null;
	}

	const tabComponents: Record<ApplicationPageTabNames, React.FC> = {
		[ApplicationPageTabNames.OVERVIEW]: memo(() => (
			<>
				<ApplicationAnalyticsPage
					application={application}
					projectId={projectId}
				/>
				<ApplicationPromptConfigs
					application={application}
					projectId={projectId}
				/>
			</>
		)),
		[ApplicationPageTabNames.API_KEYS]: memo(() => (
			<ApplicationApiKeys
				application={application}
				projectId={projectId}
			/>
		)),
		[ApplicationPageTabNames.SETTINGS]: memo(() => (
			<>
				<ApplicationGeneralSettings
					application={application}
					projectId={projectId}
				/>
				<ApplicationDeletion
					application={application}
					projectId={projectId}
				/>
			</>
		)),
	};

	const TabComponent = tabComponents[selectedTab];

	return (
		<div
			data-testid="application-page"
			className="flex flex-col min-h-screen w-full bg-base-100"
		>
			<Navbar project={project} application={application} />
			<div className="w-full">
				<TabNavigation<ApplicationPageTabNames>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
			</div>
			<div className="mx-32 mt-6">
				<TabComponent />
			</div>
		</div>
	);
}
