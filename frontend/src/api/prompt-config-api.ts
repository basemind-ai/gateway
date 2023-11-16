import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import {
	Analytics,
	PromptConfig,
	PromptConfigCreateBody,
	PromptConfigUpdateBody,
} from '@/types';

export async function handleCreatePromptConfig({
	applicationId,
	projectId,
	data,
}: {
	applicationId: string;
	data: PromptConfigCreateBody;
	projectId: string;
}): Promise<PromptConfig> {
	return await fetcher<PromptConfig>({
		data,
		method: HttpMethod.Post,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/`,
	});
}

export async function handleRetrievePromptConfigs({
	applicationId,
	projectId,
}: {
	applicationId: string;
	projectId: string;
}): Promise<PromptConfig[]> {
	return await fetcher<PromptConfig[]>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/`,
	});
}

export async function handleUpdatePromptConfig({
	applicationId,
	projectId,
	promptConfigId,
	data,
}: {
	applicationId: string;
	data: PromptConfigUpdateBody;
	projectId: string;
	promptConfigId: string;
}): Promise<PromptConfig> {
	return await fetcher<PromptConfig>({
		data,
		method: HttpMethod.Patch,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/`,
	});
}

export async function handleDeletePromptConfig({
	applicationId,
	projectId,
	promptConfigId,
}: {
	applicationId: string;
	projectId: string;
	promptConfigId: string;
}): Promise<PromptConfig> {
	return await fetcher<PromptConfig>({
		method: HttpMethod.Delete,
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/`,
	});
}

export async function handleSetDefaultPromptConfig({
	applicationId,
	projectId,
	promptConfigId,
}: {
	applicationId: string;
	projectId: string;
	promptConfigId: string;
}): Promise<PromptConfig> {
	return await fetcher<PromptConfig>({
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
