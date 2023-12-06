'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { handleRetrieveApplications, handleRetrieveProjects } from '@/api';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import {
	useProjects,
	useSelectedProject,
	useSetProjectApplications,
	useSetProjects,
	useSetSelectedProject,
} from '@/stores/api-store';

export default function Projects() {
	useAuthenticatedUser();

	const router = useRouter();
	const setProjects = useSetProjects();
	const setCurrentProject = useSetSelectedProject();
	const setProjectApplications = useSetProjectApplications();
	const projects = useProjects();
	const selectedProject = useSelectedProject();

	useEffect(() => {
		(async () => {
			if (projects.length) {
				return;
			}

			const retrievedProjects = await handleRetrieveProjects();
			if (retrievedProjects.length === 0) {
				router.replace(Navigation.CreateProject);
				return null;
			}
			setProjects(retrievedProjects);

			const [{ id: projectId }] = retrievedProjects;
			setCurrentProject(projectId);

			const applications = await handleRetrieveApplications(projectId);
			setProjectApplications(projectId, applications);
		})();
	}, []);

	useEffect(() => {
		if (selectedProject) {
			router.replace(`${Navigation.Projects}/${selectedProject.id}`);
		}
	}, [selectedProject]);

	return (
		<div
			className="bg-base-100 flex h-full w-full"
			data-testid="projects-view-loading"
		>
			<div className="flex justify-around w-full">
				<div className="loading loading-spinner loading-lg" />
			</div>
		</div>
	);
}
