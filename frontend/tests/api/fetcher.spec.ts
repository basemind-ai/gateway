import { mockFetch } from 'tests/mocks';

import { fetcher } from '@/api';
import { HttpMethod } from '@/constants';
import { ApiError, ConfigurationError, TokenError } from '@/errors';
import * as firebaseUtils from '@/utils/firebase';

describe('fetcher tests', () => {
	it('handles a success response correctly', async () => {
		const mockResponse = { data: 'success' };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await fetcher({ url: 'test', method: HttpMethod.Get });

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				method: HttpMethod.Get,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer test_token',
					'X-Request-Id': expect.any(String),
				},
			},
		);
		expect(result).toEqual(mockResponse);
	});

	it('handles an empty response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 204,
		});

		const result = await fetcher({ url: 'test', method: HttpMethod.Get });

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				method: HttpMethod.Get,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer test_token',
					'X-Request-Id': expect.any(String),
				},
			},
		);
		expect(result).toEqual({});
	});

	it('handles an invalid HTTP method', async () => {
		await expect(
			// @ts-expect-error
			fetcher({ url: 'test', method: 'INVALID' }),
		).rejects.toThrow(ConfigurationError);
	});

	it('handles a not-logged-in user', async () => {
		const getFirebaseAuthSpy = vi.spyOn(firebaseUtils, 'getFirebaseAuth');
		getFirebaseAuthSpy.mockResolvedValueOnce({
			currentUser: null,
		} as any);
		await expect(
			fetcher({ url: 'test', method: HttpMethod.Get }),
		).rejects.toThrow(TokenError);
	});

	it('handles a non-200 range status code', async () => {
		const mockResponse = { message: 'error' };
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			statusText: 'Bad Request',
			json: () => Promise.resolve(mockResponse),
		});

		await expect(
			fetcher({ url: 'test', method: HttpMethod.Get }),
		).rejects.toThrow(ApiError);

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				method: HttpMethod.Get,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer test_token',
					'X-Request-Id': expect.any(String),
				},
			},
		);
	});

	it('handles a non-200 range status code that does not include message', async () => {
		const mockResponse = {};
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			json: () => Promise.resolve(mockResponse),
		});

		await expect(
			fetcher({ url: 'test', method: HttpMethod.Get }),
		).rejects.toThrow(ApiError);

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				method: HttpMethod.Get,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer test_token',
					'X-Request-Id': expect.any(String),
				},
			},
		);
	});

	it('handles custom headers', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({}),
		});

		await fetcher({
			url: 'test',
			method: HttpMethod.Get,
			headers: { 'X-Test': 'test' },
		});

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test'),
			{
				method: HttpMethod.Get,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer test_token',
					'X-Request-Id': expect.any(String),
					'X-Test': 'test',
				},
			},
		);
	});

	it('handles request with query params', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({}),
		});

		await fetcher({
			url: 'test',
			method: HttpMethod.Get,
			queryParams: { foo: 'bar' },
		});

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/test?foo=bar'),
			{
				method: HttpMethod.Get,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer test_token',
					'X-Request-Id': expect.any(String),
				},
			},
		);
	});
});
