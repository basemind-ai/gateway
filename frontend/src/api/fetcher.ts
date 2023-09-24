import { deepmerge } from 'deepmerge-ts';

import { HttpMethod } from '@/constants';
import { ApiError, ConfigurationError, TokenError } from '@/errors';
import { getFirebaseAuth } from '@/utils/firebase';

export async function fetcher<T>({
	url,
	method,
	version = 1,
	data,
	...rest
}: {
	url: string;
	method: HttpMethod;
	version?: number;
	data?: Record<string, any> | any[] | string | number;
} & Omit<RequestInit, 'method' | 'body'>): Promise<T> {
	const auth = await getFirebaseAuth();
	const token = await auth.currentUser?.getIdToken();

	if (!token) {
		throw new TokenError('user is not logged in');
	}

	if (!Object.values(HttpMethod).includes(method)) {
		throw new ConfigurationError(`invalid HTTP method ${method}`);
	}

	const request = deepmerge(rest, {
		method,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
			'X-Request-Id': crypto.randomUUID(),
		},
		body: data ? JSON.stringify(data) : undefined,
	}) satisfies RequestInit;

	const path = new URL(
		`v${version}/${url}`,
		process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
	);

	console.log(path, request);

	const response = await fetch(path, request);
	const body =
		response.status === 204
			? {}
			: ((await response.json()) as Record<string, any>);

	if (!response.ok) {
		console.log('failed to retrieve data');
		throw new ApiError(
			(Reflect.get(body, 'message') ?? 'An API Error Occurred') as string,
			{
				statusCode: response.status,
				statusText: response.statusText,
				context: { path },
			},
		);
	}

	return body as T;
}
