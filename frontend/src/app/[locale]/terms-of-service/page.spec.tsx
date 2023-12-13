import { mockPage, mockReady } from 'tests/mocks';
import { render, waitFor } from 'tests/test-utils';

import TermsOfServicePage from '@/app/[locale]/terms-of-service/page';

describe('Terms of Service Page', () => {
	it('calls page tracking hook', async () => {
		render(<TermsOfServicePage />);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockPage).toHaveBeenCalledWith(
				'terms-of-service',
				expect.any(Object),
			);
		});
	});
});
