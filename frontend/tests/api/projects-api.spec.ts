/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { ProjectFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleCreateProject,
	handleDeleteProject,
	handleRetrieveProjects,
	handleUpdateProject,
} from '@/api';
import { HttpMethod } from '@/constants';

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
});
