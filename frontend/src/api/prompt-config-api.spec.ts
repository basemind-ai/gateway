import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleCreatePromptConfig,
	handleDeletePromptConfig,
	handlePromptConfigAnalytics,
	handleRetrievePromptConfigs,
	handleSetDefaultPromptConfig,
	handleUpdatePromptConfig,
} from '@/api/prompt-config-api';
import { HttpMethod } from '@/constants';
import { Analytics } from '@/types';

describe('prompt configs API', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleCreatePromptConfig', () => {
		it('returns a newly created prompt config', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptConfig),
				ok: true,
			});

			const body = {
				modelParameters: promptConfig.modelParameters,
				modelType: promptConfig.modelType,
				modelVendor: promptConfig.modelVendor,
				name: promptConfig.name,
				promptMessages: promptConfig.providerPromptMessages,
			};

			const data = await handleCreatePromptConfig({
				applicationId: application.id,
				data: body,
				projectId: project.id,
			});

			expect(data).toEqual(promptConfig);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/`,
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
	describe('handleRetrievePromptConfigs', () => {
		it('returns a list of prompt configs', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptConfigs),
				ok: true,
			});

			const data = await handleRetrievePromptConfigs({
				applicationId: application.id,
				projectId: project.id,
			});

			expect(data).toEqual(promptConfigs);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/`,
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
	describe('handleUpdatePromptConfig', () => {
		it('returns the updated prompt config', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptConfig),
				ok: true,
			});

			const body = {
				modelParameters: promptConfig.modelParameters,
				modelType: promptConfig.modelType,
				modelVendor: promptConfig.modelVendor,
				name: promptConfig.name,
				promptMessages: promptConfig.providerPromptMessages,
			};

			const data = await handleUpdatePromptConfig({
				applicationId: application.id,
				data: body,
				projectId: project.id,
				promptConfigId: promptConfig.id,
			});

			expect(data).toEqual(promptConfig);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/`,
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
	describe('handleDeletePromptConfig', () => {
		it('returns undefined for delete prompt config api', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});

			const data = await handleDeletePromptConfig({
				applicationId: application.id,
				projectId: project.id,
				promptConfigId: promptConfig.id,
			});

			expect(data).toBeUndefined();
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/`,
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
	describe('handleSetDefaultPromptConfig', () => {
		it('returns a default prompt config', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptConfig),
				ok: true,
			});

			const data = await handleSetDefaultPromptConfig({
				applicationId: application.id,
				projectId: project.id,
				promptConfigId: promptConfig.id,
			});

			expect(data).toEqual(promptConfig);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/set-default/`,
				),
				{
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

	describe('handlePromptConfigAnalytics', () => {
		it('returns prompt config analytics', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();
			const promptConfigAnalytics = {
				tokensCost: 10,
				totalRequests: 1000,
			} satisfies Analytics;
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptConfigAnalytics),
				ok: true,
			});
			const data = await handlePromptConfigAnalytics({
				applicationId: application.id,
				projectId: project.id,
				promptConfigId: promptConfig.id,
			});

			expect(data).toEqual(promptConfigAnalytics);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/analytics`,
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
		it('returns prompt config analytics for a given date range', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();
			const promptConfigAnalytics = {
				tokensCost: 10,
				totalRequests: 1000,
			} satisfies Analytics;

			const fromDate = '2023-09-30T15:34:09.136Z';
			const toDate = '2023-10-02T15:34:09.136Z';

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptConfigAnalytics),
				ok: true,
			});
			const data = await handlePromptConfigAnalytics({
				applicationId: application.id,
				fromDate,
				projectId: project.id,
				promptConfigId: promptConfig.id,
				toDate,
			});

			expect(data).toEqual(promptConfigAnalytics);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/prompt-configs/${promptConfig.id}/analytics?fromDate=${fromDate}&toDate=${toDate}`,
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
});
