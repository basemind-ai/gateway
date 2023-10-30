import { fireEvent, waitFor } from '@testing-library/react';
import { ProjectUserAccountFactory } from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import * as ProjectUsersAPI from '@/api/project-users-api';
import { ProjectMembers } from '@/components/projects/[projectId]/project-members';
import { ApiError } from '@/errors';
import { useSetUser } from '@/stores/api-store';
import { AccessPermission } from '@/types';

describe('ProjectMembers', () => {
	const handleUpdateUserToPermissionSpy = vi.spyOn(
		ProjectUsersAPI,
		'handleUpdateUserToPermission',
	);
	const handleRetrieveProjectUsersSpy = vi.spyOn(
		ProjectUsersAPI,
		'handleRetrieveProjectUsers',
	);
	const handleRemoveUserFromProjectSpy = vi.spyOn(
		ProjectUsersAPI,
		'handleRemoveUserFromProject',
	);
	const projectUsers = ProjectUserAccountFactory.batchSync(2);
	projectUsers[0].permission = AccessPermission.ADMIN;
	projectUsers[1].permission = AccessPermission.MEMBER;
	projectUsers[1].photoUrl = '';
	const [adminUser, memberUser] = projectUsers;
	const projectId = '1';

	beforeAll(() => {
		HTMLDialogElement.prototype.showModal = vi.fn();
		HTMLDialogElement.prototype.close = vi.fn();
	});

	it('renders project members', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);
		setUser(adminUser);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers projectId={projectId} />);

		for (const projectUser of projectUsers) {
			await waitFor(() => {
				const displayName = screen.getByText(projectUser.displayName);
				expect(displayName).toBeInTheDocument();
			});

			const email = screen.getByText(projectUser.email);
			expect(email).toBeInTheDocument();
		}
		const editButtons = screen.getAllByTestId('remove-member-btn');
		expect(editButtons.length).not.toBe(0);
	});

	it('does not render edit button or permission select for non admins', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);
		setUser(memberUser);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers projectId={projectId} />);

		const removeMemberButtons =
			screen.queryAllByTestId('remove-member-btn');
		expect(removeMemberButtons.length).toBe(0);

		const permissionSelects = screen.queryAllByTestId('permission-select');
		expect(permissionSelects.length).toBe(0);
	});

	it('does not render edit button or permission select for current admin user', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);
		setUser(adminUser);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce([projectUsers[0]]);

		render(<ProjectMembers projectId={projectId} />);

		await waitFor(() => {
			const removeMemberButtons =
				screen.queryAllByTestId('remove-member-btn');
			expect(removeMemberButtons.length).toBe(0);
		});

		const permissionSelects = screen.queryAllByTestId('permission-select');
		expect(permissionSelects.length).toBe(0);
	});

	it('changes permission of a user by selecting one from dropdown', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);
		setUser(adminUser);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers projectId={projectId} />);

		await waitFor(() => {
			const [permissionSelect] =
				screen.getAllByTestId('permission-select');
			expect(permissionSelect).toBeInTheDocument();
			fireEvent.change(permissionSelect, {
				target: { value: AccessPermission.ADMIN },
			});
		});

		handleUpdateUserToPermissionSpy.mockResolvedValueOnce(memberUser);

		expect(handleUpdateUserToPermissionSpy).toHaveBeenCalledWith({
			projectId,
			data: {
				userId: memberUser.id,
				permission: AccessPermission.ADMIN,
			},
		});
	});

	it('does not remove a user if removalUserId is null', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);
		setUser(adminUser);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers projectId={projectId} />);

		const confirmButton = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(confirmButton);

		expect(handleRemoveUserFromProjectSpy).not.toHaveBeenCalled();
	});

	it('removes a user from project', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);
		setUser(adminUser);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers projectId={projectId} />);

		await waitFor(() => {
			const [removeMemberButton] =
				screen.getAllByTestId('remove-member-btn');
			expect(removeMemberButton).toBeInTheDocument();
			fireEvent.click(removeMemberButton);
		});

		const confirmButton = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(confirmButton);

		expect(handleRemoveUserFromProjectSpy).toHaveBeenCalledWith({
			projectId,
			userId: memberUser.id,
		});
	});

	it('shows error when unable to remove user', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);
		setUser(adminUser);
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers projectId={projectId} />);

		await waitFor(() => {
			const [removeMemberButton] =
				screen.getAllByTestId('remove-member-btn');
			fireEvent.click(removeMemberButton);
		});

		handleRemoveUserFromProjectSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to remove user', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const confirmButton = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(confirmButton);

		const errorToast = screen.getByText('unable to remove user');
		expect(errorToast).toBeInTheDocument();
	});
});
