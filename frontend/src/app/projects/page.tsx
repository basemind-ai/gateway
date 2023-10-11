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
	const projects = useProjects();
	const router = useRouter();
	const setProjects = useSetProjects();
	const user = useAuthenticatedUser();

	const [error, setError] = useState<Error | null>(null);
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
		// TODO: implement loading view
		return <div>loading</div>;
	}

	if (error) {
		// TODO: implement error view
		return <div>{error.message}</div>;
	}

	const handleCreateProjectCancel = () => {
		// TODO: implement cancel handler
		return null;
	};

	return projects.length === 0 ? (
		<CreateProjectView
			cancelHandler={handleCreateProjectCancel}
			setError={setError}
			setLoading={setLoading}
		/>
	) : (
		<ProjectsView projects={projects} />
	);
}
