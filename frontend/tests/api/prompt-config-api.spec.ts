/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
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
import { PromptConfigAnalytics } from '@/types';

describe('prompt configs API', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleCreatePromptConfig', () => {
		it('returns a newly created prompt config', async () => {
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
	describe('handleDeletePromptConfig', () => {
		it('returns undefined for delete prompt config api', async () => {
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
			const promptConfig = await PromptConfigFactory.build();
			const promptConfigAnalytics = {
				modelsCost: 10,
				totalPromptRequests: 1000,
			} satisfies PromptConfigAnalytics;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(promptConfigAnalytics),
			});
			const data = await handlePromptConfigAnalytics({
				projectId: project.id,
				applicationId: application.id,
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
			const promptConfig = await PromptConfigFactory.build();
			const promptConfigAnalytics = {
				modelsCost: 10,
				totalPromptRequests: 1000,
			} satisfies PromptConfigAnalytics;

			const fromDate = '2023-09-30T15:34:09.136Z';
			const toDate = '2023-10-02T15:34:09.136Z';

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(promptConfigAnalytics),
			});
			const data = await handlePromptConfigAnalytics({
				projectId: project.id,
				applicationId: application.id,
				promptConfigId: promptConfig.id,
				fromDate,
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
