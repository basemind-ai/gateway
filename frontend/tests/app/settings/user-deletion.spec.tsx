import { screen, waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import {
	fireEvent,
	render,
	renderHook,
	routerReplaceMock,
} from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import { AccountDeletion } from '@/components/settings/account-deletion';
import { Navigation } from '@/constants';
import { useSetUser, useUser } from '@/stores/api-store';

describe('user account deletion tests', () => {
	const handleDeleteUserAccountSpy = vi.spyOn(
		ApplicationAPI,
		'handleDeleteUserAccount',
	);
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('userSettings'));
	const mockUser = {
		phoneNumber: '',
		providerId: '',
		uid: '',
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		photoURL: 'https://picsum.photos/200',
	};
	it('should render headline', () => {
		render(<AccountDeletion user={mockUser} />);
		const headline = screen.getByText(t('headlineDeleteCard'));
		expect(headline).toBeInTheDocument();
	});
	it('should render delete button', () => {
		render(<AccountDeletion user={mockUser} />);
		const deleteButton = screen.getByTestId('account-delete-btn');
		expect(deleteButton).toBeInTheDocument();
	});
	it('delete button is disabled when user in not authenticated', async () => {
		render(<AccountDeletion user={null} />);
		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		expect(deleteAccountButton).toBeDisabled();
	});
	it('clicking on delete account show open delete account modal', async () => {
		render(<AccountDeletion user={mockUser} />);
		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		fireEvent.click(deleteAccountButton);
		const deleteAccountModal = await screen.findByTestId(
			'delete-account-modal',
		);
		expect(deleteAccountModal).toBeInTheDocument();
	});

	it('clicking on delete account modal delete button should call backend to delete the account', async () => {
		const handleDeleteUserAccountSpy = vi.spyOn(
			ApplicationAPI,
			'handleDeleteUserAccount',
		);
		render(<AccountDeletion user={mockUser} />);
		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		fireEvent.click(deleteAccountButton);
		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: mockUser.email },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			expect(handleDeleteUserAccountSpy).toHaveBeenCalledOnce();
		});
	});

	it('deleting account should remove user from store', async () => {
		handleDeleteUserAccountSpy.mockResolvedValueOnce();
		const { result: setResult } = renderHook(() => useSetUser());
		setResult.current(mockUser);

		const { result: userResult } = renderHook(() => useUser());
		expect(userResult.current).toEqual(mockUser);

		render(<AccountDeletion user={mockUser} />);

		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		fireEvent.click(deleteAccountButton);

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, { target: { value: mockUser.email } });

		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		// Wait for deleteUserAccount to resolve and rerender the hook
		await waitFor(() => {
			expect(userResult.current).toBeNull();
		});
	});

	it('deleting account should route to landing page', async () => {
		handleDeleteUserAccountSpy.mockResolvedValueOnce();
		render(<AccountDeletion user={mockUser} />);
		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		fireEvent.click(deleteAccountButton);

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, { target: { value: mockUser.email } });

		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.Base);
		});
	});

	it('clicking on delete button should open delete confirmation modal', async () => {
		render(<AccountDeletion user={mockUser} />);
		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		fireEvent.click(deleteAccountButton);
		const deleteAccountModal = await screen.findByTestId(
			'delete-account-modal',
		);
		expect(deleteAccountModal).toBeInTheDocument();
	});
});
