'use client';

import { useRouter } from 'next/navigation';

import { Navigation } from '@/constants';
import { useProject } from '@/stores/api-store';

export default function Dashboard({
	params: { projectId },
}: {
	params: { projectId: string };
}) {
	const router = useRouter();
	const project = useProject(projectId);

	if (!project) {
		router.replace(Navigation.Projects);
		return;
	}

	return (
		<div data-testid="dashboard">
			<div>Project ID: {project.id}</div>
			<div>Project Name: {project.name}</div>
			<div>Project Description: {project.description}</div>
			<div>Project Default: {project.isUserDefaultProject}</div>
			<div>Project Permission: {project.permission}</div>
			<div>Project Creation: {project.createdAt}</div>
		</div>
	);
}
