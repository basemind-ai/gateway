import { nextRouterMock } from 'tests/mocks';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';

import { LogoutButton } from '@/components/logout-button';

const signOutMock = vi.fn();

vi.mock('@/utils/firebase', () => ({
	getFirebaseAuth: () => ({ signOut: signOutMock }),
}));

describe('LogoutButton tests', () => {
	it('renders logout button', () => {
		render(<LogoutButton />);

		const logoutButton = screen.getByTestId('dashboard-logout-btn');

		expect(logoutButton).toBeInTheDocument();
	});

	it('redirects to home page after logout', async () => {
		render(<LogoutButton />);

		const logoutButton = screen.getByTestId('dashboard-logout-btn');
		fireEvent.click(logoutButton);

		await waitFor(() => {
			expect(signOutMock).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(nextRouterMock.replace).toHaveBeenCalled();
		});
	});
});
