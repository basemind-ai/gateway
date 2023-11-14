import { DateType } from 'react-tailwindcss-datepicker';

import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { AnalyticsDTO, Project, ProjectCreateBody } from '@/types';

export async function handleCreateProject({
	data,
}: {
	data: ProjectCreateBody;
}): Promise<Project> {
	return await fetcher<Project>({
		data,
		method: HttpMethod.Post,
		url: 'projects',
	});
}

export async function handleRetrieveProjects(): Promise<Project[]> {
	return await fetcher<Project[]>({
		method: HttpMethod.Get,
		url: 'projects',
	});
}

export async function handleUpdateProject({
	projectId,
	data,
}: {
	data: ProjectCreateBody;
	projectId: string;
}): Promise<Project> {
	return await fetcher<Project>({
		data,
		method: HttpMethod.Patch,
		url: `projects/${projectId}/`,
	});
}

export async function handleDeleteProject({
	projectId,
}: {
	projectId: string;
}): Promise<void> {
	await fetcher<undefined>({
		method: HttpMethod.Delete,
		url: `projects/${projectId}/`,
	});
}

export async function handleProjectAnalytics({
	projectId,
	fromDate,
	toDate,
}: {
	fromDate?: DateType;
	projectId: string;
	toDate?: DateType;
}): Promise<AnalyticsDTO> {
	return await fetcher<AnalyticsDTO>({
		method: HttpMethod.Get,
		queryParams: {
			fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
			toDate: toDate ? new Date(toDate).toISOString() : undefined,
		},
		url: `projects/${projectId}/analytics`,
	});
}
