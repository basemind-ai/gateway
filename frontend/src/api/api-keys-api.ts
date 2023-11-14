import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { APIKey, APIKeyCreateBody } from '@/types';

export async function handleCreateAPIKey({
	applicationId,
	projectId,
	data,
}: {
	applicationId: string;
	data: APIKeyCreateBody;
	projectId: string;
}): Promise<Required<APIKey>> {
	return await fetcher<Required<APIKey>>({
		data,
		method: HttpMethod.Post,
		url: `projects/${projectId}/applications/${applicationId}/apikeys/`,
	});
}

export async function handleRetrieveAPIKeys({
	applicationId,
	projectId,
}: {
	applicationId: string;
	projectId: string;
}): Promise<APIKey[]> {
	return await fetcher<APIKey[]>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/applications/${applicationId}/apikeys/`,
	});
}

export async function handleDeleteAPIKey({
	applicationId,
	projectId,
	apiKeyId,
}: {
	apiKeyId: string;
	applicationId: string;
	projectId: string;
}): Promise<void> {
	await fetcher<undefined>({
		method: HttpMethod.Delete,
		url: `projects/${projectId}/applications/${applicationId}/apikeys/${apiKeyId}/`,
	});
}
