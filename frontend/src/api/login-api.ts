import { LoginResponseData } from 'shared/types';

import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';

export async function handleLogin(): Promise<LoginResponseData> {
	return await fetcher<LoginResponseData>({
		url: `login`,
		method: HttpMethod.Get,
	});
}
