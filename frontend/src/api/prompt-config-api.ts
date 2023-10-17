import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import {
	PromptConfig,
	PromptConfigAnalytics,
	PromptConfigCreateBody,
	PromptConfigUpdateBody,
} from '@/types';

export async function handleCreatePromptConfig({
	applicationId,
	projectId,
	data,
}: {
	applicationId: string;
	projectId: string;
	data: PromptConfigCreateBody;
}): Promise<PromptConfig> {
	return await fetcher<PromptConfig>({
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/`,
		method: HttpMethod.Post,
		data,
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
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/`,
		method: HttpMethod.Get,
	});
}

export async function handleUpdatePromptConfig({
	applicationId,
	projectId,
	promptConfigId,
	data,
}: {
	applicationId: string;
	projectId: string;
	promptConfigId: string;
	data: PromptConfigUpdateBody;
}): Promise<PromptConfig> {
	return await fetcher<PromptConfig>({
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/`,
		method: HttpMethod.Patch,
		data,
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
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/`,
		method: HttpMethod.Delete,
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
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/set-default/`,
		method: HttpMethod.Patch,
	});
}

export async function handlePromptConfigAnalytics({
	promptConfigId,
	applicationId,
	projectId,
	fromDate,
	toDate,
}: {
	promptConfigId: string;
	applicationId: string;
	projectId: string;
	fromDate?: string;
	toDate?: string;
}): Promise<PromptConfigAnalytics> {
	return await fetcher<PromptConfigAnalytics>({
		url: `projects/${projectId}/applications/${applicationId}/prompt-configs/${promptConfigId}/analytics`,
		method: HttpMethod.Get,
		queryParams: {
			fromDate,
			toDate,
		},
	});
}
