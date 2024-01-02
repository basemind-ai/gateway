'use client';

import { useTranslations } from 'next-intl';
import { memo, useEffect, useState } from 'react';
import { Gear, KeyFill, Speedometer2 } from 'react-bootstrap-icons';

import { Navbar } from '@/components/navbar';
import { ApplicationAnalytics } from '@/components/projects/[projectId]/applications/[applicationId]/application-analytics';
import { ApplicationApiKeys } from '@/components/projects/[projectId]/applications/[applicationId]/application-api-keys';
import { ApplicationDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/application-deletion';
import { ApplicationGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/application-general-settings';
import { ApplicationPromptConfigs } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { ApplicationPageTabNames } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useApplication, useProject } from '@/stores/api-store';

export default function Application({
	params: { projectId, applicationId },
}: {
	params: { applicationId: string; projectId: string };
}) {
	const user = useAuthenticatedUser();
	const { page, initialized } = useAnalytics();
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

	useEffect(() => {
		if (initialized) {
			page('application_overview');
		}
	}, [initialized]);

	if (!application || !project) {
		return null;
	}

	const tabComponents: Record<ApplicationPageTabNames, React.FC> = {
		[ApplicationPageTabNames.OVERVIEW]: memo(() => (
			<>
				<ApplicationAnalytics
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
		<main
			data-testid="application-page"
			className="flex flex-col min-h-screen w-full bg-base-100"
		>
			<div className="page-content-container">
				<Navbar
					project={project}
					application={application}
					userPhotoURL={user?.photoURL}
				/>
				<TabNavigation<ApplicationPageTabNames>
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
