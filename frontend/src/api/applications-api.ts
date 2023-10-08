import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import {
	Application,
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
