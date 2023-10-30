import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';

export async function handleDeleteUserAccount(): Promise<void> {
	await fetcher({
		url: `users/`,
		method: HttpMethod.Delete,
	});
}
