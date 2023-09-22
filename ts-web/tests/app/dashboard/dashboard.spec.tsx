import {
	fireEvent,
	render,
	routerReplaceMock,
	screen,
	waitFor,
} from 'tests/test-utils';

import Dashboard from '@/app/dashboard/page';

const mockDisplayName = 'testUser';
const signOutMock = vi.fn();

vi.mock('@/stores/user-store', () => ({
	useUser: () => ({ displayName: mockDisplayName }),
}));

vi.mock('@/utils/firebase', () => ({
	getFirebaseAuth: () => ({ signOut: signOutMock }),
}));

describe('Dashboard page tests', () => {
	it('handles logout', async () => {
		render(<Dashboard />);

		const logoutButton = screen.getByTestId<HTMLButtonElement>(
			'dashboard-logout-btn',
		);

		fireEvent.click(logoutButton);

		await waitFor(() => {
			expect(signOutMock).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith('/');
		});
	});
});
