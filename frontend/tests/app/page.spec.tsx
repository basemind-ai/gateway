import { render, routerReplaceMock, screen, waitFor } from 'tests/test-utils';
import { Mock, vi } from 'vitest';

import Home from '@/app/page';
import { Navigation } from '@/constants';
import { getFirebaseAuth } from '@/utils/firebase';

vi.mock('@/utils/firebase');
(getFirebaseAuth as Mock).mockImplementation(() => {
	return {
		currentUser: null,
	};
});
describe('Home page tests', () => {
	it('renders signupButton', () => {
		render(<Home />);
		const signupButton = screen.getByTestId('sign-in-link');
		expect(signupButton).toBeInTheDocument();
	});

	it('should call router.replace with projects url if user is present', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: { displayName: 'test' },
			};
		});
		render(<Home />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.Projects);
		});
	});
});
