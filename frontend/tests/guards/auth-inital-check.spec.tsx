import { routerReplaceMock } from 'tests/mocks';
import { render, waitFor } from 'tests/test-utils';
import { Mock, vi } from 'vitest';

import { Navigation } from '@/constants';
import AuthInitialCheck from '@/guards/auth-inital-check';
import { getFirebaseAuth } from '@/utils/firebase';

vi.mock('@/utils/firebase');

describe('AuthInitialCheck tests', () => {
	it('should not call router.replace if user is not present', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: null,
			};
		});
		render(<AuthInitialCheck />);
		await waitFor(() => {
			expect(routerReplaceMock).not.toHaveBeenCalled();
		});
	});

	it('should call router.replace with projects url if user is present', async () => {
		(getFirebaseAuth as Mock).mockImplementationOnce(() => {
			return {
				currentUser: { displayName: 'test' },
			};
		});
		render(<AuthInitialCheck />);
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.Projects);
		});
	});
});
