'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Gear, Speedometer2 } from 'react-bootstrap-icons';

import { Navbar } from '@/components/navbar';
import { ApplicationsList } from '@/components/projects/[projectId]/applications-list';
import { InviteMember } from '@/components/projects/[projectId]/invite-member';
import { ProjectAnalytics } from '@/components/projects/[projectId]/project-analytics';
import { ProjectDeletion } from '@/components/projects/[projectId]/project-deletion';
import { ProjectGeneralSettings } from '@/components/projects/[projectId]/project-general-settings';
import { ProjectMembers } from '@/components/projects/[projectId]/project-members';
import { ProjectProviderKeys } from '@/components/projects/[projectId]/project-provider-keys';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { useProject, useProjects } from '@/stores/api-store';

enum TAB {
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

	const [selectedTab, setSelectedTab] = useState(TAB.OVERVIEW);

	const project = useProject(projectId);
	const projects = useProjects();

	const tabs: TabData<TAB>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: TAB.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB.MEMBERS,
			text: t('members'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB.PROVIDER_KEYS,
			text: t('providerKeys'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB.SETTINGS,
			text: t('settings'),
		},
	];

	if (!project) {
		return null;
	}

	const tabComponents: Record<TAB, React.FC> = {
		[TAB.OVERVIEW]: () => (
			<div data-testid="project-overview-tab">
				<ProjectAnalytics projectId={projectId} />
				<ApplicationsList projectId={projectId} />
			</div>
		),
		[TAB.MEMBERS]: () => (
			<div data-testid="project-members-tab">
				<InviteMember projectId={projectId} />
				<div className="mt-10">
					<ProjectMembers projectId={projectId} />
				</div>
			</div>
		),
		[TAB.PROVIDER_KEYS]: () => (
			<div data-testid="project-provider-keys-tab">
				<ProjectProviderKeys projectId={projectId} />
			</div>
		),
		[TAB.SETTINGS]: () => (
			<div data-testid="project-settings-tab">
				<ProjectGeneralSettings projectId={projectId} />
				<div className="mt-10">
					<ProjectDeletion projectId={projectId} />
				</div>
			</div>
		),
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
				<TabNavigation<TAB>
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
