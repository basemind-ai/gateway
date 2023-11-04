import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { handleRetrieveApplications, handleRetrieveProjects } from '@/api';
import { Navigation } from '@/constants';
import {
	useProjects,
	useSetCurrentProject,
	useSetProjectApplications,
	useSetProjects,
} from '@/stores/project-store';

export function useProjectBootstrap(redirectToDashboard = true) {
	const router = useRouter();
	const setProjects = useSetProjects();
	const setCurrentProject = useSetCurrentProject();
	const setProjectApplications = useSetProjectApplications();
	const projects = useProjects();

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
			const [{ id: projectId }] = retrievedProjects;
			setProjects(retrievedProjects);
			setCurrentProject(projectId);

			if (redirectToDashboard) {
				router.replace(`${Navigation.Projects}/${projectId}`);
			}

			const projectApplications =
				await handleRetrieveApplications(projectId);
			setProjectApplications(projectId, projectApplications);
		})();
	}, []);
}
