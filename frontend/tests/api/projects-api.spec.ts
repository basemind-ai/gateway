/* eslint-disable @typescript-eslint/no-confusing-void-expression */
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
import { ProjectAnalytics } from '@/types';

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
				new URL(`http://www.example.com/v1/projects/${project.id}/`),
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
				modelsCost: 10,
				totalAPICalls: 1000,
			} satisfies ProjectAnalytics;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(projectAnalytics),
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
				modelsCost: 10,
				totalAPICalls: 1000,
			} satisfies ProjectAnalytics;

			const fromDate = '2023-09-30T15:34:09.136Z';
			const toDate = '2023-10-02T15:34:09.136Z';

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(projectAnalytics),
			});
			const data = await handleProjectAnalytics({
				projectId: project.id,
				fromDate,
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
