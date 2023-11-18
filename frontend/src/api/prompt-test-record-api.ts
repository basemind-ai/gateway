import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { ModelVendor, PromptTestRecord } from '@/types';

export async function handleRetrievePromptTestRecords<T extends ModelVendor>({
	projectId,
	applicationId,
}: {
	applicationId: string;
	projectId: string;
}): Promise<PromptTestRecord<T>[]> {
	return await fetcher<PromptTestRecord<T>[]>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/applications/${applicationId}/test-records/`,
	});
}

export async function handleRetrievePromptTestRecordById<
	T extends ModelVendor,
>({
	projectId,
	applicationId,
	promptTestRecordId,
}: {
	applicationId: string;
	projectId: string;
	promptTestRecordId: string;
}): Promise<PromptTestRecord<T>> {
	return await fetcher<PromptTestRecord<T>>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/applications/${applicationId}/test-records/${promptTestRecordId}/`,
	});
}

export async function handleDeletePromptTestRecord({
	projectId,
	applicationId,
	promptTestRecordId,
}: {
	applicationId: string;
	projectId: string;
	promptTestRecordId: string;
}): Promise<void> {
	await fetcher<undefined>({
		method: HttpMethod.Delete,
		url: `projects/${projectId}/applications/${applicationId}/test-records/${promptTestRecordId}/`,
	});
}
