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
		data,
		method: HttpMethod.Post,
		url: `projects/${projectId}/provider-keys'`,
	});
}

export async function handleRetrieveProviderKeys({
	projectId,
}: {
	projectId: string;
}): Promise<ProviderKey[]> {
	return await fetcher<ProviderKey[]>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/provider-keys`,
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
		method: HttpMethod.Delete,
		url: `projects/${projectId}/provider-keys/${providerKeyId}`,
	});
}
