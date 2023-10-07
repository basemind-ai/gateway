import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { Project } from '@/types';

export async function handleRetrieveUserProjects(): Promise<Project[]> {
	return await fetcher<Project[]>({
		url: `projects`,
		method: HttpMethod.Get,
	});
}
