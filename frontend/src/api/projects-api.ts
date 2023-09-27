import { Project } from 'shared/types';

import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';

export async function handleRetrieveUserProjects(): Promise<Project[]> {
	return await fetcher<Project[]>({
		url: `projects`,
		method: HttpMethod.Get,
	});
}
