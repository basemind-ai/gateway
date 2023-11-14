import { ProjectFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleCreateProject,
	handleDeleteProject,
	handleProjectAnalytics,
	handleRetrieveProjects,
	handleUpdateProject,
} from '@/api';
import { HttpMethod } from '@/constants';
import { AnalyticsDTO } from '@/types';

describe('projects API tests', () => {
	describe('handleCreateProject', () => {
		it('returns a project', async () => {
			const project = await ProjectFactory.build();
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(project),
				ok: true,
			});
			const data = await handleCreateProject({
				data: {
					description: project.description,
					name: project.name,
				},
			});

			expect(data).toEqual(project);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/projects'),
				{
					body: JSON.stringify({
						description: project.description,
						name: project.name,
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
	describe('handleRetrieveProjects', () => {
		it('returns a list of projects', async () => {
			const projects = await ProjectFactory.batch(2);
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(projects),
				ok: true,
			});
			const data = await handleRetrieveProjects();

			expect(data).toEqual(projects);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/projects'),
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
				json: () => Promise.resolve(project),
				ok: true,
			});
			const data = await handleUpdateProject({
				data: {
					description: project.description,
					name: project.name,
				},
				projectId: project.id,
			});

			expect(data).toEqual(project);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(`http://www.example.com/v1/projects/${project.id}/`),
				{
					body: JSON.stringify({
						description: project.description,
						name: project.name,
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
	describe('handleDeleteProject', () => {
		it('returns undefined', async () => {
			const project = await ProjectFactory.build();
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});
			// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
			const data = await handleDeleteProject({
				projectId: project.id,
			});

			expect(data).toBeUndefined();
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(`http://www.example.com/v1/projects/${project.id}/`),
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
	describe('handleProjectAnalytics', () => {
		it('returns an application analytics', async () => {
			const project = await ProjectFactory.build();
			const projectAnalytics = {
				tokensCost: 10,
				totalRequests: 1000,
			} satisfies AnalyticsDTO;

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(projectAnalytics),
				ok: true,
			});
			const data = await handleProjectAnalytics({
				projectId: project.id,
			});

			expect(data).toEqual(projectAnalytics);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/analytics`,
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
			const projectAnalytics = {
				tokensCost: 10,
				totalRequests: 1000,
			} satisfies AnalyticsDTO;

			const fromDate = '2023-09-30T15:34:09.136Z';
			const toDate = '2023-10-02T15:34:09.136Z';

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(projectAnalytics),
				ok: true,
			});
			const data = await handleProjectAnalytics({
				fromDate,
				projectId: project.id,
				toDate,
			});

			expect(data).toEqual(projectAnalytics);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/analytics?fromDate=${fromDate}&toDate=${toDate}`,
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
