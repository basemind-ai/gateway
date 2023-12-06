import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { handleRetrieveApplications, handleRetrieveProjects } from '@/api';
import { Navigation } from '@/constants';
import {
	useProjects,
	useSelectedProject,
	useSetProjectApplications,
	useSetProjects,
	useSetSelectedProject,
} from '@/stores/api-store';

export function useProjectBootstrap(redirectToDashboard = true) {
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
		if (selectedProject && redirectToDashboard) {
			router.replace(`${Navigation.Projects}/${selectedProject.id}`);
		}
	}, [selectedProject]);
}
