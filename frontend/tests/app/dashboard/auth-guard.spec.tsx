import { nextRouterMock } from 'tests/mocks';
import { render } from 'tests/test-utils';

import AuthGuard from '@/app/dashboard/auth-guard';
import * as userStore from '@/stores/user-store';

describe('AuthGuard tests', () => {
	it('redirects to home page if user is not present', () => {
		const spy = vi.spyOn(userStore, 'useUser');
		spy.mockReturnValue(null);
		expect(nextRouterMock.replace).not.toHaveBeenCalled();
		render(<AuthGuard />);
		expect(nextRouterMock.replace).toHaveBeenCalled();
	});

	it('does not redirect to home page if user is present', () => {
		const spy = vi.spyOn(userStore, 'useUser');
		spy.mockReturnValue({ uid: 'test' } as any);
		expect(nextRouterMock.replace).not.toHaveBeenCalled();
		render(<AuthGuard />);
		expect(nextRouterMock.replace).not.toHaveBeenCalled();
	});
});
