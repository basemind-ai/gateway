'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Gear, Speedometer2 } from 'react-bootstrap-icons';

import { NavBar } from '@/components/nav-bar';
import { ApplicationsList } from '@/components/projects/[projectId]/applications-list';
import { InviteMember } from '@/components/projects/[projectId]/invite-member';
import { ProjectAnalytics } from '@/components/projects/[projectId]/project-analytics';
import { ProjectDeletion } from '@/components/projects/[projectId]/project-deletion';
import { ProjectGeneralSettings } from '@/components/projects/[projectId]/project-general-settings';
import { ProjectMembers } from '@/components/projects/[projectId]/project-members';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { useProject } from '@/stores/project-store';

enum TAB_NAMES {
	OVERVIEW,
	MEMBERS,
	BILLING,
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
	const project = useProject(projectId);

	const tabs: TabData<TAB_NAMES>[] = [
		{
			id: TAB_NAMES.OVERVIEW,
			text: t('overview'),
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.MEMBERS,
			text: t('members'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.BILLING,
			text: t('billing'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.SETTINGS,
			text: t('settings'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
	];
	const [selectedTab, setSelectedTab] = useState(TAB_NAMES.OVERVIEW);

	if (!project) {
		return null;
	}

	return (
		<div data-testid="project-page" className="my-8 mx-32">
			<NavBar
				project={project}
				headerText={`${t('project')} / ${project.name}`}
			/>

			<div className="mt-3.5 w-full mb-9">
				<TabNavigation<TAB_NAMES>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
			</div>
			{selectedTab === TAB_NAMES.OVERVIEW && (
				<>
					<ProjectAnalytics projectId={projectId} />
					<ApplicationsList projectId={projectId} />
				</>
			)}
			{selectedTab === TAB_NAMES.MEMBERS && (
				<>
					<InviteMember projectId={projectId} />
					<div className="mt-10">
						<ProjectMembers projectId={projectId} />
					</div>
				</>
			)}
			{selectedTab === TAB_NAMES.SETTINGS && (
				<>
					<ProjectGeneralSettings projectId={projectId} />
					<div className="mt-10">
						<ProjectDeletion projectId={projectId} />
					</div>
				</>
			)}
		</div>
	);
}
