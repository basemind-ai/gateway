import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import {
	Analytics,
	ModelVendor,
	PromptConfig,
	PromptConfigCreateBody,
	PromptConfigUpdateBody,
} from '@/types';

export async function handleCreatePromptConfig<T extends ModelVendor>({
	applicationId,
	projectId,
	data,
}: {
	applicationId: string;
	data: PromptConfigCreateBody<T>;
	projectId: string;
}): Promise<PromptConfig<T>> {
	return await fetcher<PromptConfig<T>>({
		data,
		method: HttpMethod.Post,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/`,
	});
}

export async function handleRetrievePromptConfigs<T extends ModelVendor>({
	applicationId,
	projectId,
}: {
	applicationId: string;
	projectId: string;
}): Promise<PromptConfig<T>[]> {
	return await fetcher<PromptConfig<T>[]>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/`,
	});
}

export async function handleUpdatePromptConfig<T extends ModelVendor>({
	applicationId,
	projectId,
	promptConfigId,
	data,
}: {
	applicationId: string;
	data: PromptConfigUpdateBody<T>;
	projectId: string;
	promptConfigId: string;
}): Promise<PromptConfig<T>> {
	return await fetcher<PromptConfig<T>>({
		data,
		method: HttpMethod.Patch,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/`,
	});
}

export async function handleDeletePromptConfig<T extends ModelVendor>({
	applicationId,
	projectId,
	promptConfigId,
}: {
	applicationId: string;
	projectId: string;
	promptConfigId: string;
}): Promise<PromptConfig<T>> {
	return await fetcher<PromptConfig<T>>({
		method: HttpMethod.Delete,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/`,
	});
}

export async function handleSetDefaultPromptConfig<T extends ModelVendor>({
	applicationId,
	projectId,
	promptConfigId,
}: {
	applicationId: string;
	projectId: string;
	promptConfigId: string;
}): Promise<PromptConfig<T>> {
	return await fetcher<PromptConfig<T>>({
		method: HttpMethod.Patch,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/set-default/`,
	});
}

export async function handlePromptConfigAnalytics({
	promptConfigId,
	applicationId,
	projectId,
	fromDate,
	toDate,
}: {
	applicationId: string;
	fromDate?: string;
	projectId: string;
	promptConfigId: string;
	toDate?: string;
}): Promise<Analytics> {
	return await fetcher<Analytics>({
		method: HttpMethod.Get,
		queryParams: {
			fromDate,
			toDate,
		},
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/analytics`,
	});
}
