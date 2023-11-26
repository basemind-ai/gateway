import { screen, waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import {
	fireEvent,
	render,
	renderHook,
	routerReplaceMock,
} from 'tests/test-utils';

import * as UsersAPI from '@/api/users-api';
import { DeleteAccountView } from '@/components/settings/delete-account-view';
import { Navigation } from '@/constants';
import { useSetUser, useUser } from '@/stores/api-store';

describe('user account deletion tests', () => {
	const handleDeleteUserAccountSpy = vi
		.spyOn(UsersAPI, 'handleDeleteUserAccount')
		.mockResolvedValue();
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('userSettings'));
	const mockUser = {
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		phoneNumber: '',
		photoURL: 'https://picsum.photos/200',
		providerId: '',
		uid: '',
	};
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();

	it('should render headline', () => {
		render(<DeleteAccountView user={mockUser} />);
		const headline = screen.getByText(t('headlineDeleteCard'));
		expect(headline).toBeInTheDocument();
	});
	it('should render delete button', () => {
		render(<DeleteAccountView user={mockUser} />);
		const deleteButton = screen.getByTestId('account-delete-btn');
		expect(deleteButton).toBeInTheDocument();
	});
	it('clicking on delete account show open delete account modal', async () => {
		render(<DeleteAccountView user={mockUser} />);
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
			UsersAPI,
			'handleDeleteUserAccount',
		);
		render(<DeleteAccountView user={mockUser} />);
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

		render(<DeleteAccountView user={mockUser} />);

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
			expect(userResult.current).toBeNull();
		});
	});

	it('deleting account should route to landing page', async () => {
		handleDeleteUserAccountSpy.mockResolvedValueOnce();
		render(<DeleteAccountView user={mockUser} />);
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
		render(<DeleteAccountView user={mockUser} />);
		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		fireEvent.click(deleteAccountButton);
		const deleteAccountModal = await screen.findByTestId(
			'delete-account-modal',
		);
		expect(deleteAccountModal).toBeInTheDocument();
	});

	it('clicking on delete confirmation modal close button should close the modal', async () => {
		const dialogCloseSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');
		render(<DeleteAccountView user={mockUser} />);
		const deleteAccountButton =
			await screen.findByTestId('account-delete-btn');
		fireEvent.click(deleteAccountButton);
		// add input to enable delete button
		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, { target: { value: mockUser.email } });
		const deleteAccountModalCloseButton = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deleteAccountModalCloseButton);
		await waitFor(() => {
			expect(dialogCloseSpy).toHaveBeenCalled();
		});
	});
});
