import {
	APIKeyFactory,
	ApplicationFactory,
	ProjectFactory,
} from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleCreateAPIKey,
	handleDeleteAPIKey,
	handleRetrieveAPIKeys,
} from '@/api';
import { HttpMethod } from '@/constants';

describe('API Keys API tests', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleCreateAPIKey', () => {
		it('returns an API Key', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const apiKey = await APIKeyFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(apiKey),
				ok: true,
			});

			const body = {
				name: apiKey.name,
			};

			const data = await handleCreateAPIKey({
				applicationId: application.id,
				data: body,
				projectId: project.id,
			});

			expect(data).toEqual(apiKey);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/apikeys/`,
				),
				{
					body: JSON.stringify(body),
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Post,
				},
			);
		});
	});
	describe('handleRetrieveAPIKeys', () => {
		it('returns a list of api keys', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const apiKeys = await APIKeyFactory.batch(2);

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(apiKeys),
				ok: true,
			});

			const data = await handleRetrieveAPIKeys({
				applicationId: application.id,
				projectId: project.id,
			});

			expect(data).toEqual(apiKeys);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/apikeys/`,
				),
				{
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Get,
				},
			);
		});
	});
	describe('handleDeleteAPIKey', () => {
		it('returns undefined for delete API key', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const apiKey = await APIKeyFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});

			// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
			const data = await handleDeleteAPIKey({
				apiKeyId: apiKey.id,
				applicationId: application.id,
				projectId: project.id,
			});

			expect(data).toBeUndefined();
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/apikeys/${apiKey.id}/`,
				),
				{
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Delete,
				},
			);
		});
	});
});
