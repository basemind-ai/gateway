import { ProjectFactory, ProjectInvitationFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleDeleteProjectInvitation,
	handleRetrieveProjectInvitations,
} from '@/api/project-invitation-api';
import { HttpMethod } from '@/constants';

describe('project invitations API tests', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleRetrieveProjectInvitations', () => {
		it('returns a list of project users', async () => {
			const project = await ProjectFactory.build();
			const projectInvitations = await ProjectInvitationFactory.batch(2);

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(projectInvitations),
				ok: true,
			});

			const data = await handleRetrieveProjectInvitations({
				projectId: project.id,
			});

			expect(data).toEqual(projectInvitations);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/invitation/`,
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

	describe('handleDeleteProjectInvitation', () => {
		it('returns a list of project users', async () => {
			const project = await ProjectFactory.build();
			const projectInvitation = await ProjectInvitationFactory.build();

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});

			await handleDeleteProjectInvitation({
				invitationId: projectInvitation.id,
				projectId: project.id,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/invitation/${projectInvitation.id}/`,
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
