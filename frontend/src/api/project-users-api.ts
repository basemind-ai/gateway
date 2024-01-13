import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
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
		method: HttpMethod.Get,
		url: `projects/${projectId}/users/`,
	});
}

export async function handleAddUsersToProject({
	projectId,
	data,
}: {
	data: AddUserToProjectBody[];
	projectId: string;
}): Promise<void> {
	await fetcher<null>({
		data,
		method: HttpMethod.Post,
		url: `projects/${projectId}/users/`,
	});
}

export async function handleUpdateUserPermission({
	projectId,
	data,
}: {
	data: UserProjectPermissionUpdateBody;
	projectId: string;
}): Promise<ProjectUserAccount> {
	return await fetcher<ProjectUserAccount>({
		data,
		method: HttpMethod.Patch,
		url: `projects/${projectId}/users/`,
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
		method: HttpMethod.Delete,
		url: `projects/${projectId}/users/${userId}/`,
	});
}
