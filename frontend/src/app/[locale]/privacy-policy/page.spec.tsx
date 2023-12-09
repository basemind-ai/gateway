import { render, waitFor } from 'tests/test-utils';

import PrivacyPolicyPage from '@/app/[locale]/privacy-policy/page';
import { useTrackPage } from '@/hooks/use-track-page';

describe('Privacy Policy Page', () => {
	it('calls page tracking hook', async () => {
		render(<PrivacyPolicyPage />);
		await waitFor(() => {
			expect(useTrackPage).toHaveBeenCalledWith('privacy-policy');
		});
	});
});
