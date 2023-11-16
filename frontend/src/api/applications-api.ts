import { type DateType } from 'react-tailwindcss-datepicker';

import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import {
	Analytics,
	Application,
	ApplicationCreateBody,
	ApplicationUpdateBody,
} from '@/types';

export async function handleCreateApplication({
	projectId,
	data,
}: {
	data: ApplicationCreateBody;
	projectId: string;
}): Promise<Application> {
	return await fetcher<Application>({
		data,
		method: HttpMethod.Post,
		url: `projects/${projectId}/applications/`,
	});
}

export async function handleRetrieveApplications(
	projectId: string,
): Promise<Application[]> {
	return await fetcher<Application[]>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/applications`,
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
		method: HttpMethod.Get,
		url: `projects/${projectId}/applications/${applicationId}/`,
	});
}

export async function handleUpdateApplication({
	applicationId,
	projectId,
	data,
}: {
	applicationId: string;
	data: ApplicationUpdateBody;
	projectId: string;
}): Promise<Application> {
	return await fetcher<Application>({
		data,
		method: HttpMethod.Patch,
		url: `projects/${projectId}/applications/${applicationId}/`,
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
		method: HttpMethod.Delete,
		url: `projects/${projectId}/applications/${applicationId}/`,
	});
}

export async function handleApplicationAnalytics({
	applicationId,
	projectId,
	fromDate,
	toDate,
}: {
	applicationId: string;
	fromDate?: DateType;
	projectId: string;
	toDate?: DateType;
}): Promise<Analytics> {
	return await fetcher<Analytics>({
		method: HttpMethod.Get,
		queryParams: {
			fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
			toDate: toDate ? new Date(toDate).toISOString() : undefined,
		},
		url: `projects/${projectId}/applications/${applicationId}/analytics`,
	});
}
