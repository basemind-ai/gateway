'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useState } from 'react';
import { Gear, Key, People, Speedometer2 } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrieveApplications } from '@/api';
import { Navbar } from '@/components/navbar';
import { ProjectAnalytics } from '@/components/projects/[projectId]/project-analytics';
import { ProjectApplicationsList } from '@/components/projects/[projectId]/project-applications-list';
import { ProjectDeletion } from '@/components/projects/[projectId]/project-deletion';
import { ProjectGeneralSettings } from '@/components/projects/[projectId]/project-general-settings';
import { ProjectMembers } from '@/components/projects/[projectId]/project-members';
import { ProjectMembersInvitationForm } from '@/components/projects/[projectId]/project-members-invitation-form';
import { ProjectProviderKeys } from '@/components/projects/[projectId]/project-provider-keys';
import { MobileNotSupported } from '@/components/projects/mobile-not-supported';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { Navigation, ProjectPageTabNames } from '@/constants';
import { PageNames } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	useProject,
	useProjectUsers,
	useSetProjectApplications,
} from '@/stores/api-store';
import { AccessPermission, Project, ProjectUserAccount } from '@/types';

const TabComponent = memo(
	({
		project,
		selectedTab,
		currentUser,
	}: {
		currentUser?: ProjectUserAccount;
		project: Project;
		selectedTab: ProjectPageTabNames;
	}) =>
		selectedTab === ProjectPageTabNames.OVERVIEW ? (
			<div data-testid="project-overview-tab">
				<ProjectAnalytics project={project} />
				<div className="card-divider">
					<ProjectApplicationsList project={project} />
				</div>
			</div>
		) : selectedTab === ProjectPageTabNames.MEMBERS ? (
			<div data-testid="project-members-tab">
				{currentUser?.permission === AccessPermission.ADMIN && (
					<ProjectMembersInvitationForm project={project} />
				)}
				<div className="card-divider">
					<ProjectMembers project={project} />
				</div>
			</div>
		) : selectedTab === ProjectPageTabNames.PROVIDER_KEYS ? (
			<div data-testid="project-provider-keys-tab">
				<ProjectProviderKeys project={project} />
			</div>
		) : (
			<div data-testid="project-settings-tab">
				<ProjectGeneralSettings project={project} />
				<div className="card-divider">
					<ProjectDeletion project={project} />
				</div>
			</div>
		),
);

export default function ProjectOverview({
	params: { projectId },
}: {
	params: { projectId: string };
}) {
	const t = useTranslations('projectOverview');

	const router = useRouter();
	const handleError = useHandleError();
	const setProjectApplications = useSetProjectApplications();
	const user = useAuthenticatedUser();
	const { page, initialized, identify } = useAnalytics();

	const projectUsers = useProjectUsers(projectId);

	const currentUser = (projectUsers ?? []).find(
		(projectUser) => projectUser.email === user?.email,
	)!;

	const [selectedTab, setSelectedTab] = useState(
		ProjectPageTabNames.OVERVIEW,
	);

	const project = useProject(projectId);

	useSWR(projectId, handleRetrieveApplications, {
		onError: handleError,
		onSuccess: (applications) => {
			setProjectApplications(projectId, applications);
		},
	});

	useEffect(() => {
		if (initialized) {
			page(PageNames.ProjectOverview, {
				accountId: projectId,
				projectId,
			});
			if (user) {
				identify(user.uid, {
					avatar: user.photoURL,
					email: user.email,
					id: user.uid,
					name: user.displayName,
				});
			}
		}
	}, [projectId, initialized, page, user, identify]);

	const tabs: TabData<ProjectPageTabNames>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: ProjectPageTabNames.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <People className="w-3.5 h-3.5" />,
			id: ProjectPageTabNames.MEMBERS,
			text: t('members'),
		},
		{
			icon: <Key className="w-3.5 h-3.5" />,
			id: ProjectPageTabNames.PROVIDER_KEYS,
			text: t('providerKeys'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: ProjectPageTabNames.SETTINGS,
			text: t('settings'),
		},
	];

	if (!project) {
		router.replace(Navigation.Projects);
		return null;
	}

	return (
		<main
			className="flex flex-col min-h-screen w-full bg-base-100"
			data-testid="project-page"
		>
			<div className="sm:hidden my-auto">
				<MobileNotSupported />
			</div>
			<div className="page-content-container hidden sm:block">
				<Navbar project={project} userPhotoURL={user?.photoURL} />
				<TabNavigation<ProjectPageTabNames>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
				<div className="card-divider" />
				<TabComponent
					project={project}
					selectedTab={selectedTab}
					currentUser={currentUser}
				/>
			</div>
		</main>
	);
}
