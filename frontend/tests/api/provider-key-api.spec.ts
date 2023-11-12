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
				ok: true,
				json: () => Promise.resolve(providerKey),
			});

			const body = {
				key: 'abc123',
				modelVendor: providerKey.modelVendor,
			} satisfies ProviderKeyCreateBody;

			const data = await handleCreateProviderKey({
				projectId: project.id,
				data: body,
			});

			expect(data).toEqual(providerKey);
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
					method: HttpMethod.Post,
					body: JSON.stringify(body),
				},
			);
		});
	});

	describe('handleRetrieveProviderKeys', () => {
		it('returns a list of provider keys', async () => {
			const project = await ProjectFactory.build();
			const providerKeys = await ProviderKeyFactory.batch(2);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(providerKeys),
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
				ok: true,
				json: () => Promise.resolve(providerKey),
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
