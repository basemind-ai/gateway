import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { APIKey, APIKeyCreateBody } from '@/types';

export async function handleCreateAPIKey({
	applicationId,
	projectId,
	data,
}: {
	applicationId: string;
	projectId: string;
	data: APIKeyCreateBody;
}): Promise<Required<APIKey>> {
	return await fetcher<Required<APIKey>>({
		url: `projects/${projectId}/applications/${applicationId}/apikeys/`,
		method: HttpMethod.Post,
		data,
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
		url: `projects/${projectId}/applications/${applicationId}/apikeys/`,
		method: HttpMethod.Get,
	});
}

export async function handleDeleteAPIKey({
	applicationId,
	projectId,
	apiKeyId,
}: {
	applicationId: string;
	projectId: string;
	apiKeyId: string;
}): Promise<void> {
	await fetcher<undefined>({
		url: `projects/${projectId}/applications/${applicationId}/apikeys/${apiKeyId}/`,
		method: HttpMethod.Delete,
	});
}
