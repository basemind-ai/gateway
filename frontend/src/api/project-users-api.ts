import { UserInfo } from '@firebase/auth';

import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { SupportTopics } from '@/constants/forms';
import {
	AddUserToProjectBody,
	ProjectUserAccount,
	UserProjectPermissionUpdateBody,
} from '@/types';

export async function handleRetrieveProjectUsers({
	projectId,
}: {
	projectId: string;
}): Promise<ProjectUserAccount[]> {
	return await fetcher<ProjectUserAccount[]>({
		url: `projects/${projectId}/users/`,
		method: HttpMethod.Get,
	});
}

export async function handleAddUserToProject({
	projectId,
	data,
}: {
	projectId: string;
	data: AddUserToProjectBody;
}): Promise<ProjectUserAccount> {
	return await fetcher<ProjectUserAccount>({
		url: `projects/${projectId}/users/`,
		method: HttpMethod.Post,
		data,
	});
}

export async function handleUpdateUserToPermission({
	projectId,
	data,
}: {
	projectId: string;
	data: UserProjectPermissionUpdateBody;
}): Promise<ProjectUserAccount> {
	return await fetcher<ProjectUserAccount>({
		url: `projects/${projectId}/users/`,
		method: HttpMethod.Patch,
		data,
	});
}

export async function handleRemoveUserFromProject({
	projectId,
	userId,
}: {
	projectId: string;
	userId: string;
}): Promise<void> {
	await fetcher<undefined>({
		url: `projects/${projectId}/users/${userId}/`,
		method: HttpMethod.Delete,
	});
}

// create a dummey function handleSupportTicket
export async function handleSupportTicket(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	selectedTopic: SupportTopics,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	tellUsMore: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	user: UserInfo,
): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	// TODO: Naaman Implement this please
}
