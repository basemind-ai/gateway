import { ProjectFactory, ProjectUserAccountFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleAddUsersToProject,
	handleRemoveUserFromProject,
	handleRetrieveProjectUsers,
	handleUpdateUserToPermission,
} from '@/api';
import { HttpMethod } from '@/constants';

describe('project users API tests', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleRetrieveProjectUsers', () => {
		it('returns a list of project users', async () => {
			const project = await ProjectFactory.build();
			const userAccounts = await ProjectUserAccountFactory.batch(2);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(userAccounts),
			});

			const data = await handleRetrieveProjectUsers({
				projectId: project.id,
			});

			expect(data).toEqual(userAccounts);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/users/`,
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
	describe('handleAddUserToProject', () => {
		it('returns a project user', async () => {
			const project = await ProjectFactory.build();
			const userAccount = await ProjectUserAccountFactory.build();

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(userAccount),
			});

			const body = {
				email: userAccount.email,
				permission: userAccount.permission,
			};

			const data = await handleAddUsersToProject({
				projectId: project.id,
				data: [body],
			});

			expect(data).toEqual(userAccount);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/users/`,
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
	describe('handleUpdateUserToPermission', () => {
		it('returns a project user', async () => {
			const project = await ProjectFactory.build();
			const userAccount = await ProjectUserAccountFactory.build();

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(userAccount),
			});

			const body = {
				userId: userAccount.id,
				permission: userAccount.permission,
			};

			const data = await handleUpdateUserToPermission({
				projectId: project.id,
				data: body,
			});

			expect(data).toEqual(userAccount);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/users/${userAccount.id}/`,
				),
				{
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Patch,
					body: JSON.stringify(body),
				},
			);
		});
	});
	describe('handleDeleteProjectUser', () => {
		it('returns undefined for delete project user api', async () => {
			const project = await ProjectFactory.build();
			const userAccount = await ProjectUserAccountFactory.build();

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(),
			});

			// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
			const data = await handleRemoveUserFromProject({
				projectId: project.id,
				userId: userAccount.id,
			});

			expect(data).toBeUndefined();
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/users/${userAccount.id}/`,
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
