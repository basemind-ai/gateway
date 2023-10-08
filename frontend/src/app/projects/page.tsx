'use client';

import { UserInfo } from '@firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { handleRetrieveProjects } from '@/api';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjects, useSetProjects } from '@/stores/api-store';
import { Project } from '@/types';

export function ProjectsView({
	user,
	projects,
}: {
	user: UserInfo;
	projects: Project[];
}) {
	return null;
}

export function CreateProjectView({ user }: { user: UserInfo }) {
	return null;
}

export default function Projects() {
	const router = useRouter();
	const user = useAuthenticatedUser();
	const setProjects = useSetProjects();
	const projects = useProjects();

	useEffect(() => {
		if (!user) {
			router.replace(Navigation.SignIn);
			return;
		}
		(async () => {
			const retrievedProjects = await handleRetrieveProjects();
			setProjects(retrievedProjects);
		})();
	}, []);

	if (!user) {
		return null;
	}

	return projects.length > 0 ? (
		<ProjectsView user={user} projects={projects} />
	) : (
		<CreateProjectView user={user} />
	);
}
