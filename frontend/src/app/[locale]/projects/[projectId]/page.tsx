'use client';

import { useTranslations } from 'next-intl';
import { memo, useState } from 'react';
import { Gear, Speedometer2 } from 'react-bootstrap-icons';

import { Navbar } from '@/components/navbar';
import { InviteProjectMembers } from '@/components/projects/[projectId]/invite-project-members';
import { ProjectAnalytics } from '@/components/projects/[projectId]/project-analytics';
import { ProjectApplicationsList } from '@/components/projects/[projectId]/project-applications-list';
import { ProjectDeletion } from '@/components/projects/[projectId]/project-deletion';
import { ProjectGeneralSettings } from '@/components/projects/[projectId]/project-general-settings';
import { ProjectMembers } from '@/components/projects/[projectId]/project-members';
import { ProjectProviderKeys } from '@/components/projects/[projectId]/project-provider-keys';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { useProject, useProjects } from '@/stores/api-store';

enum TAB_NAME {
	OVERVIEW,
	MEMBERS,
	PROVIDER_KEYS,
	SETTINGS,
}

export default function ProjectOverview({
	params: { projectId },
}: {
	params: { projectId: string };
}) {
	useAuthenticatedUser();
	useProjectBootstrap();

	const t = useTranslations('projectOverview');

	const [selectedTab, setSelectedTab] = useState(TAB_NAME.OVERVIEW);

	const project = useProject(projectId);
	const projects = useProjects();

	const tabs: TabData<TAB_NAME>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: TAB_NAME.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB_NAME.MEMBERS,
			text: t('members'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB_NAME.PROVIDER_KEYS,
			text: t('providerKeys'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB_NAME.SETTINGS,
			text: t('settings'),
		},
	];

	if (!project) {
		return null;
	}

	const tabComponents: Record<TAB_NAME, React.FC> = {
		[TAB_NAME.OVERVIEW]: memo(() => (
			<div data-testid="project-overview-tab">
				<ProjectAnalytics projectId={projectId} />
				<ProjectApplicationsList projectId={projectId} />
			</div>
		)),
		[TAB_NAME.MEMBERS]: memo(() => (
			<div data-testid="project-members-tab">
				<InviteProjectMembers projectId={projectId} />
				<div className="mt-10">
					<ProjectMembers projectId={projectId} />
				</div>
			</div>
		)),
		[TAB_NAME.PROVIDER_KEYS]: memo(() => (
			<div data-testid="project-provider-keys-tab">
				<ProjectProviderKeys projectId={projectId} />
			</div>
		)),
		[TAB_NAME.SETTINGS]: memo(() => (
			<div data-testid="project-settings-tab">
				<ProjectGeneralSettings projectId={projectId} />
				<div className="mt-10">
					<ProjectDeletion projectId={projectId} />
				</div>
			</div>
		)),
	};

	const TabComponent = tabComponents[selectedTab];

	return (
		<div data-testid="project-page" className="my-8 mx-32">
			<Navbar
				project={project}
				headerText={`${t('project')} / ${project.name}`}
				showSelect={projects.length > 1}
			/>
			<div className="mt-3.5 w-full mb-9">
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
