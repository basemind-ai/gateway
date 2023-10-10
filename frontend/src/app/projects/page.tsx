'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { handleRetrieveProjects } from '@/api';
import { CreateProjectView } from '@/components/projects/create-project-view';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjects, useSetProjects } from '@/stores/api-store';
import { Project } from '@/types';

export function ProjectsView({ projects }: { projects: Project[] }) {
	return (
		<div>
			{projects.map((p, i) => (
				<div key={i}>
					<span>{p.name}</span>
				</div>
			))}
		</div>
	);
}

export default function Projects() {
	const router = useRouter();
	const user = useAuthenticatedUser();
	const setProjects = useSetProjects();
	const projects = useProjects();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			router.replace(Navigation.SignIn);
			return;
		}

		setLoading(true);
		(async () => {
			const retrievedProjects = await handleRetrieveProjects();
			setProjects(retrievedProjects);
			setLoading(false);
		})();
	}, []);

	if (loading || !user) {
		// TODO: implement loader
		return <div>loading</div>;
	}

	return projects.length > 0 ? (
		<ProjectsView projects={projects} />
	) : (
		<CreateProjectView cancelHandler={() => null} />
	);
}
