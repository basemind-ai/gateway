'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';

import { handleRetrieveProjects } from '@/api';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	useSelectedProject,
	useSetProjects,
	useSetSelectedProject,
} from '@/stores/api-store';

export default function Projects() {
	const user = useAuthenticatedUser();

	const router = useRouter();
	const setProjects = useSetProjects();
	const setSelectedProject = useSetSelectedProject();
	const selectedProject = useSelectedProject();
	const handleError = useHandleError();

	useSWR({ userId: user?.uid }, handleRetrieveProjects, {
		onError: handleError,
		onSuccess: (retrievedProjects) => {
			if (retrievedProjects.length === 0) {
				router.replace(Navigation.CreateProject);
				return;
			}
			setProjects(retrievedProjects);

			const [{ id: projectId }] = retrievedProjects;

			if (!selectedProject) {
				setSelectedProject(projectId);
			}
		},
	});

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
