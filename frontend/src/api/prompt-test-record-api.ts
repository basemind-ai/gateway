import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { PromptTestRecord } from '@/types';

export async function handleRetrievePromptTestRecords<P = any, M = any>({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}): Promise<PromptTestRecord<P, M>[]> {
	return await fetcher<PromptTestRecord<P, M>[]>({
		url: `projects/${projectId}/applications/${applicationId}/test-records/`,
		method: HttpMethod.Get,
	});
}

export async function handleRetrievePromptTestRecordById<P = any, M = any>({
	projectId,
	applicationId,
	promptTestRecordId,
}: {
	projectId: string;
	applicationId: string;
	promptTestRecordId: string;
}): Promise<PromptTestRecord<P, M>> {
	return await fetcher<PromptTestRecord<P, M>>({
		url: `projects/${projectId}/applications/${applicationId}/test-records/${promptTestRecordId}/`,
		method: HttpMethod.Get,
	});
}

export async function handleDeletePromptTestRecord({
	projectId,
	applicationId,
	promptTestRecordId,
}: {
	projectId: string;
	applicationId: string;
	promptTestRecordId: string;
}): Promise<void> {
	await fetcher<undefined>({
		url: `projects/${projectId}/applications/${applicationId}/test-records/${promptTestRecordId}/`,
		method: HttpMethod.Delete,
	});
}
