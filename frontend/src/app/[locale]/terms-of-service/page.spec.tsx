import { render, waitFor } from 'tests/test-utils';

import TermsOfServicePage from '@/app/[locale]/terms-of-service/page';
import { usePageTracking } from '@/hooks/use-page-tracking';

describe('Terms of Service Page', () => {
	it('call page tracking hook', async () => {
		render(<TermsOfServicePage />);
		await waitFor(() => {
			expect(usePageTracking).toHaveBeenCalledWith('terms-of-service');
		});
	});
});
