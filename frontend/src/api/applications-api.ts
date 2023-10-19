import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import {
	Application,
	ApplicationAnalytics,
	ApplicationCreateBody,
	ApplicationUpdateBody,
} from '@/types';

export async function handleCreateApplication({
	projectId,
	data,
}: {
	projectId: string;
	data: ApplicationCreateBody;
}): Promise<Application> {
	return await fetcher<Application>({
		url: `projects/${projectId}/applications/`,
		method: HttpMethod.Post,
		data,
	});
}

export async function handleRetrieveApplications(
	projectId: string,
): Promise<Application[]> {
	return await fetcher<Application[]>({
		url: `projects/${projectId}/applications`,
		method: HttpMethod.Get,
	});
}

export async function handleRetrieveApplication({
	applicationId,
	projectId,
}: {
	applicationId: string;
	projectId: string;
}): Promise<Application> {
	return await fetcher<Application>({
		url: `projects/${projectId}/applications/${applicationId}/`,
		method: HttpMethod.Get,
	});
}

export async function handleUpdateApplication({
	applicationId,
	projectId,
	data,
}: {
	applicationId: string;
	projectId: string;
	data: ApplicationUpdateBody;
}): Promise<Application> {
	return await fetcher<Application>({
		url: `projects/${projectId}/applications/${applicationId}/`,
		method: HttpMethod.Patch,
		data,
	});
}

export async function handleDeleteApplication({
	applicationId,
	projectId,
}: {
	applicationId: string;
	projectId: string;
}): Promise<void> {
	await fetcher<undefined>({
		url: `projects/${projectId}/applications/${applicationId}/`,
		method: HttpMethod.Delete,
	});
}

export async function handleApplicationAnalytics({
	applicationId,
	projectId,
	fromDate,
	toDate,
}: {
	applicationId: string;
	projectId: string;
	fromDate?: string;
	toDate?: string;
}): Promise<ApplicationAnalytics> {
	return await fetcher<ApplicationAnalytics>({
		url: `projects/${projectId}/applications/${applicationId}/analytics`,
		method: HttpMethod.Get,
		queryParams: {
			fromDate,
			toDate,
		},
	});
}
