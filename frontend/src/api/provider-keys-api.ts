import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { ProviderKey, ProviderKeyCreateBody } from '@/types';

export async function handleCreateProviderKey({
	data,
	projectId,
}: {
	data: ProviderKeyCreateBody;
	projectId: string;
}): Promise<ProviderKey> {
	return await fetcher<ProviderKey>({
		url: `projects/${projectId}/provider-keys'`,
		method: HttpMethod.Post,
		data,
	});
}

export async function handleRetrieveProviderKeys({
	projectId,
}: {
	projectId: string;
}): Promise<ProviderKey[]> {
	return await fetcher<ProviderKey[]>({
		url: `projects/${projectId}/provider-keys`,
		method: HttpMethod.Get,
	});
}

export async function handleDeleteProviderKey({
	projectId,
	providerKeyId,
}: {
	projectId: string;
	providerKeyId: string;
}): Promise<void> {
	await fetcher<undefined>({
		url: `projects/${projectId}/provider-keys/${providerKeyId}`,
		method: HttpMethod.Delete,
	});
}
