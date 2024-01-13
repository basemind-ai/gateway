import { act } from 'react-dom/test-utils';
import { ProjectFactory, ProjectUserAccountFactory } from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import * as ProjectUsersAPI from '@/api/project-users-api';
import { ProjectMembers } from '@/components/projects/[projectId]/project-members';
import { ApiError } from '@/errors';
import { useSetUser } from '@/stores/api-store';
import { AccessPermission } from '@/types';

describe('ProjectMembers', () => {
	const project = ProjectFactory.buildSync();

	const handleRetrieveProjectUsersSpy = vi.spyOn(
		ProjectUsersAPI,
		'handleRetrieveProjectUsers',
	);

	const projectUsers = ProjectUserAccountFactory.batchSync(2);

	projectUsers[0].permission = AccessPermission.ADMIN;
	projectUsers[1].permission = AccessPermission.MEMBER;
	projectUsers[1].photoUrl = '';

	const [adminUser, memberUser] = projectUsers;

	it('renders project members', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		for (const projectUser of projectUsers) {
			await waitFor(() => {
				const displayName = screen.getByText(projectUser.displayName);
				expect(displayName).toBeInTheDocument();
			});

			const email = screen.getByText(projectUser.email);
			expect(email).toBeInTheDocument();
		}
		const editButtons = screen.getAllByTestId('remove-project-user-button');
		expect(editButtons.length).not.toBe(0);
	});

	it('removes a user from project', async () => {
		const handleRemoveUserFromProjectSpy = vi.spyOn(
			ProjectUsersAPI,
			'handleRemoveUserFromProject',
		);

		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		let removeMemberButton: HTMLButtonElement;
		await waitFor(() => {
			const [button] = screen.getAllByTestId(
				'remove-project-user-button',
			);

			expect(button).toBeInTheDocument();
			removeMemberButton = button as HTMLButtonElement;
		});

		fireEvent.click(removeMemberButton!);

		const confirmButton = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(confirmButton);

		expect(handleRemoveUserFromProjectSpy).toHaveBeenCalledWith({
			projectId: project.id,
			userId: memberUser.id,
		});
	});

	it('shows error when unable to remove user', async () => {
		const handleRemoveUserFromProjectSpy = vi.spyOn(
			ProjectUsersAPI,
			'handleRemoveUserFromProject',
		);
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		let removeMemberButton: HTMLButtonElement;

		await waitFor(() => {
			const [button] = screen.getAllByTestId(
				'remove-project-user-button',
			);
			expect(button).toBeInTheDocument();
			removeMemberButton = button as HTMLButtonElement;
		});

		fireEvent.click(removeMemberButton!);

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

	it('closes the remove user modal when pressing cancel', async () => {
		const handleRemoveUserFromProjectSpy = vi.spyOn(
			ProjectUsersAPI,
			'handleRemoveUserFromProject',
		);
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		let removeMemberButton: HTMLButtonElement;
		await waitFor(() => {
			const [button] = screen.getAllByTestId(
				'remove-project-user-button',
			);

			expect(button).toBeInTheDocument();
			removeMemberButton = button as HTMLButtonElement;
		});

		fireEvent.click(removeMemberButton!);

		const cancelButton = screen.getByTestId('resource-deletion-cancel-btn');
		fireEvent.click(cancelButton);

		expect(handleRemoveUserFromProjectSpy).not.toHaveBeenCalled();
	});

	it('opens the edit user permission modal when pressing edit', async () => {
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		let editMemberButton: HTMLButtonElement;
		await waitFor(() => {
			const [button] = screen.getAllByTestId('edit-project-user-button');

			expect(button).toBeInTheDocument();
			editMemberButton = button as HTMLButtonElement;
		});

		fireEvent.click(editMemberButton!);

		const editModal = screen.getByTestId('edit-project-user-modal');
		expect(editModal).toBeInTheDocument();
	});

	it('closes the edit user permission modal when pressing cancel', async () => {
		const handleUpdateUserToPermissionSpy = vi.spyOn(
			ProjectUsersAPI,
			'handleUpdateUserPermission',
		);
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});
		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		let editMemberButton: HTMLButtonElement;
		await waitFor(() => {
			const [button] = screen.getAllByTestId('edit-project-user-button');

			expect(button).toBeInTheDocument();
			editMemberButton = button as HTMLButtonElement;
		});

		fireEvent.click(editMemberButton!);

		const cancelButton = screen.getByTestId(
			'edit-project-user-modal-cancel-button',
		);
		fireEvent.click(cancelButton);

		expect(handleUpdateUserToPermissionSpy).not.toHaveBeenCalled();
	});

	it('updates user permission when pressing continue', async () => {
		const handleUpdateUserToPermissionSpy = vi.spyOn(
			ProjectUsersAPI,
			'handleUpdateUserPermission',
		);
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		let editMemberButton: HTMLButtonElement;
		await waitFor(() => {
			const [button] = screen.getAllByTestId('edit-project-user-button');

			expect(button).toBeInTheDocument();
			editMemberButton = button as HTMLButtonElement;
		});

		fireEvent.click(editMemberButton!);

		const permissionSelect = screen.getByTestId(
			'edit-project-user-modal-permission-select',
		);
		fireEvent.change(permissionSelect, {
			target: { value: AccessPermission.MEMBER },
		});

		const continueButton = screen.getByTestId(
			'edit-project-user-modal-continue-button',
		);
		fireEvent.click(continueButton);

		expect(handleUpdateUserToPermissionSpy).toHaveBeenCalledWith({
			data: {
				permission: AccessPermission.MEMBER,
				userId: memberUser.id,
			},
			projectId: project.id,
		});
	});

	it('shows error when unable to update user permission', async () => {
		const handleUpdateUserToPermissionSpy = vi.spyOn(
			ProjectUsersAPI,
			'handleUpdateUserPermission',
		);
		const {
			result: { current: setUser },
		} = renderHook(useSetUser);

		act(() => {
			setUser(adminUser);
		});

		handleRetrieveProjectUsersSpy.mockResolvedValueOnce(projectUsers);

		render(<ProjectMembers project={project} />);

		let editMemberButton: HTMLButtonElement;
		await waitFor(() => {
			const [button] = screen.getAllByTestId('edit-project-user-button');

			expect(button).toBeInTheDocument();
			editMemberButton = button as HTMLButtonElement;
		});

		fireEvent.click(editMemberButton!);

		const permissionSelect = screen.getByTestId(
			'edit-project-user-modal-permission-select',
		);
		fireEvent.change(permissionSelect, {
			target: { value: AccessPermission.MEMBER },
		});

		handleUpdateUserToPermissionSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to update user permission', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});

		const continueButton = screen.getByTestId(
			'edit-project-user-modal-continue-button',
		);
		fireEvent.click(continueButton);

		const errorToast = screen.getByText('unable to update user permission');
		expect(errorToast).toBeInTheDocument();
	});
});
