/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import {
	ApplicationFactory,
	ProjectFactory,
	ProjectUserAccountFactory,
	PromptConfigFactory,
	TokenFactory,
} from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleCreateApplication,
	handleCreateProject,
	handleCreatePromptConfig,
	handleCreateToken,
	handleDeleteApplication,
	handleDeleteProject,
	handleDeletePromptConfig,
	handleDeleteToken,
	handleRetrieveApplication,
	handleRetrieveProjects,
	handleRetrievePromptConfigs,
	handleRetrieveTokens,
	handleSetDefaultPromptConfig,
	handleUpdateApplication,
	handleUpdateProject,
	handleUpdatePromptConfig,
} from '@/api';
import {
	handleAddUserToProject,
	handleRemoveUserFromProject,
	handleUpdateUserToPermission,
} from '@/api/project-users-api';
import { HttpMethod } from '@/constants';

describe('API tests', () => {
	describe('Projects', () => {
		describe('handleCreateProject', () => {
			it('returns a project', async () => {
				const project = await ProjectFactory.build();
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(project),
				});
				const data = await handleCreateProject({
					data: {
						name: project.name,
						description: project.description,
					},
				});

				expect(data).toEqual(project);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(`http://www.example.com/v1/projects`),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Post,
						body: JSON.stringify({
							name: project.name,
							description: project.description,
						}),
					},
				);
			});
		});
		describe('handleRetrieveProjects', () => {
			it('returns a list of projects', async () => {
				const projects = await ProjectFactory.batch(2);
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(projects),
				});
				const data = await handleRetrieveProjects();

				expect(data).toEqual(projects);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(`http://www.example.com/v1/projects`),
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
		describe('handleUpdateProject', () => {
			it('returns a project', async () => {
				const project = await ProjectFactory.build();
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(project),
				});
				const data = await handleUpdateProject({
					projectId: project.id,
					data: {
						name: project.name,
						description: project.description,
					},
				});

				expect(data).toEqual(project);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Patch,
						body: JSON.stringify({
							name: project.name,
							description: project.description,
						}),
					},
				);
			});
		});
		describe('handleDeleteProject', () => {
			it('returns undefined', async () => {
				const project = await ProjectFactory.build();
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(),
				});
				const data = await handleDeleteProject({
					projectId: project.id,
				});

				expect(data).toBeUndefined();
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Delete,
					},
				);
			});
		});
	});
	describe('applications', () => {
		describe('handleCreateApplication', () => {
			it('returns an application', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(application),
				});
				const data = await handleCreateApplication({
					projectId: project.id,
					data: {
						name: application.name,
						description: application.description,
					},
				});

				expect(data).toEqual(application);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Post,
						body: JSON.stringify({
							name: application.name,
							description: application.description,
						}),
					},
				);
			});
		});
		describe('handleRetrieveApplication', () => {
			it('returns an application', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(application),
				});
				const data = await handleRetrieveApplication({
					projectId: project.id,
					applicationId: application.id,
				});

				expect(data).toEqual(application);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/`,
					),
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
		describe('handleUpdateApplication', () => {
			it('returns an application', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(application),
				});
				const data = await handleUpdateApplication({
					projectId: project.id,
					applicationId: application.id,
					data: {
						name: application.name,
						description: application.description,
					},
				});

				expect(data).toEqual(application);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Patch,
						body: JSON.stringify({
							name: application.name,
							description: application.description,
						}),
					},
				);
			});
		});
		describe('handleDeleteApplication', () => {
			it('returns undefined', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(),
				});
				const data = await handleDeleteApplication({
					projectId: project.id,
					applicationId: application.id,
				});

				expect(data).toBeUndefined();
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Delete,
					},
				);
			});
		});
	});
	describe('Prompt Configs', () => {
		describe('handleCreatePromptConfig', () => {
			it('returns a prompt config', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				const promptConfig = await PromptConfigFactory.build();

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(promptConfig),
				});

				const body = {
					name: promptConfig.name,
					modelParameters: promptConfig.modelParameters,
					modelVendor: promptConfig.modelVendor,
					modelType: promptConfig.modelType,
					providerPromptMessages: promptConfig.providerPromptMessages,
				};

				const data = await handleCreatePromptConfig({
					projectId: project.id,
					applicationId: application.id,
					data: body,
				});

				expect(data).toEqual(promptConfig);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Post,
						body: JSON.stringify(body),
					},
				);
			});
		});
		describe('handleRetrievePromptConfigs', () => {
			it('returns a list of prompt configs', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				const promptConfigs = await PromptConfigFactory.batch(2);

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(promptConfigs),
				});

				const data = await handleRetrievePromptConfigs({
					projectId: project.id,
					applicationId: application.id,
				});

				expect(data).toEqual(promptConfigs);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/`,
					),
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
		describe('handleUpdatePromptConfig', () => {
			it('returns a prompt config', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				const promptConfig = await PromptConfigFactory.build();

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(promptConfig),
				});

				const body = {
					name: promptConfig.name,
					modelParameters: promptConfig.modelParameters,
					modelVendor: promptConfig.modelVendor,
					modelType: promptConfig.modelType,
					providerPromptMessages: promptConfig.providerPromptMessages,
				};

				const data = await handleUpdatePromptConfig({
					projectId: project.id,
					applicationId: application.id,
					promptConfigId: promptConfig.id,
					data: body,
				});

				expect(data).toEqual(promptConfig);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Patch,
						body: JSON.stringify(body),
					},
				);
			});
		});
		describe('handleDeletePromptConfig', () => {
			it('returns undefined', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				const promptConfig = await PromptConfigFactory.build();

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(),
				});

				const data = await handleDeletePromptConfig({
					projectId: project.id,
					applicationId: application.id,
					promptConfigId: promptConfig.id,
				});

				expect(data).toBeUndefined();
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Delete,
					},
				);
			});
		});
		describe('handleSetDefaultPromptConfig', () => {
			it('returns a prompt config', async () => {
				const project = await ProjectFactory.build();
				const application = await ApplicationFactory.build();
				const promptConfig = await PromptConfigFactory.build();

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(promptConfig),
				});

				const data = await handleSetDefaultPromptConfig({
					projectId: project.id,
					applicationId: application.id,
					promptConfigId: promptConfig.id,
				});

				expect(data).toEqual(promptConfig);
				expect(mockFetch).toHaveBeenCalledWith(
					new URL(
						`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/set-default/`,
					),
					{
						headers: {
							'Authorization': 'Bearer test_token',
							'Content-Type': 'application/json',
							'X-Request-Id': expect.any(String),
						},
						method: HttpMethod.Patch,
					},
				);
			});
		});

		describe('Tokens', () => {
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
								'Authorization': 'Bearer test_token',
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
								'Authorization': 'Bearer test_token',
								'Content-Type': 'application/json',
								'X-Request-Id': expect.any(String),
							},
							method: HttpMethod.Get,
						},
					);
				});
			});
			describe('handleDeleteToken', () => {
				it('returns undefined', async () => {
					const project = await ProjectFactory.build();
					const application = await ApplicationFactory.build();
					const token = await TokenFactory.build();

					mockFetch.mockResolvedValueOnce({
						ok: true,
						json: () => Promise.resolve(),
					});

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
								'Authorization': 'Bearer test_token',
								'Content-Type': 'application/json',
								'X-Request-Id': expect.any(String),
							},
							method: HttpMethod.Delete,
						},
					);
				});
			});
		});

		describe('Project Users', () => {
			describe('handleRetrieveProjectUsers', () => {
				it('returns a list of project users', async () => {
					const project = await ProjectFactory.build();
					const application = await ApplicationFactory.build();
					const userAccounts =
						await ProjectUserAccountFactory.batch(2);

					mockFetch.mockResolvedValueOnce({
						ok: true,
						json: () => Promise.resolve(userAccounts),
					});

					const data = await handleRetrieveTokens({
						projectId: project.id,
						applicationId: application.id,
					});

					expect(data).toEqual(userAccounts);
					expect(mockFetch).toHaveBeenCalledWith(
						new URL(
							`http://www.example.com/v1/projects/${project.id}/users/`,
						),
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

					const data = await handleAddUserToProject({
						projectId: project.id,
						data: body,
					});

					expect(data).toEqual(userAccount);
					expect(mockFetch).toHaveBeenCalledWith(
						new URL(
							`http://www.example.com/v1/projects/${project.id}/users/`,
						),
						{
							headers: {
								'Authorization': 'Bearer test_token',
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
					const application = await ApplicationFactory.build();
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
								'Authorization': 'Bearer test_token',
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
				it('returns undefined', async () => {
					const project = await ProjectFactory.build();
					const userAccount = await ProjectUserAccountFactory.build();

					mockFetch.mockResolvedValueOnce({
						ok: true,
						json: () => Promise.resolve(),
					});

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
								'Authorization': 'Bearer test_token',
								'Content-Type': 'application/json',
								'X-Request-Id': expect.any(String),
							},
							method: HttpMethod.Delete,
						},
					);
				});
			});
		});
	});
});
