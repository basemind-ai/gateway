import { render, waitFor } from 'tests/test-utils';

import PrivacyPolicyPage from '@/app/[locale]/privacy-policy/page';
import { usePageTracking } from '@/hooks/use-page-tracking';

describe('Privacy Policy Page', () => {
	it('call page tracking hook', async () => {
		render(<PrivacyPolicyPage />);
		await waitFor(() => {
			expect(usePageTracking).toHaveBeenCalledWith('privacy-policy');
		});
	});
});
