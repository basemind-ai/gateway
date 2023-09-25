'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { handleRetrieveUserProjects } from '@/api/projects-api';
import { LogoutButton } from '@/components/logout-button';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useSetProjects } from '@/stores/api-store';

export default function ProjectView() {
	const user = useAuthenticatedUser();
	const setProjects = useSetProjects();
	const router = useRouter();

	async function fetchLoginData() {
		const projects = await handleRetrieveUserProjects();
		if (projects.length === 0) {
			return;
		}
		setProjects(projects);
		const [project] = projects;
		router.push(Navigation.Dashboard.replace(':projectId', project.id));
	}

	useEffect(() => {
		if (!user) {
			router.replace(Navigation.SignIn);
			return;
		}

		void fetchLoginData();
	}, []);

	if (!user) {
		return;
	}

	return (
		<div className="m-10 h-full">
			<span
				className="animate-spin inline-block w-6 h-6 border-[4px] border-current border-t-transparent text-primary rounded-full"
				role="status"
				aria-label="loading"
			></span>
			<LogoutButton />
		</div>
	);
}
