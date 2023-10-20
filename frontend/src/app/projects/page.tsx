'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { handleRetrieveApplications, handleRetrieveProjects } from '@/api';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import {
	useSetCurrentProject,
	useSetProjectApplications,
	useSetProjects,
} from '@/stores/project-store';

export default function Projects() {
	const router = useRouter();
	const setProjects = useSetProjects();
	const setCurrentProject = useSetCurrentProject();
	const setProjectApplications = useSetProjectApplications();
	useAuthenticatedUser();

	useEffect(() => {
		(async () => {
			const retrievedProjects = await handleRetrieveProjects();
			if (retrievedProjects.length === 0) {
				router.replace(Navigation.CreateProject);
				return null;
			}
			const [{ id: projectId }] = retrievedProjects;
			setProjects(retrievedProjects);
			setCurrentProject(projectId);
			router.replace(`${Navigation.Projects}/${projectId}/dashboard`);

			const projectApplications =
				await handleRetrieveApplications(projectId);
			setProjectApplications(projectId, projectApplications);
		})();
	}, []);

	return (
		<div
			className="bg-base-100 flex h-full w-full animate-pulse"
			data-testid="projects-view-loading"
		/>
	);
}
