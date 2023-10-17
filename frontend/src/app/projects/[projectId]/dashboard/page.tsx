'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Navigation } from '@/constants';
import { useProject } from '@/stores/api-store';

export default function Dashboard({
	params: { projectId },
}: {
	params: { projectId: string };
}) {
	const router = useRouter();
	const project = useProject(projectId);

	useEffect(() => {
		if (!project) {
			router.replace(Navigation.Projects);
		}
	}, []);

	if (!project) {
		return;
	}

	return (
		<div data-testid="dashboard">
			<div>Project ID: {project.id}</div>
			<div>Project Name: {project.name}</div>
			<div>Project Description: {project.description}</div>
			<div>Project Permission: {project.permission}</div>
			<div>Project Creation: {project.createdAt}</div>
		</div>
	);
}
