import { ProjectFactory, ProjectUserAccountFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleAddUsersToProject,
	handleRemoveUserFromProject,
	handleRetrieveProjectUsers,
	handleUpdateUserToPermission,
} from '@/api';
import { HttpMethod } from '@/constants';
import { AddUserToProjectBody } from '@/types';

describe('project users API tests', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleRetrieveProjectUsers', () => {
		it('returns a list of project users', async () => {
			const project = await ProjectFactory.build();
			const userAccounts = await ProjectUserAccountFactory.batch(2);

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(userAccounts),
				ok: true,
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

	describe('handleAddUsersToProject', () => {
		it('adds users to project', async () => {
			const project = await ProjectFactory.build();
			const userAccounts = await ProjectUserAccountFactory.batch(2);

			const requestData = userAccounts.map(
				(userAccount) =>
					({
						email: userAccount.email,
						permission: userAccount.permission,
					}) satisfies AddUserToProjectBody,
			);

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(null),
				ok: true,
			});

			await handleAddUsersToProject({
				data: requestData,
				projectId: project.id,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/users/`,
				),
				{
					body: JSON.stringify(requestData),
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

	describe('handleUpdateUserToPermission', () => {
		it('returns a project user', async () => {
			const project = await ProjectFactory.build();
			const userAccount = await ProjectUserAccountFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(userAccount),
				ok: true,
			});

			const body = {
				permission: userAccount.permission,
				userId: userAccount.id,
			};

			const data = await handleUpdateUserToPermission({
				data: body,
				projectId: project.id,
			});

			expect(data).toEqual(userAccount);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/users/${userAccount.id}/`,
				),
				{
					body: JSON.stringify(body),
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Patch,
				},
			);
		});
	});
	describe('handleDeleteProjectUser', () => {
		it('returns undefined for delete project user api', async () => {
			const project = await ProjectFactory.build();
			const userAccount = await ProjectUserAccountFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
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
