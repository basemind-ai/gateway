import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { UserAccount } from '@/types';

export async function handleRetrieveUserAccountData(): Promise<UserAccount> {
	return await fetcher<UserAccount>({
		url: `user-account/`,
		method: HttpMethod.Get,
	});
}
