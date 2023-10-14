'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { handleRetrieveProjects } from '@/api';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useSetProjects } from '@/stores/api-store';

export default function Projects() {
	const router = useRouter();
	const setProjects = useSetProjects();
	useAuthenticatedUser();

	useEffect(() => {
		(async () => {
			const retrievedProjects = await handleRetrieveProjects();
			if (retrievedProjects.length === 0) {
				router.replace(Navigation.CreateProject);
				return;
			}
			setProjects(retrievedProjects);
			router.replace(
				`${Navigation.Projects}/${retrievedProjects[0]?.id}`,
			);
		})();
	}, []);

	return (
		<div
			className="bg-base-100 flex h-full w-full animate-pulse"
			data-testid="projects-view-loading"
		/>
	);
}
