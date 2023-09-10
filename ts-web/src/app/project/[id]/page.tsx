'use client';
import { useRouter } from 'next/navigation';

import { useGetProject } from '@/stores/project-store';

export default function Page({ params }: { params: { id: string } }) {
	const getProject = useGetProject();
	const router = useRouter();

	const project = getProject(params.id);
	if (!project) {
		router.replace('/dashboard');
		return;
	}

	return (
		<>
			<div>Project ID: {project.id}</div>
			<div>Project Name: {project.name}</div>
			<div>Project Description: {project.description}</div>
			<div>Project Default: {project.is_user_default_project}</div>
			<div>Project Permission: {project.permission}</div>
			<div>Project Creation: {project.created_at}</div>
		</>
	);
}
