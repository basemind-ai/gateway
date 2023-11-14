import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';

export async function handleDeleteUserAccount(): Promise<void> {
	await fetcher({
		method: HttpMethod.Delete,
		url: 'users/',
	});
}
