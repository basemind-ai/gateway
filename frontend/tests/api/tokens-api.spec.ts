import {
	ApplicationFactory,
	ProjectFactory,
	TokenFactory,
} from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleCreateToken,
	handleDeleteToken,
	handleRetrieveTokens,
} from '@/api';
import { HttpMethod } from '@/constants';

describe('tokens API tests', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleCreateToken', () => {
		it('returns a token', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const token = await TokenFactory.build();

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(token),
			});

			const body = {
				name: token.name,
			};

			const data = await handleCreateToken({
				projectId: project.id,
				applicationId: application.id,
				data: body,
			});

			expect(data).toEqual(token);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/tokens/`,
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
	describe('handleRetrieveTokens', () => {
		it('returns a list of tokens', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const tokens = await TokenFactory.batch(2);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(tokens),
			});

			const data = await handleRetrieveTokens({
				projectId: project.id,
				applicationId: application.id,
			});

			expect(data).toEqual(tokens);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/tokens/`,
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
	describe('handleDeleteToken', () => {
		it('returns undefined for delete token api', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const token = await TokenFactory.build();

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(),
			});

			// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
			const data = await handleDeleteToken({
				projectId: project.id,
				applicationId: application.id,
				tokenId: token.id,
			});

			expect(data).toBeUndefined();
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/tokens/${token.id}/`,
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
