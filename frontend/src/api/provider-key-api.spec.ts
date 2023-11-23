import { ProjectFactory, ProviderKeyFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleCreateProviderKey,
	handleDeleteProviderKey,
	handleRetrieveProviderKeys,
} from '@/api/provider-keys-api';
import { HttpMethod } from '@/constants';
import { ProviderKeyCreateBody } from '@/types';

describe('Provider Keys API tests', () => {
	const bearerToken = 'Bearer test_token';
	describe('handleCreateProviderKey', () => {
		it('creates a provider key', async () => {
			const project = await ProjectFactory.build();
			const providerKey = await ProviderKeyFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(providerKey),
				ok: true,
			});

			const body = {
				key: 'abc123',
				modelVendor: providerKey.modelVendor,
			} satisfies ProviderKeyCreateBody;

			const data = await handleCreateProviderKey({
				data: body,
				projectId: project.id,
			});

			expect(data).toEqual(providerKey);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/provider-keys/`,
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

	describe('handleRetrieveProviderKeys', () => {
		it('returns a list of provider keys', async () => {
			const project = await ProjectFactory.build();
			const providerKeys = await ProviderKeyFactory.batch(2);

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(providerKeys),
				ok: true,
			});

			const data = await handleRetrieveProviderKeys({
				projectId: project.id,
			});

			expect(data).toEqual(providerKeys);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/provider-keys/`,
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

	describe('handleDeleteProviderKey', () => {
		it('deletes a provider key', async () => {
			const project = await ProjectFactory.build();
			const providerKey = await ProviderKeyFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(providerKey),
				ok: true,
			});

			await handleDeleteProviderKey({
				projectId: project.id,
				providerKeyId: providerKey.id,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/provider-keys/${providerKey.id}`,
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
