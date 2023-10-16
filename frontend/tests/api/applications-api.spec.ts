/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleApplicationAnalytics,
	handleCreateApplication,
	handleDeleteApplication,
	handleRetrieveApplication,
	handleUpdateApplication,
} from '@/api';
import { HttpMethod } from '@/constants';
import { ApplicationAnalytics } from '@/types';

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
	describe('handleApplicationAnalytics', () => {
		it('returns an application analytics', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const applicationAnalytics = {
				projectedCost: 10,
				totalRequests: 1000,
			} satisfies ApplicationAnalytics;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(applicationAnalytics),
			});
			const data = await handleApplicationAnalytics({
				projectId: project.id,
				applicationId: application.id,
			});

			expect(data).toEqual(applicationAnalytics);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/analytics`,
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
		it('returns application analytics for a given date range', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const applicationAnalytics = {
				projectedCost: 10,
				totalRequests: 1000,
			} satisfies ApplicationAnalytics;

			const fromDate = '2023-09-30T15:34:09.136Z';
			const toDate = '2023-10-02T15:34:09.136Z';

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(applicationAnalytics),
			});
			const data = await handleApplicationAnalytics({
				projectId: project.id,
				applicationId: application.id,
				fromDate,
				toDate,
			});

			expect(data).toEqual(applicationAnalytics);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/analytics?fromDate=${fromDate}&toDate=${toDate}`,
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
});