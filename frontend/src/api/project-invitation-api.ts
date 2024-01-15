import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { ProjectInvitation } from '@/types';

export async function handleRetrieveProjectInvitations({
	projectId,
}: {
	projectId: string;
}): Promise<ProjectInvitation[]> {
	return await fetcher<ProjectInvitation[]>({
		method: HttpMethod.Get,
		url: `projects/${projectId}/invitation/`,
	});
}

export async function handleDeleteProjectInvitation({
	projectId,
	invitationId,
}: {
	invitationId: string;
	projectId: string;
}): Promise<void> {
	await fetcher<undefined>({
		method: HttpMethod.Delete,
		url: `projects/${projectId}/invitation/${invitationId}/`,
	});
}
