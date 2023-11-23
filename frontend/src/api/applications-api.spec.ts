/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleApplicationAnalytics,
	handleCreateApplication,
	handleDeleteApplication,
	handleRetrieveApplication,
	handleRetrieveApplications,
	handleUpdateApplication,
} from '@/api/index';
import { HttpMethod } from '@/constants';
import { Analytics } from '@/types';

describe('applications API tests', () => {
	describe('handleCreateApplication', () => {
		it('returns an application', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(application),
				ok: true,
			});
			const data = await handleCreateApplication({
				data: {
					description: application.description,
					name: application.name,
				},
				projectId: project.id,
			});

			expect(data).toEqual(application);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/`,
				),
				{
					body: JSON.stringify({
						description: application.description,
						name: application.name,
					}),
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Post,
				},
			);
		});
	});
	describe('handleRetrieveApplications', () => {
		it('returns applications of a project', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve([application]),
				ok: true,
			});
			const data = await handleRetrieveApplications(project.id);

			expect(data).toEqual([application]);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications`,
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
	describe('handleRetrieveApplication', () => {
		it('returns an application', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(application),
				ok: true,
			});
			const data = await handleRetrieveApplication({
				applicationId: application.id,
				projectId: project.id,
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
				json: () => Promise.resolve(application),
				ok: true,
			});
			const data = await handleUpdateApplication({
				applicationId: application.id,
				data: {
					description: application.description,
					name: application.name,
				},
				projectId: project.id,
			});

			expect(data).toEqual(application);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/`,
				),
				{
					body: JSON.stringify({
						description: application.description,
						name: application.name,
					}),
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
	describe('handleDeleteApplication', () => {
		it('returns undefined', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});
			const data = await handleDeleteApplication({
				applicationId: application.id,
				projectId: project.id,
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
				tokensCost: 10,
				totalRequests: 1000,
			} satisfies Analytics;
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(applicationAnalytics),
				ok: true,
			});
			const data = await handleApplicationAnalytics({
				applicationId: application.id,
				projectId: project.id,
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
				tokensCost: 10,
				totalRequests: 1000,
			} satisfies Analytics;

			const fromDate = '2023-09-30T15:34:09.136Z';
			const toDate = '2023-10-02T15:34:09.136Z';

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(applicationAnalytics),
				ok: true,
			});
			const data = await handleApplicationAnalytics({
				applicationId: application.id,
				fromDate,
				projectId: project.id,
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
