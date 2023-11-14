import { mockFetch } from 'tests/mocks';

import { fetcher } from '@/api';
import { HttpMethod } from '@/constants';
import { ApiError, ConfigurationError, TokenError } from '@/errors';
import * as firebaseUtils from '@/utils/firebase';

describe('fetcher tests', () => {
	it('handles a success response correctly', async () => {
		const mockResponse = { data: 'success' };
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(mockResponse),
			ok: true,
			status: 200,
		});

		const result = await fetcher({ method: HttpMethod.Get, url: 'test' });

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				headers: {
					'Authorization': 'Bearer test_token',
					'Content-Type': 'application/json',
					'X-Request-Id': expect.any(String),
				},
				method: HttpMethod.Get,
			},
		);
		expect(result).toEqual(mockResponse);
	});

	it('handles an empty response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 204,
		});

		const result = await fetcher({ method: HttpMethod.Get, url: 'test' });

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				headers: {
					'Authorization': 'Bearer test_token',
					'Content-Type': 'application/json',
					'X-Request-Id': expect.any(String),
				},
				method: HttpMethod.Get,
			},
		);
		expect(result).toEqual({});
	});

	it('handles an invalid HTTP method', async () => {
		await expect(
			// @ts-expect-error
			fetcher({ method: 'INVALID', url: 'test' }),
		).rejects.toThrow(ConfigurationError);
	});

	it('handles a not-logged-in user', async () => {
		const getFirebaseAuthSpy = vi.spyOn(firebaseUtils, 'getFirebaseAuth');
		getFirebaseAuthSpy.mockResolvedValueOnce({
			currentUser: null,
		} as any);
		await expect(
			fetcher({ method: HttpMethod.Get, url: 'test' }),
		).rejects.toThrow(TokenError);
	});

	it('handles a non-200 range status code', async () => {
		const mockResponse = { message: 'error' };
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(mockResponse),
			ok: false,
			status: 400,
			statusText: 'Bad Request',
		});

		await expect(
			fetcher({ method: HttpMethod.Get, url: 'test' }),
		).rejects.toThrow(ApiError);

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				headers: {
					'Authorization': 'Bearer test_token',
					'Content-Type': 'application/json',
					'X-Request-Id': expect.any(String),
				},
				method: HttpMethod.Get,
			},
		);
	});

	it('handles a non-200 range status code that does not include message', async () => {
		const mockResponse = {};
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(mockResponse),
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
		});

		await expect(
			fetcher({ method: HttpMethod.Get, url: 'test' }),
		).rejects.toThrow(ApiError);

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				headers: {
					'Authorization': 'Bearer test_token',
					'Content-Type': 'application/json',
					'X-Request-Id': expect.any(String),
				},
				method: HttpMethod.Get,
			},
		);
	});

	it('handles custom headers', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve({}),
			ok: true,
			status: 200,
		});

		await fetcher({
			headers: { 'X-Test': 'test' },
			method: HttpMethod.Get,
			url: 'test',
		});

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				headers: {
					'Authorization': 'Bearer test_token',
					'Content-Type': 'application/json',
					'X-Request-Id': expect.any(String),
					'X-Test': 'test',
				},
				method: HttpMethod.Get,
			},
		);
	});

	it('handles request with query params', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve({}),
			ok: true,
			status: 200,
		});

		await fetcher({
			method: HttpMethod.Get,
			queryParams: { foo: 'bar' },
			url: 'test',
		});

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test?foo=bar'),
			{
				headers: {
					'Authorization': 'Bearer test_token',
					'Content-Type': 'application/json',
					'X-Request-Id': expect.any(String),
				},
				method: HttpMethod.Get,
			},
		);
	});
});
