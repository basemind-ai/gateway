import { mockPage, mockReady } from 'tests/mocks';
import { render, waitFor } from 'tests/test-utils';

import PrivacyPolicyPage from '@/app/[locale]/privacy-policy/page';

vi.mock('next-intl/server');

describe('Privacy Policy Page', () => {
	it('calls page track', async () => {
		render(<PrivacyPolicyPage params={{ locale: 'en' }} />);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				'privacy_policy',
				expect.any(Object),
			);
		});
	});
});
