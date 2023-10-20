import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { Project, ProjectAnalytics, ProjectCreateBody } from '@/types';

export async function handleCreateProject({
	data,
}: {
	data: ProjectCreateBody;
}): Promise<Project> {
	return await fetcher<Project>({
		url: 'projects',
		method: HttpMethod.Post,
		data,
	});
}

export async function handleRetrieveProjects(): Promise<Project[]> {
	return await fetcher<Project[]>({
		url: 'projects',
		method: HttpMethod.Get,
	});
}

export async function handleUpdateProject({
	projectId,
	data,
}: {
	projectId: string;
	data: ProjectCreateBody;
}): Promise<Project> {
	return await fetcher<Project>({
		url: `projects/${projectId}/`,
		method: HttpMethod.Patch,
		data,
	});
}

export async function handleDeleteProject({
	projectId,
}: {
	projectId: string;
}): Promise<void> {
	await fetcher<undefined>({
		url: `projects/${projectId}/`,
		method: HttpMethod.Delete,
	});
}

export async function handleProjectAnalytics({
	projectId,
	fromDate,
	toDate,
}: {
	projectId: string;
	fromDate?: string;
	toDate?: string;
}): Promise<ProjectAnalytics> {
	return await fetcher<ProjectAnalytics>({
		url: `projects/${projectId}/analytics`,
		method: HttpMethod.Get,
		queryParams: {
			fromDate,
			toDate,
		},
	});
}
